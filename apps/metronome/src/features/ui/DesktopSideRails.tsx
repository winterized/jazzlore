import type { Status } from '../state/metronomeReducer'

/** Desktop layout has a 3-col grid `1fr 580px 1fr` with the page in the
 *  middle. Each rail is its own exported component so the page can interleave
 *  them with the central .page block. Rendering both as a fragment would put
 *  the right rail into grid column 2 (where the page should be) by CSS-grid
 *  auto-placement order. */

/** Left rail: keyboard shortcuts + a Newsreader-italic mobile-first rationale. */
export function DesktopLeftRail() {
  return (
    <aside className="desk-side left" aria-label="Keyboard shortcuts">
      <h4>Keyboard</h4>
      <div className="kb-list">
        <div className="row">
          <span className="k">
            <kbd>space</kbd>
          </span>
          <span className="d">start / stop</span>
        </div>
        <div className="row">
          <span className="k">
            <kbd>T</kbd>
          </span>
          <span className="d">tap tempo</span>
        </div>
        <div className="row">
          <span className="k">
            <kbd>←</kbd>
            <kbd>→</kbd>
          </span>
          <span className="d">±1 BPM</span>
        </div>
        <div className="row">
          <span className="k">
            <kbd>⇧</kbd>
            <kbd>←</kbd>
          </span>
          <span className="d">±10 BPM</span>
        </div>
        <div className="row">
          <span className="k">
            <kbd>[</kbd>
            <kbd>]</kbd>
          </span>
          <span className="d">classic ±</span>
        </div>
        <div className="row">
          <span className="k">
            <kbd>1</kbd>…<kbd>7</kbd>
          </span>
          <span className="d">set meter</span>
        </div>
      </div>
      <p className="signature">
        <b>Notes</b>
        Mobile-first by design — built for an iPhone plugged into a Kawai over
        USB-C → RCA. Desktop reuses the same control surface, gives the
        keyboard a place to live, and otherwise gets out of the way.
      </p>
    </aside>
  )
}

interface DesktopRightRailProps {
  status: Status
}

const STATUS_LABEL: Record<Status, string> = {
  idle: 'idle',
  priming: 'priming',
  running: 'running',
}

/** Right rail: live system-state list + an editorial "why a keep-alive" note. */
export function DesktopRightRail({ status }: DesktopRightRailProps) {
  const running = status === 'running'
  return (
    <aside className="desk-side right" aria-label="System status">
      <h4>Status</h4>
      <div className="kb-list">
        <div className="row">
          <span className="k">stream</span>
          <span
            className="d"
            style={{ color: running ? 'var(--accent)' : 'var(--muted)' }}
          >
            {STATUS_LABEL[status]}
          </span>
        </div>
        <div className="row">
          <span className="k">wake lock</span>
          <span className="d">{running ? 'held' : 'released'}</span>
        </div>
        <div className="row">
          <span className="k">scheduler</span>
          <span className="d">25ms tick · 100ms lookahead</span>
        </div>
        <div className="row">
          <span className="k">warmup</span>
          <span className="d">400ms before beat 1</span>
        </div>
      </div>
      <p className="signature">
        <b>Why a keep-alive</b>
        iOS lets the USB audio stream idle between sounds. A sub-audible
        30 Hz oscillator at ~0.0008 gain runs Start → Stop so the DAC never
        sleeps and no click loses its leading edge.
      </p>
    </aside>
  )
}
