import type { Status } from '../state/metronomeReducer'

interface StatusPillProps {
  status: Status
}

const LABEL: Record<Status, string> = {
  idle: 'idle',
  priming: 'priming · 400ms warmup',
  running: 'streaming · keep-alive on',
}

/** The header's status indicator. A small Geist-Mono uppercase pill with a
 *  leading dot. Per the design handoff, three states (idle/priming/running)
 *  with a styled dot per state. Wrapped in role=status + aria-live=polite so
 *  screen readers announce transitions like "priming → running". */
export function StatusPill({ status }: StatusPillProps) {
  return (
    <div className={`status ${status}`} role="status" aria-live="polite">
      <span className="dot" aria-hidden />
      {LABEL[status]}
    </div>
  )
}
