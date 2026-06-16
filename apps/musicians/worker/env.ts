// Worker runtime bindings + edge-cache policy (Phase C).
//
// `@cloudflare/workers-types` supplies `Fetcher`/`Request`/`Response`/
// `HTMLRewriter` globally (see tsconfig.worker.json `types`), so we only
// declare the project-specific binding shape here.

export interface Env {
  /** Static-assets binding (wrangler.musicians.jsonc → ./apps/musicians/dist).
   * `not_found_handling: single-page-application` is applied by `.fetch`. */
  ASSETS: Fetcher
  /** Aura HTTP Query API base, e.g. `https://<id>.databases.neo4j.io`.
   * From Cloudflare env / local `.dev.vars` — never bundled (landmine 12). */
  NEO4J_URI?: string
  NEO4J_USERNAME?: string
  NEO4J_PASSWORD?: string
  /** Aura database name. Aura Free defaults to `neo4j`, but Enterprise/AuraDS
   * or self-managed instances can use a custom name — the HTTP Query API path
   * is `/db/<database>/query/v2`, so this must be configurable, not hardcoded.
   * Optional; falls back to `neo4j` when unset. */
  NEO4J_DATABASE?: string
}

/** Edge `Cache-Control` per endpoint (technical note "API shape").
 * `s-maxage` drives the Cloudflare edge cache; `max-age` the browser. */
export const CACHE = {
  /** Curated home list — rarely changes. */
  curated: 'public, max-age=3600, s-maxage=43200', // 12h edge
  /** Musician detail — Aura updates every 4h, 1–2h is safe. */
  detail: 'public, max-age=900, s-maxage=5400', // 1.5h edge
  /** Autosuggest corpus — mild eventual consistency accepted. */
  searchIndex: 'public, max-age=1800, s-maxage=21600', // 6h edge
  /** Health probe — never cached (wake-up cron needs a live hit). */
  health: 'no-store',
  /** Sitemap — derived from the search corpus; same posture. */
  sitemap: 'public, max-age=1800, s-maxage=21600', // 6h edge
} as const

/** Abort the Aura request at ~9s → `503 {status:"waking"}` (Aura Free
 * auto-pauses after 3 days idle; cold start is 20–40s; technical note
 * "Aura wake-up handling"). */
export const AURA_TIMEOUT_MS = 9000

/** Seconds the client should wait before retrying a cold/`waking` Aura. */
export const WAKING_RETRY_AFTER = 10

/** Server-side retries for a TRANSIENT Worker→Aura subrequest network failure
 * — `fetch` itself threw BEFORE any HTTP response (TLS reset, connection
 * refused, DNS blip). 1 retry = 2 attempts total. This recovers a flaky
 * connection server-side so it never reaches the user.
 *
 * Deliberately NARROW (see `fix/musicians-graph-unreachable` findings):
 *  - NOT retried on the 9s abort (cold Aura → the `waking` screen owns that
 *    with its own client countdown/auto-retry).
 *  - NOT retried on an HTTP error response (4xx/5xx came back — a retry of a
 *    Cypher/auth error is pointless).
 *  - Does NOT and CANNOT address the dominant reproduced failure, Cloudflare
 *    Error 1102 (`worker_exceeded_resources`): that is the runtime killing the
 *    isolate for CPU, surfaced as Cloudflare's own 503 page — uncatchable here,
 *    and a retry would only burn more of the rolling CPU budget. That needs the
 *    gated edge-cache / Cypher-cap / paid-tier levers, not a retry. */
export const AURA_FETCH_RETRIES = 1

/** Backoff between transient-fetch retries (ms). Short — a connection blip
 * fails fast, so this only adds a brief pause, never near the 9s abort. */
export const AURA_RETRY_BACKOFF_MS = 250
