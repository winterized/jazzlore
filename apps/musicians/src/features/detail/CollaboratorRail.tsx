// CollaboratorRail — "Where to go from here" (design `MobileDetailV5` rail).
//
// 16 fat headliners, same treatment for the long tail (no density downgrade,
// pass-5 reversal 1). The expansion CTA renders ONLY when total > 16
// (landmine: "Render the CTA only when total > 16"); it carries a preview
// line. Expanded state: CTA hidden (user already scrolled past — design
// "Expansion CTA hidden in expanded state"), an italic tail-marker divides
// headliners from the rest, the tail loads inline as the same fat cards.
//
// `pulseId` (D4) marks the ConnRow the mosaic tap scrolled to. `railRef`
// lets the mosaic find rows by `data-collab-id` (D4).
//
// Tail-photo enrichment (issue #85): the tail rows used to render bare
// monograms because the page never enriched their portraits via the
// `byIds` batch. The rail now fires `onExpand?.()` once on click (DetailView
// uses it to prefetch the first two chunks) and `onTailChunkReached?.(idx)`
// when chunk `idx`'s sentinel becomes visible (DetailView prefetches chunk
// idx+1 — one ahead of the scroll). The figure/monogram is the loading
// state; an arriving photo replaces it in the SAME box (CLS = 0) with a
// 150ms opacity fade.

import { useEffect, useRef, useState, type Ref } from 'react'
import type { Collaborator } from '../../lib/types'
import type { MusicianMinimal } from '../../hooks/useMusicianData'
import { ConnRow } from '../../components/ConnRow'
import { TAIL_CHUNK_SIZE } from './useTailPortraits'

export const HEADLINER_CAP = 16

type Props = {
  collaborators: Collaborator[]
  firstName: string
  pulseId?: string | null
  onActivate?: (id: string) => void
  /** Optional handler for the "+N more" chip on each ConnRow. When supplied,
   * the chip becomes a button that opens the shared-records sheet. */
  onShowSharedRecords?: (collabId: string) => void
  railRef?: Ref<HTMLDivElement>
  /** Optional portrait map from the batch byIds fetch, keyed by collaborator id. */
  portraits?: Record<string, MusicianMinimal>
  /** Tail-photo prefetch (issue #85). Fires once when the user expands the
   * rail — the handler should prefetch the first two tail chunks (rows 0–15
   * and 16–31 of the tail) so chunk 1 is already in the buffer by the time
   * the user scrolls into it. Optional; absence = no prefetch. */
  onExpand?: () => void
  /** Tail-photo prefetch (issue #85). Fires when chunk `idx`'s sentinel row
   * intersects the viewport — handler should prefetch chunk `idx + 1` (one
   * ahead of the scroll) so the next screenful's photos are present before
   * the user reaches them. Optional; absence = no prefetch. */
  onTailChunkReached?: (idx: number) => void
}

function previewLine(tail: Collaborator[]): string {
  const names = tail.slice(0, 3).map((c) => c.name.split(' ').pop() ?? c.name)
  const rest = tail.length - names.length
  const head = names.join(', ')
  return rest > 0
    ? `${tail.length} more, including ${head} and ${rest} others`
    : `${tail.length} more, including ${head}`
}

