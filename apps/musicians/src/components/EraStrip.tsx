// EraStrip — sideways serendipity (design `EraStrip`): contemporaries who
// weren't in their bands. A divergence affordance, not a primary path.
//
// The era taxonomy is NOT in the frozen contract (Phase B left
// `MusicianDetail.era` undefined — it's a BFF/editorial call). This component
// therefore takes its own small `EraItem[]` shape; the page maps whatever the
// BFF supplies into it. Renders nothing when empty.

import type { ImageAttribution } from '../lib/types'
import { Duo3 } from './Duo3'

export type EraItem = {
  id: string
  name: string
  instrument?: string
  hint?: string
  photo: boolean
  /** Optional portrait + legal attribution. When the BFF era-peer query
   * carries a `picture_url`, this rides as a sibling so EraStrip renders the
   * duotone photo (Wave 1 PR4c / audit HIGH-5). Same shape as the frozen
   * `ImageAttribution`; structural-compatibility with worker PeerEraItem. */
  portrait?: ImageAttribution
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
        {items.map((c) => (
          // Wave 1 / PR4a — real anchor so cmd-click / right-click /
          // copy-link-address work, matching the orbit tiles + ConnRow
          // change. Plain left-click is intercepted for SPA nav.
          <a
            key={c.id}
            className="era-tile"
            href={`/musicians/${encodeURIComponent(c.id)}`}
            aria-label={`${c.name}${c.instrument ? `, ${c.instrument}` : ''}`}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
              e.preventDefault()
              onActivate?.(c.id)
            }}
          >
            <Duo3 name={c.name} photo={c.photo} portrait={c.portrait} />
            <div className="body">
              <div className="nm">{c.name}</div>
              <div className="hint">
                {[c.instrument, c.hint].filter(Boolean).join(' · ')}
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}
