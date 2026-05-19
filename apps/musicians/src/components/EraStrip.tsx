// EraStrip — sideways serendipity (design `EraStrip`): contemporaries who
// weren't in their bands. A divergence affordance, not a primary path.
//
// The era taxonomy is NOT in the frozen contract (Phase B left
// `MusicianDetail.era` undefined — it's a BFF/editorial call). This component
// therefore takes its own small `EraItem[]` shape; the page maps whatever the
// BFF supplies into it. Renders nothing when empty.

import type { KeyboardEvent } from 'react'
import { Duo3 } from './Duo3'

export type EraItem = {
  id: string
  name: string
  instrument?: string
  hint?: string
  photo: boolean
}

type Props = {
  items: EraItem[]
  onActivate?: (id: string) => void
}

export function EraStrip({ items, onActivate }: Props) {
  if (items.length === 0) return null
  return (
    <section className="era" aria-label="From the same era">
      <div className="era-h">
        <div>
          <div className="lab">
            From the same era<b>{items.length}</b>
          </div>
          <div className="blurb">
            Contemporaries who weren&rsquo;t in their bands &mdash; a way to
            wander sideways.
          </div>
        </div>
      </div>
      <div className="era-strip">
        {items.map((c) => {
          const activate = (): void => onActivate?.(c.id)
          const onKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              activate()
            }
          }
          return (
            <div
              key={c.id}
              className="era-tile"
              role="link"
              tabIndex={0}
              aria-label={`${c.name}${c.instrument ? `, ${c.instrument}` : ''}`}
              onClick={activate}
              onKeyDown={onKeyDown}
            >
              <Duo3 name={c.name} photo={c.photo} />
              <div className="body">
                <div className="nm">{c.name}</div>
                <div className="hint">
                  {[c.instrument, c.hint].filter(Boolean).join(' · ')}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
