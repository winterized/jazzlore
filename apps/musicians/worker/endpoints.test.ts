import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  handleByIds,
  handleCurated,
  handleDetail,
  handleGraph,
  handleHealth,
  handleSearchIndex,
} from './endpoints'
import type { Env } from './env'
import * as auraMod from './aura'
import {
  BY_IDS_RESULT,
  CURATED_PARTIAL,
  DETAIL_MILES,
  DETAIL_NOT_FOUND,
  HEALTH_OK,
  SEARCH_INDEX,
} from './test-fixtures'

const ENV: Env = {
  ASSETS: { fetch: async () => new Response('') } as unknown as Fetcher,
  NEO4J_URI: 'https://abc.databases.neo4j.io',
  NEO4J_USERNAME: 'neo4j',
  NEO4J_PASSWORD: 'pw',
}

function stubAura(fixture: { data: { fields: string[]; values: unknown[][] } }) {
  return vi
    .spyOn(auraMod, 'auraQuery')
    .mockResolvedValue(fixture.data as auraMod.AuraResult)
}

afterEach(() => vi.restoreAllMocks())

describe('handleHealth', () => {
  it('returns the frozen HealthResponse with no-store', async () => {
    stubAura(HEALTH_OK)
    const res = await handleHealth(ENV)
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    expect(await res.json()).toEqual({ status: 'ok', musicianCount: 1234 })
  })
})

describe('handleCurated', () => {
  it('hydrates picks, drops unresolved ids, sets the 12h edge TTL', async () => {
    stubAura(CURATED_PARTIAL)
    const res = await handleCurated(ENV)
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toContain('s-maxage=43200')
    const body = (await res.json()) as {
      curated: { id: string; name: string; subtitle?: string }[]
    }
    // Only the 2 resolvable picks survive (faithful — the other 10 curated
    // picks are absent from this stub and dropped). Canonical `wikidata:`
    // survivor ids per src/data/curated.ts (post P0 duplicate-merge).
    expect(body.curated.map((c) => c.id)).toEqual([
      'wikidata:Q93341',
      'wikidata:Q7346',
    ])
    // C-bff item 4a: the era half of the subtitle is `genres[0]` capitalized
    // (single label, mobile-card constrained), NOT the single-bucket
    // `deriveEra(m)`. Miles' Aura genres = ['cool jazz', 'modal jazz'] →
    // `Cool jazz · trumpet` (was `Bebop · trumpet` under deriveEra).
    const miles = body.curated.find((c) => c.id === 'wikidata:Q93341')!
    expect(miles.subtitle).toBe('Cool jazz · trumpet')
    const coltrane = body.curated.find((c) => c.id === 'wikidata:Q7346')!
    expect(coltrane.name).toBe('John Coltrane')
    // Coltrane's Aura genres = ['free jazz'] → `Free jazz · tenor saxophone`
    // (was `Avant-garde · tenor saxophone` under deriveEra's free-jazz match).
    expect(coltrane.subtitle).toBe('Free jazz · tenor saxophone')
  })

  it('falls back to instrument-only subtitle when genres are missing/empty', async () => {
    // C-bff item 4a fallback shape: empty/missing genres → era half is
    // dropped, subtitle is just the primary instrument (no leading separator
    // — the existing `[era, instrument].filter(Boolean).join(' · ')` shape
    // handles this naturally).
    stubAura({
      data: {
        fields: ['m'],
        values: [
          [
            {
              id: 'wikidata:Q93341',
              name: 'Miles Davis',
              primary_instruments: ['trumpet'],
              genres: [],
              wikidata_id: 'Q93341',
            },
          ],
        ],
      },
    })
    const res = await handleCurated(ENV)
    const body = (await res.json()) as {
      curated: { id: string; subtitle?: string }[]
    }
    const miles = body.curated.find((c) => c.id === 'wikidata:Q93341')!
    expect(miles.subtitle).toBe('trumpet')
  })
})

