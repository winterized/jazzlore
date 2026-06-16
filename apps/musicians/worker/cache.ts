// Read-through Cache API layer for the CPU-heavy detail pipeline (option A,
// fix/musicians-graph-unreachable).
//
// Confirmed root cause: the `/api/musicians/:id` reshape trips Cloudflare
// Error 1102 (`worker_exceeded_resources`, free-tier 10ms CPU) on high-degree
// nodes (Miles Davis = 113 records / 418 collaborators, Coltrane, Monk).
// Amplifier: `cf-cache-status` is absent on every response, so the AUTOMATIC
// edge cache never populates and every request re-runs the heavy
// query-plus-reshape. A manual `caches.default` read-through lets repeat
// requests for the same musician skip the pipeline entirely.
//
// CORRECTNESS: we cache the JSON DATA response only — NEVER the post-injection
// HTML. The `/musicians/:id` document path injects per-musician OG/meta via
// HTMLRewriter gated on `Accept: text/html` (worker/og.ts); caching rendered
// HTML keyed by URL could populate from a non-injected request and then serve
// the wrong variant to a browser or Googlebot, silently breaking SEO. The JSON
// response has no Accept-gated variant, so it is the safe cache target. The
// HTML document path and og.ts are left untouched.

/** Minimal Cache API surface — `caches.default` in the Workers runtime, or an
 * injected fake in tests (Node/vitest has no `caches` global). */
export interface CacheLike {
  match(key: Request): Promise<Response | undefined>
  put(key: Request, response: Response): Promise<void>
}

/** Cache dependencies resolved from the runtime, injectable for tests. */
export interface CacheDeps {
  /** `caches.default`, or `null` when the runtime has no Cache API (tests). */
  cache: CacheLike | null
  /** `ctx.waitUntil`, or a no-op when absent — the cache write runs OFF the
   * response path so it adds no latency or CPU to the response. */
  waitUntil: (p: Promise<unknown>) => void
}

/** Synthetic cache-key origin — deliberately NOT the live URL. Keeps the live
 * 307 raw-colon redirect and the repro `?cb=` cache-busters out of the key,
 * and (with `normalizeMusicianId`) collapses the raw-colon vs percent-encoded
 * id forms to ONE entry. */
const CACHE_KEY_ORIGIN = 'https://jazzlore-cache.internal/musician/'

/** Normalize a musician id so `wikidata:Q93341` and `wikidata%3AQ93341` map to
 * ONE cache entry. `decodeURIComponent` is idempotent on an already-decoded id;
 * a malformed percent sequence is left as-is (never throws). */
export function normalizeMusicianId(raw: string): string {
  const s = raw.trim()
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

/** Build the stable synthetic cache key for a musician detail response. */
export function musicianCacheKey(rawId: string): Request {
  return new Request(CACHE_KEY_ORIGIN + encodeURIComponent(normalizeMusicianId(rawId)))
}

export interface ReadThroughOptions {
  /** `Cache-Control` stamped on the CACHED copy → drives the Cache API TTL. */
  ttl: string
}

/**
 * Read-through cache. Returns a cached 200 if present (`x-jazzlore-cache: hit`),
 * else runs `produce`, and ONLY if it is HTTP 200 stores a clone (OFF the
 * response path via `waitUntil`) before returning it (`x-jazzlore-cache: miss`).
 *
 * Invariants:
 *  - NEVER caches a non-200. Caching a 503/1102 would pin the error and serve
 *    it to everyone until expiry — the single most important rule here.
 *  - Strips `Set-Cookie` before `put` (`caches.default.put` rejects responses
 *    carrying it).
 *  - When no Cache API is available (`cache: null`, e.g. tests) it degrades to
 *    always-produce and tags `x-jazzlore-cache: bypass`.
 */
export async function readThroughCache(
  deps: CacheDeps,
  key: Request,
  opts: ReadThroughOptions,
  produce: () => Promise<Response>,
): Promise<Response> {
  if (deps.cache) {
    const cached = await deps.cache.match(key)
    if (cached) {
      // Reconstruct so the header is mutable (cache-match responses can be
      // immutable) and the cached body stream is consumed by THIS response.
      const hit = new Response(cached.body, cached)
      hit.headers.set('x-jazzlore-cache', 'hit')
      return hit
    }
  }

  const res = await produce()

  if (deps.cache && res.status === 200) {
    const headers = new Headers(res.headers)
    headers.delete('Set-Cookie')
    headers.set('Cache-Control', opts.ttl)
    // Clone BEFORE the response body is returned/consumed below.
    const toCache = new Response(res.clone().body, {
      status: res.status,
      statusText: res.statusText,
      headers,
    })
    deps.waitUntil(deps.cache.put(key, toCache))
  }

  res.headers.set('x-jazzlore-cache', deps.cache ? 'miss' : 'bypass')
  return res
}

/** Resolve cache deps from the Workers runtime. `caches.default` is absent in
 * Node/vitest, so `cache` is `null` there and the read-through degrades to
 * always-produce. `waitUntil` falls back to a no-op when `ctx` is absent. */
export function runtimeCacheDeps(ctx?: ExecutionContext): CacheDeps {
  // `caches.default` is a Cloudflare extension to the standard CacheStorage;
  // the DOM lib's type omits it, so reach it through a narrow cast. Absent in
  // Node/vitest → `cache: null` (read-through degrades to always-produce).
  const cacheStorage =
    typeof caches !== 'undefined'
      ? (caches as unknown as { default?: CacheLike })
      : undefined
  return {
    cache: cacheStorage?.default ?? null,
    waitUntil: ctx ? (p) => ctx.waitUntil(p) : () => {},
  }
}
