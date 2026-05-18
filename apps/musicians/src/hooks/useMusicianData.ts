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
  MusicianDetailResponse,
  SearchIndexResponse,
} from '../lib/types'
import { isWaking } from '../lib/types'
import {
  CURATED,
  SEARCH_CORPUS,
  fixtureDetail,
} from '../test/fixtures'

/** A BFF source: each method resolves the frozen envelope OR a WakingResponse
 * (the 503 cold-Aura shape). Errors reject so the hook can surface the calm
 * error state (D7). */
export interface DataSource {
  curated(): Promise<CuratedResponse | { status: 'waking'; retryAfter: number }>
  detail(
    id: string,
  ): Promise<
    MusicianDetailResponse | { status: 'waking'; retryAfter: number }
  >
  searchIndex(): Promise<
    SearchIndexResponse | { status: 'waking'; retryAfter: number }
  >
}

/** Fixture-backed source (default for Phase D + tests). */
export const fixtureSource: DataSource = {
  curated: async () => ({ curated: CURATED }),
  detail: async (id) => fixtureDetail(id),
  searchIndex: async () => ({ corpus: SEARCH_CORPUS }),
}

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
