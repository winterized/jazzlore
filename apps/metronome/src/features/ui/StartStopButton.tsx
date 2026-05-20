import { PlayIcon, StopIcon } from './icons'
import type { Status } from '../state/metronomeReducer'

interface StartStopButtonProps {
  status: Status
  /** Fired on click OR space-bar. The PAGE's handler is where primeAudio()
   *  + Wake Lock + NoSleep get kicked off SYNCHRONOUSLY (PR 2) — this
   *  component just calls back. PR 1 wires the page handler as a stub that
   *  dispatches START → 400 ms → PRIMED for the priming-pill animation. */
  onToggle: () => void
}

/** The only shadowed control in the UI. Amber fill + amber halo when idle;
 *  transparent + text-soft border + no shadow when running. Icon swaps Play
 *  → Stop. The Geist-Mono `space` kbd-hint sits at 0.7 opacity on the
 *  right. */
export function StartStopButton({ status, onToggle }: StartStopButtonProps) {
  const running = status !== 'idle'
  return (
    <div className="start-row">
      <button
        type="button"
        className={`start${running ? ' running' : ''}`}
        onClick={onToggle}
        aria-label={running ? 'Stop metronome' : 'Start metronome'}
        aria-pressed={running}
      >
        {running ? <StopIcon size={20} /> : <PlayIcon size={20} />}
        <span className="label">{running ? 'Stop' : 'Start'}</span>
        <span className="kbd-hint" aria-hidden>
          space
        </span>
      </button>
    </div>
  )
}
