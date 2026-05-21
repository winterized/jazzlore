// Mockable BFF data layer (Phase D).
//
// D is parallel with C (the real BFF). To not block on C, the reader codes
// against the FROZEN response envelopes (lib/types) through a small data
// source seam. The default source serves the Phase-D fixtures; tests inject
// their own source (rich / moderate / sparse / waking corpora). When C lands,
// only the production source swaps to real `fetch` calls — components are
// untouched (the contract is frozen).

import { useEffect, useState } from 'react'
import type {
  CuratedResponse,
  GraphResponse,
  ImageAttribution,
  MusicianDetailResponse,
  SearchIndexResponse,
} from '../lib/types'
import { isWaking } from '../lib/types'
import type { EraItem } from '../components/EraStrip'
import {
  CURATED,
  SEARCH_CORPUS,
  fixtureDetail,
  fixtureGraph,
} from '../test/fixtures'

/** Minimal musician shape returned by `/api/musicians/by-ids`. Contains only
 * what the portrait-render consumers need (mosaic, ConnRow, journey grid).
 * Intentionally NOT in the frozen lib/types.ts — it is the by-ids envelope. */
export interface MusicianMinimal {
  id: string
  name: string
  photo: boolean
  portrait: ImageAttribution
  primaryInstrument?: string
}

/**
 * `/api/musicians/:id` payload with the era-strip peers attached as a
 * SIBLING. The frozen `MusicianDetailResponse` (= `MusicianDetail` in
 * `lib/types.ts`) is intentionally agnostic of the era taxonomy; the BFF
 * rides `sameEra` alongside it the same way it rides the editorial `era`
 * label. The page reads it through the `?? []` default so a Phase-D
 * fixture source (no `sameEra`) keeps the strip hidden via EraStrip's
 * self-hide on empty.
 */
export type MusicianDetailWithEra = MusicianDetailResponse & {
  sameEra?: EraItem[]
}

/** Response envelope for `/api/musicians/by-ids`. */
export interface ByIdsResponse {
  items: MusicianMinimal[]
}

/** A BFF source: each method resolves the frozen envelope OR a WakingResponse
 * (the 503 cold-Aura shape). Errors reject so the hook can surface the calm
 * error state (D7). */
export interface DataSource {
  curated(): Promise<CuratedResponse | { status: 'waking'; retryAfter: number }>
  detail(
    id: string,
  ): Promise<
    MusicianDetailWithEra | { status: 'waking'; retryAfter: number }
  >
  searchIndex(): Promise<
    SearchIndexResponse | { status: 'waking'; retryAfter: number }
  >
  graph(
    id: string,
  ): Promise<GraphResponse | { status: 'waking'; retryAfter: number }>
  /** Batch-fetch minimal musician data for up to 20 ids. Returns items only
   * for ids that resolved; unresolved ids are silently absent. */
  byIds(
    ids: string[],
  ): Promise<ByIdsResponse | { status: 'waking'; retryAfter: number }>
}

/** Fixture-backed source (kept behind the seam for unit tests + the
 * dev-only `__preview/waking` harness). NOT the app default any more. */
export const fixtureSource: DataSource = {
  curated: async () => ({ curated: CURATED }),
  detail: async (id) => fixtureDetail(id),
  searchIndex: async () => ({ corpus: SEARCH_CORPUS }),
  graph: async (id) => ({ graph: fixtureGraph(id) }),
  byIds: async (ids) => {
    // Build minimal shapes from CURATED (has portrait/photo) + SEARCH_CORPUS
    // (id/name/instrument). CURATED wins when available (richer portrait data).
    const byId = new Map<string, MusicianMinimal>()
    for (const c of CURATED) {
      byId.set(c.id, {
        id: c.id,
        name: c.name,
        photo: c.photo,
        portrait: c.portrait,
        primaryInstrument: undefined,
      })
    }
    for (const e of SEARCH_CORPUS) {
      if (!byId.has(e.id)) {
        byId.set(e.id, {
          id: e.id,
          name: e.name,
          photo: false,
          portrait: {},
          primaryInstrument: e.primaryInstrument,
        })
      }
    }
    const items: MusicianMinimal[] = ids.flatMap((id) => {
      const m = byId.get(id)
      return m !== undefined ? [m] : []
    })
    return { items }
  },
}

type Waking = { status: 'waking'; retryAfter: number }

/**
 * One BFF GET. Relative URL → the SAME unified Worker that serves this SPA
 * also serves `/api/*` (same-origin, no CORS, no base URL). The frozen
 * `503 {status:"waking"}` body resolves AS the waking shape (so
 * `useBffResource` maps it to `kind:'waking'` via the FROZEN `isWaking`);
 * a network failure, a non-ok HTTP status, or an `{status:"error"}` envelope
 * REJECTS so the hook surfaces the calm error state (D7).
 */
async function bffGet<T>(path: string): Promise<T | Waking> {
  const res = await fetch(path, { headers: { Accept: 'application/json' } })
  const body: unknown = await res.json().catch(() => null)
  if (isWaking(body)) return body
  if (!res.ok) throw new Error(`bff ${res.status} ${path}`)
  if (
    typeof body === 'object' &&
    body !== null &&
    (body as { status?: unknown }).status === 'error'
  ) {
    throw new Error(`bff error envelope ${path}`)
  }
  return body as T
}

/**
 * Production source — the SPA→BFF wiring. Calls the unified Worker's
 * `/api/musicians/*` endpoints and parses the FROZEN envelopes into the
 * FROZEN domain types (imported from `../lib/types`, never reimplemented).
 */
export const httpSource: DataSource = {
  curated: () => bffGet<CuratedResponse>('/api/musicians/curated'),
  detail: (id) =>
    bffGet<MusicianDetailWithEra>(
      `/api/musicians/${encodeURIComponent(id)}`,
    ),
  searchIndex: () =>
    bffGet<SearchIndexResponse>('/api/musicians/search-index'),
  graph: (id) =>
    bffGet<GraphResponse>(
      `/api/musicians/${encodeURIComponent(id)}/graph`,
    ),
  byIds: (ids) =>
    bffGet<ByIdsResponse>(
      `/api/musicians/by-ids?ids=${ids.map(encodeURIComponent).join(',')}`,
    ),
}

/** The source the app uses by default (the H1 seam swap: real `fetch`,
 * not fixtures). Components default to this; tests inject `fixtureSource`. */
export const defaultSource: DataSource = httpSource

export type AsyncState<T> =
  | { kind: 'loading' }
  | { kind: 'ready'; data: T }
  | { kind: 'waking'; retryAfter: number }
  | { kind: 'error' }

/**
 * Generic loader. Runs `load`, maps the FROZEN waking shape via `isWaking`
 * into the `waking` state (D7), rejections into `error`. `deps` re-runs it
 * (e.g. detail id change, retry tick).
 */
export function useBffResource<T>(
  load: () => Promise<T | { status: 'waking'; retryAfter: number }>,
  deps: ReadonlyArray<unknown>,
): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ kind: 'loading' })
  useEffect(() => {
    let live = true
    // Resetting to `loading` when a dependency changes (a new id / a retry
    // tick) is the documented legitimate use of setState-in-effect: a prior
    // result must not flash while the next request is in flight. `live`
    // guards against a stale resolve committing after unmount/dep-change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ kind: 'loading' })
    load()
      .then((r) => {
        if (!live) return
        setState(
          isWaking(r)
            ? { kind: 'waking', retryAfter: r.retryAfter }
            : { kind: 'ready', data: r as T },
        )
      })
      .catch(() => {
        if (live) setState({ kind: 'error' })
      })
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return state
}
