// BFF endpoint handlers (Phase C).
//
// One page load = one BFF call: each handler runs ONE aggregated read-only
// Cypher, reshapes Aura rows into the FROZEN raw fixture shapes, then maps via
// the FROZEN pure mappers in ../src/lib/map (imported, never reimplemented).
// Edge `Cache-Control` per endpoint (env.ts CACHE). A cold Aura surfaces the
// FROZEN `WakingResponse` 503 + `Retry-After` (review N1).

import {
  mapCuratedCard,
  mapGraphData,
  mapMusicianDetail,
  mapSearchCorpus,
} from '../src/lib/map'
import type {
  CuratedResponse,
  GraphResponse,
  HealthResponse,
  MusicianDetailResponse,
  SearchIndexResponse,
} from '../src/lib/types'
import { CURATED } from '../src/data/curated'
import { auraQuery, AuraWakingError, type AuraCreds } from './aura'
import {
  curatedCypher,
  detailCypher,
  healthCypher,
  peersByEraCypher,
  reshapeCount,
  reshapeDetail,
  reshapeMusicianRows,
  reshapePeerEra,
  searchIndexCypher,
  type PeerEraItem,
} from './cypher'
import { warnOnDuplicates } from './duplicates'
import { deriveEra } from './era'
import { CACHE, WAKING_RETRY_AFTER, type Env } from './env'

function json(body: unknown, cacheControl: string, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cacheControl,
    },
  })
}

/** The FROZEN `WakingResponse` 503 — NOT the A-stub `not-implemented`. */
export function wakingResponse(): Response {
  return new Response(
    JSON.stringify({ status: 'waking', retryAfter: WAKING_RETRY_AFTER }),
    {
      status: 503,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'Retry-After': String(WAKING_RETRY_AFTER),
      },
    },
  )
}

function creds(env: Env): AuraCreds | null {
  if (!env.NEO4J_URI || !env.NEO4J_USERNAME || !env.NEO4J_PASSWORD) return null
  return {
    uri: env.NEO4J_URI,
    username: env.NEO4J_USERNAME,
    password: env.NEO4J_PASSWORD,
    database: env.NEO4J_DATABASE,
  }
}

/** Wrap a handler: missing creds → 503 misconfig; cold Aura → frozen waking. */
async function guard(
  env: Env,
  run: (c: AuraCreds) => Promise<Response>,
): Promise<Response> {
  const c = creds(env)
  if (c === null) {
    return json({ status: 'error', error: 'aura-not-configured' }, 'no-store', 503)
  }
  try {
    return await run(c)
  } catch (err) {
    if (err instanceof AuraWakingError) return wakingResponse()
    return json({ status: 'error', error: 'aura-query-failed' }, 'no-store', 502)
  }
}

export function handleHealth(env: Env): Promise<Response> {
  return guard(env, async (c) => {
    const result = await auraQuery(c, healthCypher())
    const body: HealthResponse = {
      status: 'ok',
      musicianCount: reshapeCount(result),
    }
    return json(body, CACHE.health)
  })
}

export function handleCurated(env: Env): Promise<Response> {
  return guard(env, async (c) => {
    const ids = CURATED.map((p) => p.id)
    const result = await auraQuery(c, curatedCypher(), { ids })
    const byId = new Map(reshapeMusicianRows(result).map((m) => [m.id, m]))
    // Preserve the editorial order; drop picks absent from Neo4j (faithful —
    // a stale curated id is reconciled in Phase 0, never crashes here).
    const curated = CURATED.flatMap((pick) => {
      const m = byId.get(pick.id)
      if (m === undefined) return []
      const card = mapCuratedCard(pick, m)
      const era = deriveEra(m)
      const facet = [era, card.subtitle].filter((s) => !!s).join(' · ')
      return [{ ...card, subtitle: facet === '' ? undefined : facet }]
    })
    const body: CuratedResponse = { curated }
    return json(body, CACHE.curated)
  })
}

/** `/api/musicians/:id` cap on the "from the same era" peers strip. The
 * EraStrip can scroll horizontally; 12 keeps the payload small while giving
 * the rail enough density for the design's serendipitous-divergence intent. */
const SAME_ERA_LIMIT = 12

/** The detail response with the era-strip peers attached as a SIBLING. The
 * frozen `MusicianDetailResponse` (= `MusicianDetail`) is intentionally
 * agnostic of era taxonomy (see src/lib/types.ts) — `sameEra` rides
 * alongside it the same way the editorial `era` label does on the frozen
 * type. The hook + page consume this extended shape; the EraStrip itself is
 * data-agnostic. */
type DetailResponseWithSameEra = MusicianDetailResponse & {
  sameEra: PeerEraItem[]
}

export function handleDetail(env: Env, id: string): Promise<Response> {
  return guard(env, async (c) => {
    const result = await auraQuery(c, detailCypher(), { id })
    const raw = reshapeDetail(result)
    if (raw === null) {
      return json({ status: 'error', error: 'not-found' }, 'no-store', 404)
    }
    // Peers query is best-effort: a Cypher / shape failure must NOT break the
    // detail page. EraStrip self-hides on `[]`, so on a soft failure we
    // surface `sameEra: []` and the rest of the page renders unchanged. A
    // cold Aura is NOT soft: the AuraWakingError must propagate so `guard`
    // returns the frozen 503 — partial-page-while-Aura-cold would be worse
    // than the calm waking screen.
    const sameEra: PeerEraItem[] = await auraQuery(c, peersByEraCypher(), {
      id,
      limit: SAME_ERA_LIMIT,
    })
      .then(reshapePeerEra)
      .catch((err: unknown) => {
        if (err instanceof AuraWakingError) throw err
        return []
      })
    const detail = mapMusicianDetail(raw)
    const body: DetailResponseWithSameEra = {
      ...detail,
      era: deriveEra(raw.musician),
      sameEra,
    }
    return json(body, CACHE.detail)
  })
}

export function handleGraph(env: Env, id: string): Promise<Response> {
  return guard(env, async (c) => {
    const result = await auraQuery(c, detailCypher(), { id })
    const raw = reshapeDetail(result)
    if (raw === null) {
      return json({ status: 'error', error: 'not-found' }, 'no-store', 404)
    }
    const body: GraphResponse = { graph: mapGraphData(raw) }
    return json(body, CACHE.detail)
  })
}

export function handleSearchIndex(env: Env): Promise<Response> {
  return guard(env, async (c) => {
    const result = await auraQuery(c, searchIndexCypher())
    const rows = reshapeMusicianRows(result)
    // Structured duplicate warning (decision 8) — observability only, the
    // corpus is returned faithfully (NO dedup, landmine 11).
    warnOnDuplicates(rows, 'search-index')
    const corpus = mapSearchCorpus(rows).map((entry, i) => {
      const src = rows[i]
      return src ? { ...entry, era: deriveEra(src) } : entry
    })
    const body: SearchIndexResponse = { corpus }
    return json(body, CACHE.searchIndex)
  })
}