export function CollaboratorRail({
  collaborators,
  firstName,
  pulseId,
  onActivate,
  onShowSharedRecords,
  railRef,
  portraits,
  onExpand,
  onTailChunkReached,
}: Props) {
  const [expanded, setExpanded] = useState(false)
  const headliners = collaborators.slice(0, HEADLINER_CAP)
  const tail = collaborators.slice(HEADLINER_CAP)
  const showCTA = !expanded && tail.length > 0

  // One IntersectionObserver watches every `data-chunk-sentinel="<idx>"`
  // node and fires `onTailChunkReached(idx)` when it intersects. The
  // observer lives only while the rail is expanded; cleaned up on
  // collapse or unmount. jsdom has no IntersectionObserver — guard via
  // typeof check (precedent: useMosaicScrollPulse).
  const sentinelsContainerRef = useRef<HTMLUListElement>(null)
  useEffect(() => {
    if (!expanded) return
    if (typeof IntersectionObserver !== 'function') return
    const root = sentinelsContainerRef.current
    if (!root) return
    const sentinels = root.querySelectorAll<HTMLElement>(
      '[data-chunk-sentinel]',
    )
    if (sentinels.length === 0) return
    const handler = onTailChunkReached
    if (!handler) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const raw = (e.target as HTMLElement).dataset.chunkSentinel
          const idx = raw === undefined ? NaN : Number(raw)
          if (Number.isFinite(idx)) handler(idx)
        }
      },
      { threshold: 0.01 },
    )
    for (const s of sentinels) io.observe(s)
    return () => {
      io.disconnect()
    }
    // Re-arm when the tail length changes (different musician) or the
    // handler identity changes (different callback closure).
  }, [expanded, tail.length, onTailChunkReached])

  const handleExpandClick = (): void => {
    setExpanded(true)
    onExpand?.()
  }

  return (
    <>
      <div className="sec-h">
        <span id="rail-h">Where to go from here</span>
        <em>
          {tail.length > 0 && !expanded
            ? `${Math.min(HEADLINER_CAP, collaborators.length)} of ${collaborators.length}`
            : `${collaborators.length} total`}
        </em>
      </div>
      <div className="rail" ref={railRef}>
        {collaborators.length === 0 ? (
          <div className="empty-section">
            No collaborators on file yet — help us add to this entry.
          </div>
        ) : (
          <ul
            ref={sentinelsContainerRef}
            className="rail-list"
            aria-labelledby="rail-h"
            style={{ listStyle: 'none', margin: 0, padding: 0 }}
          >
            {headliners.map((c) => (
              <li key={c.id}>
                <ConnRow
                  c={c}
                  pulse={pulseId === c.id}
                  onActivate={onActivate}
                  onShowSharedRecords={onShowSharedRecords}
                  portrait={portraits?.[c.id]}
                />
              </li>
            ))}
            {expanded && tail.length > 0 && (
              <>
                <li>
                  <div className="tail-marker">
                    <span className="lab">
                      <b>The rest</b> — every other player on a {firstName}{' '}
                      record
                    </span>
                    <span className="ct">{tail.length} MORE</span>
                  </div>
                </li>
                {tail.map((c, i) => {
                  // Place a sentinel marker on the FIRST row of every chunk
                  // (i === 0 → chunk 0, i === TAIL_CHUNK_SIZE → chunk 1, …).
                  // The IO above maps the sentinel's `idx` to a prefetch of
                  // chunk `idx + 1` so photos are always one chunk ahead.
                  const chunkIdx =
                    i % TAIL_CHUNK_SIZE === 0
                      ? i / TAIL_CHUNK_SIZE
                      : undefined
                  return (
                    <li
                      key={c.id}
                      {...(chunkIdx !== undefined
                        ? { 'data-chunk-sentinel': String(chunkIdx) }
                        : {})}
                    >
                      <ConnRow
                        c={c}
                        pulse={pulseId === c.id}
                        onActivate={onActivate}
                        onShowSharedRecords={onShowSharedRecords}
                        portrait={portraits?.[c.id]}
                      />
                    </li>
                  )
                })}
              </>
            )}
          </ul>
        )}
      </div>

      {showCTA && (
        <button
          type="button"
          className="conn-expand"
          aria-expanded={false}
          aria-label={`Show all ${collaborators.length} collaborators`}
          onClick={handleExpandClick}
        >
          <span>
            Show all {collaborators.length} collaborators
            <span className="sub">{previewLine(tail)}</span>
          </span>
          <span className="arrow" aria-hidden="true">
            ↓
          </span>
        </button>
      )}
    </>
  )
}