describe('handleDetail', () => {
  it('returns the frozen MusicianDetail + derived era + 1.5h edge TTL', async () => {
    // detailCypher is called first, peersByEraCypher second — the spy must
    // resolve in that ORDER. The peers stub returns 1 peer (Sonny Rollins)
    // so the `sameEra` sibling is exercised on the happy path.
    const spy = vi.spyOn(auraMod, 'auraQuery')
    spy.mockResolvedValueOnce(DETAIL_MILES.data as auraMod.AuraResult)
    spy.mockResolvedValueOnce({
      // PR4c: peersByEra RETURN now includes picture_license + picture_attribution
      // so the era-tile portrait can be rendered with its legal caption.
      fields: [
        'id',
        'name',
        'primary_instruments',
        'picture_url',
        'picture_license',
        'picture_attribution',
        'overlap',
      ],
      values: [
        [
          'wikidata:Q310746',
          'Sonny Rollins',
          ['tenor saxophone'],
          'https://commons.example/sonny.jpg',
          'CC-BY-SA-4.0',
          'F. Wolff',
          2,
        ],
      ],
    } as auraMod.AuraResult)
    const res = await handleDetail(ENV, 'wikidata:Q93341')
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toContain('s-maxage=5400')
    const body = (await res.json()) as {
      name: string
      era?: string
      collaborators: { name: string; sharedRecordCount: number }[]
      records: { title: string }[]
      sameEra: {
        id: string
        name: string
        photo: boolean
        instrument?: string
        portrait?: { url?: string; license?: string; attribution?: string }
      }[]
    }
    expect(body.name).toBe('Miles Davis')
    expect(body.era).toBe('Cool') // genres:['cool jazz','modal jazz'] → Cool
    expect(body.collaborators).toHaveLength(2)
    const trane = body.collaborators.find((c) => c.name === 'John Coltrane')!
    expect(trane.sharedRecordCount).toBe(2)
    expect(body.records.map((r) => r.title).sort()).toEqual([
      "'Round About Midnight",
      'Kind of Blue',
    ])
    expect(body.sameEra).toEqual([
      {
        id: 'wikidata:Q310746',
        name: 'Sonny Rollins',
        instrument: 'tenor saxophone',
        photo: true,
        // PR4c: portrait sibling carrying url + license + attribution.
        portrait: {
          url: 'https://commons.example/sonny.jpg',
          license: 'CC-BY-SA-4.0',
          attribution: 'F. Wolff',
        },
      },
    ])
  })

  it('falls back to sameEra:[] when the peers query fails (best-effort)', async () => {
    const spy = vi.spyOn(auraMod, 'auraQuery')
    spy.mockResolvedValueOnce(DETAIL_MILES.data as auraMod.AuraResult)
    spy.mockRejectedValueOnce(new auraMod.AuraQueryError('boom'))
    const res = await handleDetail(ENV, 'wikidata:Q93341')
    expect(res.status).toBe(200)
    const body = (await res.json()) as { sameEra: unknown[] }
    expect(body.sameEra).toEqual([])
  })

  it('404s when the musician id is absent', async () => {
    stubAura(DETAIL_NOT_FOUND)
    const res = await handleDetail(ENV, 'wikidata:Qnope')
    expect(res.status).toBe(404)
  })
})

describe('handleGraph', () => {
  it('returns the frozen GraphResponse (focus + weighted edges)', async () => {
    stubAura(DETAIL_MILES)
    const res = await handleGraph(ENV, 'wikidata:Q93341')
    const body = (await res.json()) as {
      graph: {
        nodes: { id: string; focus: boolean; recordCount: number }[]
        edges: { source: string; target: string; weight: number }[]
      }
    }
    const focus = body.graph.nodes.find((n) => n.focus)!
    expect(focus.id).toBe('wikidata:Q93341')
    expect(focus.recordCount).toBe(2)
    const traneEdge = body.graph.edges.find(
      (e) => e.target === 'wikidata:Q7346',
    )!
    expect(traneEdge.weight).toBe(2)
  })
})

describe('handleSearchIndex', () => {
  it('returns the faithful corpus (duplicates kept) + 6h edge TTL', async () => {
    stubAura(SEARCH_INDEX)
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const res = await handleSearchIndex(ENV)
    expect(res.headers.get('Cache-Control')).toContain('s-maxage=21600')
    const body = (await res.json()) as { corpus: { name: string }[] }
    // The Antoine double-node is kept faithfully (NO dedup, landmine 11).
    expect(body.corpus).toHaveLength(4)
    expect(body.corpus.filter((e) => e.name === 'Antoine Hervé')).toHaveLength(
      2,
    )
    // …and the duplicate is observed via a structured warning.
    expect(warnSpy).toHaveBeenCalledTimes(1)
  })
})

