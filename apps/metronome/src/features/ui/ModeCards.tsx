import type { Mode } from '../../lib/pattern'

interface ModeCardsProps {
  mode: Mode
  onSelect: (mode: Mode) => void
}

/** Three quick-pattern mode cards: Accent-on-1 / 2 & 4 / Bar-on-off.
 *
 *  "Custom" is the implicit fourth state — when no card is on. We don't
 *  render a fourth card for it; the reducer flips to 'custom' when a user
 *  edits a dot while a quick mode was active.
 *
 *  - Accent on 1 → pattern = ['accent', ...'normal' × (beats-1)]
 *  - 2 & 4 (backbeat) → odd-indexed clicks, even silent
 *  - Bar on / off → measure-level: every other measure plays silent. Does
 *    NOT mutate the pattern; the page renders a second dimmed pattern row
 *    as the "bar 2 — silent" preview. */
export function ModeCards({ mode, onSelect }: ModeCardsProps) {
  return (
    <>
      <div className="sec-h">
        <span>Quick patterns</span>
        <span className="meta">override pattern · clears when you tweak a dot</span>
      </div>
      <div className="modes" role="radiogroup" aria-label="Quick patterns">
        <button
          type="button"
          role="radio"
          aria-checked={mode === 'all'}
          className={`mode${mode === 'all' ? ' on' : ''}`}
          onClick={() => onSelect('all')}
        >
          <div className="vis" aria-hidden>
            <span className="v acc" />
            <span className="v" />
            <span className="v" />
            <span className="v" />
          </div>
          <div className="lab">Accent on 1</div>
          <div className="sub">default click, every beat</div>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={mode === 'backbeat'}
          className={`mode${mode === 'backbeat' ? ' on' : ''}`}
          onClick={() => onSelect('backbeat')}
        >
          <div className="vis" aria-hidden>
            <span className="v off" />
            <span className="v" />
            <span className="v off" />
            <span className="v" />
          </div>
          <div className="lab">2 &amp; 4</div>
          <div className="sub">backbeat — jazz feel</div>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={mode === 'altmeasure'}
          className={`mode${mode === 'altmeasure' ? ' on' : ''}`}
          onClick={() => onSelect('altmeasure')}
        >
          <div className="vis" aria-hidden>
            <span className="bar">
              <span className="v acc" />
              <span className="v" />
              <span className="v" />
              <span className="v" />
            </span>
            <span className="bar off">
              <span className="v" />
              <span className="v" />
              <span className="v" />
              <span className="v" />
            </span>
          </div>
          <div className="lab">Bar on / off</div>
          <div className="sub">alternate measures silent</div>
        </button>
      </div>
    </>
  )
}
