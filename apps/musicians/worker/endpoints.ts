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
  byIdsCypher,
  curatedCypher,
  detailCypher,
  healthCypher,
  peersByEraCypher,
  polishedIdsCypher,
  reshapeByIds,
  reshapeCount,
  reshapeDetail,
  reshapeMusicianRows,
  reshapePeerEra,
  reshapePolishedIds,
  searchIndexCypher,
  type ByIdsItem,
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

/** Capitalize the first character of a non-empty string. Used for the curated
 * subtitle's era half — Aura's `genres` come lowercased (`'cool jazz'`); the
 * subtitle slot is a label and reads as one in Title Case. */
function capitalizeFirst(s: string): string {
  return s.length === 0 ? s : s[0]!.toUpperCase() + s.slice(1)
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
      // The era half of the home-card subtitle is the FIRST Aura genre (one
      // label, mobile-card constrained). The detail-page meta chain (Wave 2,
      // C-meta) renders the FULL `genres` list — different surface, different
      // need. See apps/musicians/docs/plans/2026-05-20-group-c-polish.md
      // item 4a for the rationale; the single-label `deriveEra(m)` was the
      // previous behavior and silently collapsed multi-era careers (Miles =
      // Bebop only) to a single bucket.
      const genres = Array.isArray(m.genres) ? m.genres : []
      const firstGenre = genres.find(
        (g): g is string => typeof g === 'string' && g.length > 0,
      )
      const eraLabel = firstGenre !== undefined ? capitalizeFirst(firstGenre) : undefined
      const facet = [eraLabel, card.subtitle].filter((s) => !!s).join(' · ')
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
    // currentYear is the "still active" upper bound for the year-window
    // math when a musician's `years_active_end` is NULL or the literal
    // string "present" (populator data-quality artifact — issue #47).
    // Computed at request time so the rail keeps including living peers
    // as years roll over, without a redeploy.
    // Alias resolution (issue #84): use the CANONICAL id from the detail
    // result (`raw.musician.id`) rather than the URL-supplied `id`, so a
    // stale-id arrival hits the same era window as the canonical URL would.
    // peersByEraCypher still uses `{id: $id}` exact-match — it doesn't need
    // alias widening because we always feed it the canonical id here.
    const canonicalId = String(raw.musician.id ?? id)
    const sameEra: PeerEraItem[] = await auraQuery(c, peersByEraCypher(), {
      id: canonicalId,
      limit: SAME_ERA_LIMIT,
      currentYear: new Date().getUTCFullYear(),
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

/** Maximum number of ids accepted by `/api/musicians/by-ids`. */
const BY_IDS_CAP = 20

/** Response envelope for the batch by-ids endpoint. */
export interface ByIdsResponse {
  items: ByIdsItem[]
}

/** `GET /api/musicians/by-ids?ids=id1,id2,…`
 * Returns minimal musician data (id, name, photo, portrait, primaryInstrument)
 * for each resolvable id. Unresolved ids are silently absent. Caps at 20 ids
 * (returns 400 when the parsed list exceeds that). Malformed/missing `ids`
 * query param returns 400. */
export function handleByIds(env: Env, idsParam: string | null): Promise<Response> {
  if (!idsParam || idsParam.trim() === '') {
    return Promise.resolve(
      json({ status: 'error', error: 'missing-ids' }, 'no-store', 400),
    )
  }
  const ids = idsParam
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
  if (ids.length === 0) {
    return Promise.resolve(
      json({ status: 'error', error: 'missing-ids' }, 'no-store', 400),
    )
  }
  if (ids.length > BY_IDS_CAP) {
    return Promise.resolve(
      json(
        { status: 'error', error: 'too-many-ids', max: BY_IDS_CAP },
        'no-store',
        400,
      ),
    )
  }
  return guard(env, async (c) => {
    const result = await auraQuery(c, byIdsCypher(), { ids })
    const items = reshapeByIds(result)
    const body: ByIdsResponse = { items }
    return json(body, CACHE.detail)
  })
}

/** Response envelope for the polished-ids endpoint. */
export interface PolishedIdsResponse {
  ids: string[]
}

/** `GET /api/musicians/polished-ids`
 * Returns the canonical-id list of musicians with BOTH a bio summary AND a
 * portrait — the "polished" subset (~200, per audit data). Used by Random
 * Jump to avoid dropping first-time users on sparse musicians (Wave 1 /
 * PR6 / audit Quality #1 + #17). Same edge-cache TTL as search-index
 * (6h) since this is also a slow-moving denormalized view. */
export function handlePolishedIds(env: Env): Promise<Response> {
  return guard(env, async (c) => {
    const result = await auraQuery(c, polishedIdsCypher())
    const ids = reshapePolishedIds(result)
    const body: PolishedIdsResponse = { ids }
    return json(body, CACHE.searchIndex)
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
