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

import { AURA_TIMEOUT_MS } from './env'

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
}

interface AuraQueryV2Body {
  data?: { fields?: unknown; values?: unknown }
  errors?: { code?: string; message?: string }[]
}

function basicAuth(username: string, password: string): string {
  // btoa is available in the Workers runtime (and Node 26 / jsdom test env).
  return 'Basic ' + btoa(`${username}:${password}`)
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

/** Strip a trailing slash so `${uri}/db/neo4j/query/v2` is well-formed. */
function queryEndpoint(uri: string): string {
  return `${httpQueryBase(uri)}/db/neo4j/query/v2`
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
): Promise<AuraResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), AURA_TIMEOUT_MS)
  let res: Response
  try {
    res = await fetchImpl(queryEndpoint(creds.uri), {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: basicAuth(creds.username, creds.password),
      },
      body: JSON.stringify({ statement, parameters }),
    })
  } catch (err) {
    if (controller.signal.aborted) throw new AuraWakingError()
    throw new AuraQueryError('aura-fetch-failed', err)
  } finally {
    clearTimeout(timer)
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
