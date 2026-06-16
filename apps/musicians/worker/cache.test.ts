import { describe, expect, it, vi } from 'vitest'
import {
  musicianCacheKey,
  normalizeMusicianId,
  readThroughCache,
  type CacheDeps,
  type CacheLike,
} from './cache'

/** In-memory CacheLike that stores by key URL. `put`/`match` clone so the
 * stored copy and each read get independent body streams (mirrors the Workers
 * Cache API). `put` stores synchronously before resolving so a follow-up
 * `match` in the same tick sees the entry (no test race). */
function fakeCache(): CacheLike & { store: Map<string, Response> } {
  const store = new Map<string, Response>()
  return {
    store,
    match: vi.fn(async (key: Request) => {
      const hit = store.get(key.url)
      return hit ? hit.clone() : undefined
    }),
    put: vi.fn((key: Request, res: Response) => {
      store.set(key.url, res.clone())
      return Promise.resolve()
    }),
  }
}

function depsWith(cache: CacheLike | null): CacheDeps & {
  waitUntil: ReturnType<typeof vi.fn>
} {
  const waitUntil = vi.fn((p: Promise<unknown>): void => {
    void p
  })
  return { cache, waitUntil }
}

const TTL = 'public, max-age=900, s-maxage=43200'

function json200(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

describe('normalizeMusicianId', () => {
  it('leaves an already-decoded raw-colon id unchanged', () => {
    expect(normalizeMusicianId('wikidata:Q93341')).toBe('wikidata:Q93341')
  })
  it('decodes the percent-encoded colon form to the raw-colon form', () => {
    expect(normalizeMusicianId('wikidata%3AQ93341')).toBe('wikidata:Q93341')
  })
  it('trims surrounding whitespace', () => {
    expect(normalizeMusicianId('  wikidata:Q93341  ')).toBe('wikidata:Q93341')
  })
  it('leaves a malformed percent sequence as-is (never throws)', () => {
    expect(normalizeMusicianId('wikidata:%E0%A4%A')).toBe('wikidata:%E0%A4%A')
  })
})

describe('musicianCacheKey', () => {
  it('maps the raw-colon and percent-encoded id forms to ONE key', () => {
    const a = musicianCacheKey('wikidata:Q93341')
    const b = musicianCacheKey('wikidata%3AQ93341')
    expect(a.url).toBe(b.url)
  })
  it('uses the synthetic internal origin, not the live URL', () => {
    expect(musicianCacheKey('wikidata:Q93341').url).toBe(
      'https://jazzlore-cache.internal/musician/wikidata%3AQ93341',
    )
  })
})

describe('readThroughCache', () => {
  it('returns a cached hit WITHOUT invoking the pipeline', async () => {
    const cache = fakeCache()
    cache.store.set(
      musicianCacheKey('wikidata:Q93341').url,
      json200({ name: 'Miles Davis' }),
    )
    const produce = vi.fn(async () => json200({ name: 'SHOULD NOT RUN' }))
    const res = await readThroughCache(
      depsWith(cache),
      musicianCacheKey('wikidata:Q93341'),
      { ttl: TTL },
      produce,
    )
    expect(produce).not.toHaveBeenCalled()
    expect(res.headers.get('x-jazzlore-cache')).toBe('hit')
    expect(await res.json()).toMatchObject({ name: 'Miles Davis' })
  })

  it('on a miss invokes the pipeline, caches the 200, and returns it', async () => {
    const cache = fakeCache()
    const deps = depsWith(cache)
    const produce = vi.fn(async () => json200({ name: 'Miles Davis' }))
    const key = musicianCacheKey('wikidata:Q93341')

    const res = await readThroughCache(deps, key, { ttl: TTL }, produce)

    expect(produce).toHaveBeenCalledTimes(1)
    expect(res.headers.get('x-jazzlore-cache')).toBe('miss')
    expect(await res.json()).toMatchObject({ name: 'Miles Davis' })
    // The put was scheduled off the response path via waitUntil.
    expect(deps.waitUntil).toHaveBeenCalledTimes(1)
    expect(cache.put).toHaveBeenCalledTimes(1)
    await deps.waitUntil.mock.calls[0]![0]
    const stored = cache.store.get(key.url)!
    expect(stored.status).toBe(200)
    // The cached copy carries the long TTL, not the per-endpoint default.
    expect(stored.headers.get('Cache-Control')).toBe(TTL)
  })

  it('NEVER caches a non-200 (a 503/1102 must not be pinned)', async () => {
    const cache = fakeCache()
    const deps = depsWith(cache)
    const produce = vi.fn(
      async () =>
        new Response(JSON.stringify({ status: 'waking', retryAfter: 10 }), {
          status: 503,
          headers: { 'Cache-Control': 'no-store' },
        }),
    )
    const res = await readThroughCache(
      deps,
      musicianCacheKey('wikidata:Q93341'),
      { ttl: TTL },
      produce,
    )
    expect(res.status).toBe(503)
    expect(produce).toHaveBeenCalledTimes(1)
    expect(cache.put).not.toHaveBeenCalled()
    expect(deps.waitUntil).not.toHaveBeenCalled()
  })

  it('does not cache a 404 either', async () => {
    const cache = fakeCache()
    const produce = vi.fn(
      async () =>
        new Response(JSON.stringify({ status: 'error', error: 'not-found' }), {
          status: 404,
        }),
    )
    const res = await readThroughCache(
      depsWith(cache),
      musicianCacheKey('nope:1'),
      { ttl: TTL },
      produce,
    )
    expect(res.status).toBe(404)
    expect(cache.put).not.toHaveBeenCalled()
  })

  it('strips Set-Cookie before caching (caches.default.put would reject it)', async () => {
    const cache = fakeCache()
    const deps = depsWith(cache)
    const produce = vi.fn(async () => {
      const r = json200({ name: 'Miles Davis' })
      r.headers.set('Set-Cookie', 'sess=abc; HttpOnly')
      return r
    })
    const key = musicianCacheKey('wikidata:Q93341')
    await readThroughCache(deps, key, { ttl: TTL }, produce)
    await deps.waitUntil.mock.calls[0]![0]
    expect(cache.store.get(key.url)!.headers.get('Set-Cookie')).toBeNull()
  })

  it('the two id forms share one cache entry end-to-end', async () => {
    const cache = fakeCache()
    const deps = depsWith(cache)
    const produce = vi.fn(async () => json200({ name: 'Miles Davis' }))

    const miss = await readThroughCache(
      deps,
      musicianCacheKey('wikidata:Q93341'),
      { ttl: TTL },
      produce,
    )
    expect(miss.headers.get('x-jazzlore-cache')).toBe('miss')
    await deps.waitUntil.mock.calls[0]![0]

    // Second request via the OTHER id form must hit the SAME entry.
    const hit = await readThroughCache(
      deps,
      musicianCacheKey('wikidata%3AQ93341'),
      { ttl: TTL },
      produce,
    )
    expect(hit.headers.get('x-jazzlore-cache')).toBe('hit')
    expect(produce).toHaveBeenCalledTimes(1)
  })

  it('degrades to always-produce (bypass) when no Cache API is present', async () => {
    const produce = vi.fn(async () => json200({ name: 'Miles Davis' }))
    const res = await readThroughCache(
      depsWith(null),
      musicianCacheKey('wikidata:Q93341'),
      { ttl: TTL },
      produce,
    )
    expect(produce).toHaveBeenCalledTimes(1)
    expect(res.headers.get('x-jazzlore-cache')).toBe('bypass')
  })
})
