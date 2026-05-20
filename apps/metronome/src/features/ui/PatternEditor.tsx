import type { BeatState } from '../../lib/pattern'

/** A single row of the pattern editor. v1 always renders 1 row; v2 will add
 *  a second for polyrhythms. The component never assumes `rows.length === 1`
 *  — this is the forward-compatible shape per the spec. */
export interface PatternRow {
  /** The beat states for this row. */
  beats: readonly BeatState[]
  /** Optional left-aligned label (e.g. "bar 2 — silent" for the altmeasure
   *  preview row). Undefined for the main row. */
  label?: string
  /** Dim the row to 0.35 opacity (the altmeasure preview row). */
  dim?: boolean
  /** When this row is the one the engine is currently flashing, the page
   *  level adds `.flash` to the dot's DOM node via ref. The PatternEditor
   *  itself doesn't manage flash (per the design: don't tie it to React
   *  state, the engine drives it). */
}

interface PatternEditorProps {
  rows: readonly PatternRow[]
  /** Click on a beat dot. Only fires for the row at `mainRowIndex` (the
   *  user can't edit the dimmed preview row). */
  onCycleDot: (index: number) => void
  /** Which row's dots are interactive. v1: always 0. */
  mainRowIndex?: number
}

/** Pattern editor — N rows of N beats. Each dot is a button cycling through
 *  empty → normal → accent on click. The card includes a legend foot. */
export function PatternEditor({ rows, onCycleDot, mainRowIndex = 0 }: PatternEditorProps) {
  return (
    <>
      <div className="sec-h">
        <span>Pattern</span>
        <span className="meta">click to cycle · empty → click → accent</span>
      </div>
      <div className="pattern">
        {rows.map((row, rowIdx) => {
          const isMain = rowIdx === mainRowIndex && !row.dim
          return (
            <div className="pttn-row" key={rowIdx}>
              {row.label && <div className="lh">{row.label}</div>}
              {row.beats.map((s, i) => {
                const key = `${rowIdx}-${i}`
                const ariaLabel = `Beat ${i + 1}: ${s}${isMain ? ' (click to cycle)' : ''}`
                if (isMain) {
                  return (
                    <button
                      key={key}
                      type="button"
                      className="dot"
                      data-s={s}
                      data-beat-index={i}
                      onClick={() => onCycleDot(i)}
                      aria-label={ariaLabel}
                      style={row.dim ? { opacity: 0.35 } : undefined}
                    />
                  )
                }
                // Dimmed preview row — not interactive; render as a div so it
                // doesn't appear in the tab order.
                return (
                  <div
                    key={key}
                    className="dot"
                    data-s={s}
                    aria-label={ariaLabel}
                    style={row.dim ? { opacity: 0.35 } : undefined}
                  />
                )
              })}
            </div>
          )
        })}
        <div className="ptn-foot">
          <div className="legend" aria-hidden>
            <span>
              <span className="lk empty" />
              silent
            </span>
            <span>
              <span className="lk normal" />
              click
            </span>
            <span>
              <span className="lk accent" />
              accent
            </span>
          </div>
          <span aria-hidden>tap a dot</span>
        </div>
      </div>
    </>
  )
}
