// useTailPortraits — progressive photo enrichment for the
// CollaboratorRail tail (issue #85).
//
// The DetailView already fires ONE `source.byIds()` batch for the top 16
// collaborators (the headliner cap, covering mosaic + rail headliners).
// The tail revealed by "Show all N collaborators" was never enriched, so
// famous musicians with known photos rendered as bare monograms after
// expand. This hook owns the tail enrichment via chunked, prefetch-one-
// ahead batches against the same `/api/musicians/by-ids` endpoint.
//
// Contract:
//   - `requestChunk(idx)` is idempotent (in-flight + resolved both count
//     as "requested" via the `requestedChunks` set; the set is updated
//     BEFORE `await byIds(…)` so a fast scroll can't double-fire).
//   - First batch fires when the rail-side caller fires the "expand"
//     signal (DetailView calls `requestChunk(0)` AND `requestChunk(1)`).
//   - Subsequent batches fire as the user scrolls — when chunk N's
//     sentinel intersects, the rail fires `onTailChunkReached(N)` and
//     DetailView calls `requestChunk(N + 1)` (one ahead of the scroll).
//   - Already-resolved ids (top-16 overlap with chunk 0) are filtered
//     before each call so the batch never wastes its 20-id budget.

import { useCallback, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { isWaking, type MusicianDetail } from '../../lib/types'
import type { DataSource, MusicianMinimal } from '../../hooks/useMusicianData'

// Worker-side hard cap on `/api/musicians/by-ids` (worker/endpoints.ts:222).
// MUST match the deployed worker — a smaller worker cap would mean our
// chunk batch is rejected with HTTP 400 'too-many-ids'. If the worker cap
// ever changes, update this constant AND the unit test pinning the
// invariant.
export const BY_IDS_CAP = 20

// Number of tail rows whose portraits are fetched per batch. Stays safely
// below `BY_IDS_CAP`; covers roughly one mobile screenful of rail rows
// with buffer. Math.min(…) makes the cap-vs-chunk invariant self-evident
// at the code level.
export const TAIL_CHUNK_SIZE = Math.min(16, BY_IDS_CAP - 4)

/** Owns the per-chunk requested-set + exposes a `requestTailChunk`
 * callback. Result is merged into the existing `collabPortraits` map
 * (shared with the top-16 enrichment), keyed by collaborator id. */
export function useTailPortraits(
  detail: MusicianDetail,
  source: DataSource,
  collabPortraits: Record<string, MusicianMinimal>,
  setCollabPortraits: Dispatch<SetStateAction<Record<string, MusicianMinimal>>>,
  headlinerCap: number,
): { requestTailChunk: (idx: number) => void } {
  // In-flight + resolved both count as "requested". The set is updated
  // BEFORE `await source.byIds()` so a fast scroll firing the same
  // sentinel twice while the fetch is unresolved cannot double-fire.
  const [, setRequestedChunks] = useState<Set<number>>(() => new Set())
  // Mirror in a ref so the callback can read the current value without
  // listing it as a dep (and without stale-closure risk). The setter
  // updates both in lockstep.
  const requestedRef = useRef<Set<number>>(new Set())
  // Mirror collabPortraits in a ref for the same reason — the dedup read
  // must reflect the latest resolved state without re-creating the
  // callback every time the map updates (which would re-arm React's
  // effect deps and could double-fire).
  const portraitsRef = useRef(collabPortraits)
  portraitsRef.current = collabPortraits

  const requestTailChunk = useCallback(
    (idx: number): void => {
      if (idx < 0) return // sentinel: caller asked for "before chunk 0"
      const tail = detail.collaborators.slice(headlinerCap)
      const start = idx * TAIL_CHUNK_SIZE
      if (start >= tail.length) return // last-chunk guard
      if (requestedRef.current.has(idx)) return
      // Mark BEFORE async work to prevent in-flight double-fire.
      requestedRef.current = new Set(requestedRef.current).add(idx)
      setRequestedChunks(requestedRef.current)
      const chunkIds = tail
        .slice(start, start + TAIL_CHUNK_SIZE)
        .map((c) => c.id)
        .filter((id) => !(id in portraitsRef.current))
      if (chunkIds.length === 0) return
      void source
        .byIds(chunkIds)
        .then((r) => {
          if (isWaking(r)) return
          setCollabPortraits((prev) => {
            const next = { ...prev }
            for (const item of r.items) next[item.id] = item
            return next
          })
        })
        .catch(() => {
          // Best-effort: a failed byIds quietly keeps figure / monogram
          // fallbacks. The chunk stays in `requestedChunks` so we don't
          // retry on the next sentinel re-intersection.
        })
    },
    [detail.collaborators, headlinerCap, source, setCollabPortraits],
  )

  return { requestTailChunk }
}
