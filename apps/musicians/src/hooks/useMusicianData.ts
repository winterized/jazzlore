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
  RecordRef,
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

/** Response envelope for `/api/musicians/polished-ids` — the canonical id
 * list of musicians with BOTH a bio summary AND a portrait (the "polished"
 * subset, ~200). Used by Random Jump to avoid dropping first-time users on
 * sparse musicians (audit Quality #1 + #17). */
export interface PolishedIdsResponse {
  ids: string[]
}

/** Response envelope for
 * `/api/musicians/:focusId/collaborators/:collabId/records`. `totalCount` is
 * the TRUE unbounded count of shared records between the pair; `records` is
 * the most-recent-first slice (capped at 100 server-side). When
 * `totalCount > records.length`, the UI surfaces "100 of 147 records" so
 * the user knows the slice is partial. */
export interface SharedRecordsResponse {
  records: RecordRef[]
  totalCount: number
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
  /** The canonical-id list of "polished" musicians (bio + portrait). Used by
   * Random Jump (Wave 1 PR6) so the primary CTA never drops a first-time
   * user on a sparse musician. */
  polishedIds(): Promise<
    PolishedIdsResponse | { status: 'waking'; retryAfter: number }
  >
  /** Fetch the records the focus + collab pair both played on (sorted
   * most-recent first, capped at 100). Backs the ConnRow "+N more" sheet.
   * The response carries the true `totalCount` so the UI can surface
   * "N of M records" when the slice is partial. */
  sharedRecords(
    focusId: string,
    collabId: string,
  ): Promise<SharedRecordsResponse | { status: 'waking'; retryAfter: number }>
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
  polishedIds: async () => {
    // Fixture pool MUST mirror the production cypher contract — only
    // entries that satisfy the WHERE clause are returned. The fixture
    // CuratedCard models `photo` (= picture_url presence) but has no
    // bio_summary shape, so we filter on what the fixture CAN model.
    // Without this filter, ~10/12 CURATED entries are photo:false in
    // Phase-D fixtures and would silently violate the BFF contract.
    return { ids: CURATED.filter((c) => c.photo).map((c) => c.id) }
  },
  sharedRecords: async () => {
    // Fixture corpus carries no record-edge data — return a tiny empty
    // response so unit-tests can render the sheet's "empty" state. Tests
    // that need richer data inject their own source.
    return { records: [], totalCount: 0 }
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
  polishedIds: () => bffGet<PolishedIdsResponse>('/api/musicians/polished-ids'),
  sharedRecords: (focusId, collabId) =>
    bffGet<SharedRecordsResponse>(
      `/api/musicians/${encodeURIComponent(focusId)}/collaborators/${encodeURIComponent(collabId)}/records`,
    ),
}

/** The source the app uses by default (the H1 seam swap: real `fetch`,
 * not fixtures). Components default to this; tests inject `fixtureSource`. */
export const defaultSource: DataSource = httpSource

export type AsyncState<T> =
  | { kind: 'loading' }
  | { kind: 'ready'; data: T }
  | { kind: 'waking'; retryAfter: number }
  | { kind: 'error'; offline?: boolean }

/**
 * Generic loader. Runs `load`, maps the FROZEN waking shape via `isWaking`
 * into the `waking` state (D7), rejections into `error`. `deps` re-runs it
 * (e.g. detail id change, retry tick).
 *
 * `loading` reset happens SYNCHRONOUSLY during the render that first sees
 * new deps — not inside the post-commit effect — so a stale `ready` value
 * from the previous deps is never visible to consumers. This matters for
 * MusicianPage's canonical-id `useEffect`: if it ran on a commit where
 * `state.data.id` still belonged to the previous musician, it would call
 * `navigate(replace, oldId)` and ricochet the URL back, so every
 * collaborator / era-strip tap appeared broken. See React docs "Storing
 * information from previous renders" — the in-render setState pattern is
 * sanctioned and React re-runs the component synchronously before
 * committing.
 */
export function useBffResource<T>(
  load: () => Promise<T | { status: 'waking'; retryAfter: number }>,
  deps: ReadonlyArray<unknown>,
): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ kind: 'loading' })
  const [trackedDeps, setTrackedDeps] = useState<ReadonlyArray<unknown>>(deps)
  // Intentionally element-wise (not array-identity): callers pass a fresh
  // array literal every render (e.g. `[source, id, attempt]`), so identity
  // would always read as "changed". `Object.is` matches React's own
  // dependency-array comparison.
  const depsChanged =
    deps.length !== trackedDeps.length ||
    deps.some((d, i) => !Object.is(d, trackedDeps[i]))
  if (depsChanged) {
    setTrackedDeps(deps)
    setState({ kind: 'loading' })
  }
  useEffect(() => {
    let live = true
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
        if (!live) return
        // `navigator.onLine` only reliably reports `false`; use it as the
        // conservative offline signal. A real 5xx / 404 still returned an HTTP
        // response (so `onLine` is true) → `offline:false` → the calm error
        // screen, never the offline state. A genuine network failure rejects
        // with `onLine === false` → `offline:true`.
        const offline =
          typeof navigator !== 'undefined' && navigator.onLine === false
        setState({ kind: 'error', offline })
      })
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return depsChanged ? { kind: 'loading' } : state
}
