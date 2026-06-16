// Neo4j Aura HTTP Query API client (Phase C).
//
// `fetch` ONLY — NEVER `neo4j-driver` (Cloudflare V8 has no Node net stack;
// landmine 3). Endpoint + payload + response shape per the Aura Query API v2
// (`POST /db/neo4j/query/v2`, Basic auth, `{statement, parameters}` →
// `{data:{fields,values}}` | `{errors:[…]}`; confirmed via Context7).
//
// All callers pass PARAMETERIZED, READ-ONLY Cypher (BFF/Cypher conventions).
// On a cold Aura (auto-pause after 3 days idle, 20–40s cold start) the
// AbortController fires at ~9s and the BFF surfaces the frozen
// `WakingResponse` 503 (review N1: NOT the A-stub `{status:"not-implemented"}`).

import {
  AURA_FETCH_RETRIES,
  AURA_RETRY_BACKOFF_MS,
  AURA_TIMEOUT_MS,
} from './env'

/** A single Aura Query API result: column names + row tuples. */
export interface AuraResult {
  fields: string[]
  /** One entry per row; each is a positional tuple aligned to `fields`. */
  values: unknown[][]
}

/** Thrown when the Aura request times out (cold instance) — the router maps
 * this to the frozen `WakingResponse` 503 + `Retry-After`. */
export class AuraWakingError extends Error {
  constructor() {
    super('aura-waking')
    this.name = 'AuraWakingError'
  }
}

/** Thrown for any non-timeout Aura failure (auth, HTTP, Cypher error). */
export class AuraQueryError extends Error {
  readonly detail?: unknown
  constructor(message: string, detail?: unknown) {
    super(message)
    this.name = 'AuraQueryError'
    this.detail = detail
  }
}

export interface AuraCreds {
  uri: string
  username: string
  password: string
  /** Aura database name. Optional; defaults to `neo4j` (Aura Free) when
   * absent. Enterprise/AuraDS/self-managed instances can use a custom name —
   * the Query API path is `/db/<database>/query/v2`. */
  database?: string
}

interface AuraQueryV2Body {
  data?: { fields?: unknown; values?: unknown }
  errors?: { code?: string; message?: string }[]
}

function basicAuth(username: string, password: string): string {
  // btoa is available in the Workers runtime (and Node 26 / jsdom test env).
  return 'Basic ' + btoa(`${username}:${password}`)
}

/** Default backoff sleep — overridable in tests via `AuraQueryOptions.sleep`. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Tunables for `auraQuery` — defaulted from `env`, injectable for tests. */
export interface AuraQueryOptions {
  /** Transient-fetch-failure retries (see `AURA_FETCH_RETRIES`). */
  retries?: number
  /** Backoff between retries, ms (see `AURA_RETRY_BACKOFF_MS`). */
  backoffMs?: number
  /** Injectable sleep so tests don't wait real time. */
  sleep?: (ms: number) => Promise<void>
}

/**
 * Normalise an Aura connection URI to the HTTP Query API base.
 *
 * Aura hands out a **Bolt** URI (`neo4j+s://<id>.databases.neo4j.io`,
 * sometimes with the Bolt port `:7687`) but the Query API speaks HTTPS at
 * `https://<id>.databases.neo4j.io` (no Bolt port). The same credentials are
 * shared between Bolt + HTTP, so `.dev.vars`/CF env can carry either form;
 * we rewrite Bolt schemes → https and drop the Bolt port. An already-https
 * URI passes through unchanged.
 */
export function httpQueryBase(uri: string): string {
  let u = uri.trim().replace(/\/+$/, '')
  u = u.replace(/^(?:neo4j|bolt)(?:\+s|\+ssc)?:\/\//i, 'https://')
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`
  // Drop an explicit Bolt port (7687) — the HTTPS API listens on 443.
  u = u.replace(/:7687(?=$|\/)/, '')
  return u
}

/** Build the Aura Query API v2 endpoint. The database segment is configurable
 * (`/db/<database>/query/v2`) — Aura Free is `neo4j` but Enterprise/AuraDS/
 * self-managed can differ; hardcoding `neo4j` made every non-default instance
 * fail with `DatabaseNotFound`. Falls back to `neo4j` when unset. */
function queryEndpoint(uri: string, database?: string): string {
  const db = database && database.trim() ? database.trim() : 'neo4j'
  return `${httpQueryBase(uri)}/db/${encodeURIComponent(db)}/query/v2`
}

/**
 * Run one parameterized read-only Cypher statement against Aura.
 *
 * @throws {AuraWakingError} the request exceeded `AURA_TIMEOUT_MS` (cold Aura)
 * @throws {AuraQueryError}  auth / HTTP / Cypher / shape failure
 */
export async function auraQuery(
  creds: AuraCreds,
  statement: string,
  parameters: Record<string, unknown> = {},
  fetchImpl: typeof fetch = fetch,
  opts: AuraQueryOptions = {},
): Promise<AuraResult> {
  const retries = opts.retries ?? AURA_FETCH_RETRIES
  const backoffMs = opts.backoffMs ?? AURA_RETRY_BACKOFF_MS
  const sleep = opts.sleep ?? delay

  // Retry ONLY a transient subrequest failure (fetch threw before any HTTP
  // response). Each attempt gets a fresh 9s abort budget. An abort (cold Aura)
  // throws AuraWakingError immediately — never retried. An HTTP response (ok or
  // not) breaks out and is handled below — never retried. Retrying here is
  // cheap + safe: it happens BEFORE the body parse/reshape, so it adds no
  // CPU to the heavy path and cannot worsen the Error-1102 budget (#155).
  let res: Response
  for (let attempt = 0; ; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), AURA_TIMEOUT_MS)
    try {
      res = await fetchImpl(queryEndpoint(creds.uri, creds.database), {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: basicAuth(creds.username, creds.password),
        },
        body: JSON.stringify({ statement, parameters }),
      })
      break
    } catch (err) {
      if (controller.signal.aborted) throw new AuraWakingError()
      if (attempt < retries) {
        await sleep(backoffMs)
        continue
      }
      throw new AuraQueryError('aura-fetch-failed', err)
    } finally {
      clearTimeout(timer)
    }
  }

  if (!res.ok) {
    // Aura can also stall with a 5xx while resuming — treat as waking.
    if (res.status === 503 || res.status === 504) throw new AuraWakingError()
    throw new AuraQueryError(`aura-http-${res.status}`)
  }

  let body: AuraQueryV2Body
  try {
    body = (await res.json()) as AuraQueryV2Body
  } catch (err) {
    throw new AuraQueryError('aura-bad-json', err)
  }

  if (body.errors && body.errors.length > 0) {
    throw new AuraQueryError('aura-cypher-error', body.errors)
  }

  const fields = body.data?.fields
  const values = body.data?.values
  if (!Array.isArray(fields) || !Array.isArray(values)) {
    throw new AuraQueryError('aura-unexpected-shape', body)
  }
  return {
    fields: fields.filter((f): f is string => typeof f === 'string'),
    values: values.filter((v): v is unknown[] => Array.isArray(v)),
  }
}

/** Index helper: value of column `name` in `row` (undefined if absent).
 * `noUncheckedIndexedAccess`-safe. */
export function col(
  result: AuraResult,
  row: unknown[],
  name: string,
): unknown {
  const i = result.fields.indexOf(name)
  if (i === -1) return undefined
  return row[i]
}
