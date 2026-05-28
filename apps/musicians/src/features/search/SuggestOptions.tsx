// SuggestOptions — the portalled listbox (WAI-ARIA combobox popup).
//
// role=listbox + role=option, aria-selected on the active option. Keyboard
// selection is on the combobox input (Enter) per the WAI-ARIA pattern, so
// options are NOT individually focusable; onMouseDown preventDefault keeps
// input focus (beats onBlur close), selection runs on click. 60ms stagger
// via per-option animation-delay (components.css mu3-suggest-in;
// reduced-motion clamps it). Highlight is the FROZEN matchRanges; the <em>
// is never remounted (Highlight uses stable keys).
//
// No-photo treatment (issue #69): each row shows the editorial instrument
// figure (figKey/NoPhotoMark via `Duo3 photo={false} inst=…`, `rest` for
// unknown) in place of a monogram — same figure path as every other no-photo
// surface (home cards / era tiles / conn rows). Photos are deliberately NOT
// fetched here: autosuggest is a transient surface and per-result image
// requests aren't worth the free-tier cost. The corner monogram is hidden by
// CSS at this density (`.suggest-row .duo3-mark-ini`, NOT `.mu3`-scoped — the
// listbox portals to <body>, outside the `.mu3` wrapper).

import type { CSSProperties } from 'react'
import { Duo3 } from '../../components/Duo3'
import { Highlight } from './Highlight'
import type { SearchHit } from './searchCorpus'

const STAGGER_MS = 60

type Pos = { top: number; left: number; width: number }

export function SuggestOptions({
  listId,
  hits,
  activeIdx,
  pos,
  onChoose,
}: {
  listId: string
  hits: SearchHit[]
  activeIdx: number
  pos: Pos | null
  onChoose: (id: string) => void
}) {
  const style: CSSProperties = pos
    ? { position: 'fixed', top: pos.top, left: pos.left, width: pos.width }
    : { position: 'fixed', top: 0, left: 0 }

  return (
    <ul
      id={listId}
      role="listbox"
      aria-label="Musician matches"
      className="suggest-listbox"
      style={style}
    >
      {hits.length === 0 ? (
        <li
          role="option"
          aria-disabled="true"
          aria-selected={false}
          className="suggest-empty"
        >
          No matches — try fewer letters or a different spelling.
        </li>
      ) : (
        hits.map((h, i) => (
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events
          <li
            key={h.entry.id}
            id={`${listId}-o${i}`}
            role="option"
            aria-selected={i === activeIdx}
            className="suggest-row"
            style={{ animationDelay: `${i * STAGGER_MS}ms` }}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onChoose(h.entry.id)}
          >
            <Duo3
              name={h.entry.name}
              photo={false}
              inst={h.entry.primaryInstrument ?? null}
            />
            <div>
              <div className="nm">
                <Highlight text={h.entry.name} ranges={h.ranges} />
              </div>
              {h.entry.primaryInstrument && (
                <div className="meta">
                  {h.entry.primaryInstrument.toUpperCase()}
                  {h.entry.era ? ` · ${h.entry.era}` : ''}
                </div>
              )}
            </div>
          </li>
        ))
      )}
    </ul>
  )
}