describe('cold-Aura waking path', () => {
  it('every endpoint surfaces the frozen 503 waking + Retry-After', async () => {
    vi.spyOn(auraMod, 'auraQuery').mockRejectedValue(
      new auraMod.AuraWakingError(),
    )
    const res = await handleHealth(ENV)
    expect(res.status).toBe(503)
    expect(res.headers.get('Retry-After')).toBe('10')
    expect(await res.json()).toEqual({ status: 'waking', retryAfter: 10 })
  })

  it('propagates AuraWakingError from the peers query (cold mid-request)', async () => {
    // Detail query succeeds, but the peers query (second call) hits a cold
    // Aura. The AuraWakingError must re-throw past the best-effort catch so
    // `guard` surfaces the frozen 503 — a partial page with sameEra:[] while
    // Aura is waking is worse than the calm countdown screen.
    const spy = vi.spyOn(auraMod, 'auraQuery')
    spy.mockResolvedValueOnce(DETAIL_MILES.data as auraMod.AuraResult)
    spy.mockRejectedValueOnce(new auraMod.AuraWakingError())
    const res = await handleDetail(ENV, 'wikidata:Q93341')
    expect(res.status).toBe(503)
    expect(res.headers.get('Retry-After')).toBe('10')
  })

  it('returns a misconfig 503 when Aura creds are absent', async () => {
    const res = await handleHealth({ ASSETS: ENV.ASSETS } as Env)
    expect(res.status).toBe(503)
    expect(await res.json()).toMatchObject({ error: 'aura-not-configured' })
  })
})

describe('handleByIds', () => {
  it('happy path: returns ByIdsResponse with items for resolved ids', async () => {
    stubAura(BY_IDS_RESULT)
    const res = await handleByIds(ENV, 'wikidata:Q93341,wikidata:Q7346')
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      items: {
        id: string
        name: string
        photo: boolean
        portrait: { url?: string; license?: string; attribution?: string }
        primaryInstrument?: string
      }[]
    }
    expect(body.items).toHaveLength(2)
    const miles = body.items.find((i) => i.id === 'wikidata:Q93341')!
    expect(miles.name).toBe('Miles Davis')
    expect(miles.photo).toBe(true)
    expect(miles.portrait.url).toBe('https://commons.example/miles.jpg')
    expect(miles.portrait.license).toBe('CC BY-SA 3.0')
    expect(miles.portrait.attribution).toBe('Tom Palumbo')
    expect(miles.primaryInstrument).toBe('trumpet')
    const trane = body.items.find((i) => i.id === 'wikidata:Q7346')!
    expect(trane.photo).toBe(true)
    // Empty attribution string → absent from portrait (not present as '').
    expect(trane.portrait).not.toHaveProperty('attribution')
  })

  it('caps at 20 ids — returns 400 when more than 20 ids supplied', async () => {
    const ids = Array.from({ length: 21 }, (_, i) => `wikidata:Q${i}`).join(',')
    const res = await handleByIds(ENV, ids)
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ error: 'too-many-ids', max: 20 })
  })

  it('returns 400 when the ids param is missing/empty', async () => {
    const res1 = await handleByIds(ENV, null)
    expect(res1.status).toBe(400)
    expect(await res1.json()).toMatchObject({ error: 'missing-ids' })

    const res2 = await handleByIds(ENV, '   ')
    expect(res2.status).toBe(400)
    expect(await res2.json()).toMatchObject({ error: 'missing-ids' })
  })

  it('cold-Aura 503 → frozen waking shape', async () => {
    vi.spyOn(auraMod, 'auraQuery').mockRejectedValue(
      new auraMod.AuraWakingError(),
    )
    const res = await handleByIds(ENV, 'wikidata:Q93341')
    expect(res.status).toBe(503)
    expect(await res.json()).toEqual({ status: 'waking', retryAfter: 10 })
  })
})
