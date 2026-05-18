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

afterEach(() => vi.restoreAllMocks())

describe('worker router — /api/*', () => {
  it('routes /api/health to the BFF health handler', async () => {
    vi.spyOn(auraMod, 'auraQuery').mockResolvedValue(
      HEALTH_OK.data as auraMod.AuraResult,
    )
    const res = await worker.fetch(
      new Request('https://m.jazzlore.com/api/health'),
      envWith(assetsStub()),
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
    )
    const body = (await res.json()) as { graph?: unknown }
    expect(body.graph).toBeDefined()
  })

  it('404s an unknown /api/ route', async () => {
    const res = await worker.fetch(
      new Request('https://m.jazzlore.com/api/nope'),
      envWith(assetsStub()),
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
    )
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('<html>')
  })
})
