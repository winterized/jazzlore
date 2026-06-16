import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from './index'
import type { Env } from './env'
import * as auraMod from './aura'
import { DETAIL_MILES, HEALTH_OK, SEARCH_INDEX } from './test-fixtures'

function envWith(assets: Fetcher, withCreds = true): Env {
  return {
    ASSETS: assets,
    ...(withCreds
      ? {
          NEO4J_URI: 'https://abc.databases.neo4j.io',
          NEO4J_USERNAME: 'neo4j',
          NEO4J_PASSWORD: 'pw',
        }
      : {}),
  }
}

const SHELL = '<!doctype html><html><head><title>Jazzlore</title></head><body></body></html>'

function assetsStub(): Fetcher {
  return {
    fetch: async () =>
      new Response(SHELL, {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      }),
  } as unknown as Fetcher
}

/** Minimal ExecutionContext — `waitUntil` runs the promise inline so a cache
 * put completes deterministically within the test. */
function ctxStub(): ExecutionContext {
  return {
    waitUntil: (p: Promise<unknown>) => {
      void p
    },
    passThroughOnException: () => {},
  } as unknown as ExecutionContext
}

afterEach(() => vi.restoreAllMocks())

describe('worker router — /api/*', () => {
  it('routes /api/health to the BFF health handler', async () => {
    vi.spyOn(auraMod, 'auraQuery').mockResolvedValue(
      HEALTH_OK.data as auraMod.AuraResult,
    )
    const res = await worker.fetch(
      new Request('https://m.jazzlore.com/api/health'),
      envWith(assetsStub()),
      ctxStub(),
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ status: 'ok' })
  })

  it('routes /api/musicians/:id (encoded id) to detail', async () => {
    vi.spyOn(auraMod, 'auraQuery').mockResolvedValue(
      DETAIL_MILES.data as auraMod.AuraResult,
    )
    const res = await worker.fetch(
      new Request('https://m.jazzlore.com/api/musicians/wikidata%3AQ93341'),
      envWith(assetsStub()),
      ctxStub(),
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ name: 'Miles Davis' })
  })

  it('routes /api/musicians/:id/graph to the graph handler', async () => {
    vi.spyOn(auraMod, 'auraQuery').mockResolvedValue(
      DETAIL_MILES.data as auraMod.AuraResult,
    )
    const res = await worker.fetch(
      new Request(
        'https://m.jazzlore.com/api/musicians/wikidata%3AQ93341/graph',
      ),
      envWith(assetsStub()),
      ctxStub(),
    )
    const body = (await res.json()) as { graph?: unknown }
    expect(body.graph).toBeDefined()
  })

  it('404s an unknown /api/ route', async () => {
    const res = await worker.fetch(
      new Request('https://m.jazzlore.com/api/nope'),
      envWith(assetsStub()),
      ctxStub(),
    )
    expect(res.status).toBe(404)
  })
})

describe('worker router — sitemap', () => {
  it('serves a dynamic sitemap.xml from the corpus', async () => {
    vi.spyOn(auraMod, 'auraQuery').mockResolvedValue(
      SEARCH_INDEX.data as auraMod.AuraResult,
    )
    const res = await worker.fetch(
      new Request('https://m.jazzlore.com/sitemap.xml'),
      envWith(assetsStub()),
      ctxStub(),
    )
    expect(res.headers.get('Content-Type')).toContain('application/xml')
    const xml = await res.text()
    expect(xml).toContain('<urlset')
    expect(xml).toContain('musicians/wikidata%3AQ93341')
  })
})

describe('worker router — static assets + OG fallback', () => {
  it('hands non-API, non-document paths to ASSETS untouched', async () => {
    const assets = assetsStub()
    const spy = vi.spyOn(assets, 'fetch')
    const res = await worker.fetch(
      new Request('https://m.jazzlore.com/assets/app.js'),
      envWith(assets),
      ctxStub(),
    )
    expect(spy).toHaveBeenCalled()
    expect(res.status).toBe(200)
  })

  it('a musician document nav falls back to the shell when OG injection cannot run', async () => {
    // jsdom has no HTMLRewriter global → injectOg throws → graceful shell
    // fallback (decision 7: OG is additive, never blocks the page).
    vi.spyOn(auraMod, 'auraQuery').mockResolvedValue(
      DETAIL_MILES.data as auraMod.AuraResult,
    )
    const res = await worker.fetch(
      new Request('https://m.jazzlore.com/musicians/wikidata%3AQ93341', {
        headers: { 'Sec-Fetch-Dest': 'document' },
      }),
      envWith(assetsStub()),
      ctxStub(),
    )
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('<html>')
  })
})

describe('worker router — detail Cache API read-through', () => {
  /** Stub `globalThis.caches.default` with an in-memory store (Node/vitest has
   * no Cache API). `put` stores synchronously so a follow-up `match` in the
   * same run sees the entry. Returns a restore fn. */
  function stubCaches(): { store: Map<string, Response>; restore: () => void } {
    const store = new Map<string, Response>()
    const fake = {
      match: async (k: Request) => {
        const hit = store.get(k.url)
        return hit ? hit.clone() : undefined
      },
      put: (k: Request, r: Response) => {
        store.set(k.url, r.clone())
        return Promise.resolve()
      },
    } as unknown as Cache
    const g = globalThis as unknown as { caches?: CacheStorage }
    const prev = g.caches
    g.caches = { default: fake } as unknown as CacheStorage
    return { store, restore: () => void (g.caches = prev) }
  }

  it('serves a 2nd GET for the same musician from cache, skipping the Aura pipeline', async () => {
    const { restore } = stubCaches()
    try {
      const spy = vi
        .spyOn(auraMod, 'auraQuery')
        .mockResolvedValue(DETAIL_MILES.data as auraMod.AuraResult)
      const url = 'https://m.jazzlore.com/api/musicians/wikidata%3AQ93341'

      const r1 = await worker.fetch(
        new Request(url),
        envWith(assetsStub()),
        ctxStub(),
      )
      expect(r1.headers.get('x-jazzlore-cache')).toBe('miss')
      expect(await r1.json()).toMatchObject({ name: 'Miles Davis' })
      const callsAfterMiss = spy.mock.calls.length

      const r2 = await worker.fetch(
        new Request(url),
        envWith(assetsStub()),
        ctxStub(),
      )
      expect(r2.headers.get('x-jazzlore-cache')).toBe('hit')
      expect(await r2.json()).toMatchObject({ name: 'Miles Davis' })
      // The cache hit ran NO further Aura queries — the heavy pipeline skipped.
      expect(spy.mock.calls.length).toBe(callsAfterMiss)
    } finally {
      restore()
    }
  })

  it('does NOT cache a 503 waking response — the error is never pinned', async () => {
    const { store, restore } = stubCaches()
    try {
      const spy = vi
        .spyOn(auraMod, 'auraQuery')
        .mockRejectedValue(new auraMod.AuraWakingError())
      const url = 'https://m.jazzlore.com/api/musicians/wikidata%3AQ93341'

      const r1 = await worker.fetch(
        new Request(url),
        envWith(assetsStub()),
        ctxStub(),
      )
      expect(r1.status).toBe(503)
      expect(store.size).toBe(0)

      // A second request re-runs the pipeline (not served a pinned 503).
      const r2 = await worker.fetch(
        new Request(url),
        envWith(assetsStub()),
        ctxStub(),
      )
      expect(r2.status).toBe(503)
      expect(r2.headers.get('x-jazzlore-cache')).toBe('miss')
      expect(spy.mock.calls.length).toBeGreaterThanOrEqual(2)
    } finally {
      restore()
    }
  })
})
