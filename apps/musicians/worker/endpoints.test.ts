import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  handleCurated,
  handleDetail,
  handleGraph,
  handleHealth,
  handleSearchIndex,
} from './endpoints'
import type { Env } from './env'
import * as auraMod from './aura'
import {
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
    // Only the 2 resolvable picks survive (faithful — the other 10 restored
    // iconic picks are absent from this stub and dropped). Restored real
    // node ids per docs/data-audit.md §5 + docs/db-feedback.md.
    expect(body.curated.map((c) => c.id)).toEqual([
      'musicbrainz:561d854a-6a28-4aa7-8c99-323e6ce46c2a',
      'musicbrainz:b625448e-bf4a-41c3-a421-72ad46cdb831',
    ])
    const coltrane = body.curated.find(
      (c) => c.id === 'musicbrainz:b625448e-bf4a-41c3-a421-72ad46cdb831',
    )!
    expect(coltrane.name).toBe('John Coltrane')
    expect(coltrane.subtitle).toBe('Avant-garde · tenor saxophone') // era · instrument
  })
})

describe('handleDetail', () => {
  it('returns the frozen MusicianDetail + derived era + 1.5h edge TTL', async () => {
    stubAura(DETAIL_MILES)
    const res = await handleDetail(ENV, 'wikidata:Q93341')
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toContain('s-maxage=5400')
    const body = (await res.json()) as {
      name: string
      era?: string
      collaborators: { name: string; sharedRecordCount: number }[]
      records: { title: string }[]
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

  it('returns a misconfig 503 when Aura creds are absent', async () => {
    const res = await handleHealth({ ASSETS: ENV.ASSETS } as Env)
    expect(res.status).toBe(503)
    expect(await res.json()).toMatchObject({ error: 'aura-not-configured' })
  })
})
