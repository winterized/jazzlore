// httpSource — the production fetch-backed DataSource (the SPA→BFF seam swap).
//
// Asserts the contract that lets the FROZEN waking UI / calm error states keep
// working unchanged: relative same-origin URLs to the unified Worker's
// `/api/*`, the frozen envelopes parsed into the frozen domain types, the
// `503 {status:"waking"}` body resolved via the FROZEN isWaking (so
// useBffResource maps it to `kind:'waking'`), and every network / HTTP /
// error-envelope failure REJECTED (so useBffResource maps it to `kind:'error'`).

import { afterEach, describe, expect, it, vi } from 'vitest'
import { isWaking } from '../lib/types'
import { httpSource } from './useMusicianData'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

afterEach(() => vi.restoreAllMocks())

describe('httpSource — fetch-backed BFF seam', () => {
  it('GET /api/musicians/curated → parsed CuratedResponse', async () => {
    const card = {
      id: 'wikidata:Q93341',
      name: 'Miles Davis',
      hook: 'The restless modernist.',
      photo: true,
      portrait: {},
    }
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ curated: [card] }))

    const r = await httpSource.curated()

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/musicians/curated',
      expect.objectContaining({ headers: { Accept: 'application/json' } }),
    )
    expect(isWaking(r)).toBe(false)
    if (isWaking(r)) throw new Error('unreachable')
    expect(r.curated).toEqual([card])
  })

  it('GET /api/musicians/:id → parsed MusicianDetail (bare envelope), id encoded', async () => {
    const detail = { id: 'wikidata:Q93341', name: 'Miles Davis' }
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse(detail))

    const r = await httpSource.detail('wikidata:Q93341')

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/musicians/wikidata%3AQ93341',
      expect.anything(),
    )
    expect(r).toEqual(detail)
  })

  it('GET /api/musicians/:id/graph → parsed GraphResponse', async () => {
    const graph = { graph: { nodes: [], edges: [] } }
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(graph))
    const r = await httpSource.graph('wikidata:Q93341')
    expect(r).toEqual(graph)
  })

  it('GET /api/musicians/search-index → parsed SearchIndexResponse', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ corpus: [] }))
    const r = await httpSource.searchIndex()
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/musicians/search-index',
      expect.anything(),
    )
    expect(r).toEqual({ corpus: [] })
  })

  it('503 {status:"waking"} resolves the FROZEN waking shape (not an error)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ status: 'waking', retryAfter: 10 }, 503),
    )
    const r = await httpSource.curated()
    expect(isWaking(r)).toBe(true)
    if (!isWaking(r)) throw new Error('unreachable')
    expect(r.retryAfter).toBe(10)
  })

  it('a network failure REJECTS (→ calm error state upstream)', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('offline'))
    await expect(httpSource.detail('x')).rejects.toThrow()
  })

  it('a non-ok HTTP status (404 not-found / 502) REJECTS', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ status: 'error', error: 'not-found' }, 404),
    )
    await expect(httpSource.detail('missing')).rejects.toThrow()
  })

  it('an error envelope on a 200 REJECTS (defensive)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ status: 'error', error: 'aura-query-failed' }),
    )
    await expect(httpSource.searchIndex()).rejects.toThrow()
  })

  it('GET /api/musicians/by-ids → ByIdsResponse, ids are percent-encoded', async () => {
    const items = [
      {
        id: 'wikidata:Q93341',
        name: 'Miles Davis',
        photo: true,
        portrait: { url: 'https://commons.example/miles.jpg' },
        primaryInstrument: 'trumpet',
      },
    ]
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ items }))

    const r = await httpSource.byIds(['wikidata:Q93341'])

    // The colon in the id must be percent-encoded in the query string.
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/musicians/by-ids?ids=wikidata%3AQ93341',
      expect.objectContaining({ headers: { Accept: 'application/json' } }),
    )
    expect(isWaking(r)).toBe(false)
    if (isWaking(r)) throw new Error('unreachable')
    expect(r.items).toEqual(items)
  })

  it('byIds: fixtureSource happy path returns items from CURATED/SEARCH_CORPUS', async () => {
    // fixtureSource.byIds must work for ids in CURATED or SEARCH_CORPUS.
    // We import fixtureSource to exercise the in-memory path (no fetch).
    const { fixtureSource } = await import('./useMusicianData')
    const { CURATED } = await import('../test/fixtures')
    // Pick the first curated id — it must resolve to a MusicianMinimal with photo.
    const firstId = CURATED[0]!.id
    const r = await fixtureSource.byIds([firstId])
    expect(isWaking(r)).toBe(false)
    if (isWaking(r)) throw new Error('unreachable')
    expect(r.items).toHaveLength(1)
    expect(r.items[0]!.id).toBe(firstId)
    expect(r.items[0]!.photo).toBe(CURATED[0]!.photo)
  })

  it('byIds: fixtureSource returns empty items for unknown ids', async () => {
    const { fixtureSource } = await import('./useMusicianData')
    const r = await fixtureSource.byIds(['unknown:Q99999'])
    expect(isWaking(r)).toBe(false)
    if (isWaking(r)) throw new Error('unreachable')
    expect(r.items).toHaveLength(0)
  })

  it('sharedRecords: encodes both ids into the per-pair endpoint URL', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ records: [], totalCount: 0 }))
    await httpSource.sharedRecords('wikidata:Q93341', 'wikidata:Q7346')
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/musicians/wikidata%3AQ93341/collaborators/wikidata%3AQ7346/records',
      expect.objectContaining({ headers: { Accept: 'application/json' } }),
    )
  })
})
