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

import { useState, type Ref } from 'react'
import type { Collaborator } from '../../lib/types'
import { ConnRow } from '../../components/ConnRow'

const HEADLINER_CAP = 16

type Props = {
  collaborators: Collaborator[]
  firstName: string
  pulseId?: string | null
  onActivate?: (id: string) => void
  railRef?: Ref<HTMLDivElement>
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
  railRef,
}: Props) {
  const [expanded, setExpanded] = useState(false)
  const headliners = collaborators.slice(0, HEADLINER_CAP)
  const tail = collaborators.slice(HEADLINER_CAP)
  const showCTA = !expanded && tail.length > 0

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
                {tail.map((c) => (
                  <li key={c.id}>
                    <ConnRow
                      c={c}
                      pulse={pulseId === c.id}
                      onActivate={onActivate}
                    />
                  </li>
                ))}
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
          onClick={() => setExpanded(true)}
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
