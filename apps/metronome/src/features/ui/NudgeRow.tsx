interface NudgeRowProps {
  onNudge: (delta: number) => void
  onClassicStep: (dir: 'prev' | 'next') => void
}

/** Six buttons, semantic order left → right:
 *    [◀◀] [−10] [−1] [+1] [+10] [▶▶]
 *
 *  The classic-tempo steppers (◀◀ / ▶▶) flank the edges so the "go bigger"
 *  gesture pulls outward. They carry a 7 px CLASSIC tag at top-right (see
 *  theme.css) to disambiguate from the ±10 nudges. */
export function NudgeRow({ onNudge, onClassicStep }: NudgeRowProps) {
  return (
    <div className="nudge-row">
      <button
        type="button"
        className="nudge classic-prev"
        onClick={() => onClassicStep('prev')}
        aria-label="Jump to previous classic tempo"
      >
        <span className="scale-tag">CLASSIC</span>
        <span className="chev" aria-hidden>
          ◀◀
        </span>
      </button>
      <button
        type="button"
        className="nudge"
        onClick={() => onNudge(-10)}
        aria-label="Decrease BPM by 10"
      >
        −10
      </button>
      <button
        type="button"
        className="nudge"
        onClick={() => onNudge(-1)}
        aria-label="Decrease BPM by 1"
      >
        −1
      </button>
      <button
        type="button"
        className="nudge"
        onClick={() => onNudge(1)}
        aria-label="Increase BPM by 1"
      >
        +1
      </button>
      <button
        type="button"
        className="nudge"
        onClick={() => onNudge(10)}
        aria-label="Increase BPM by 10"
      >
        +10
      </button>
      <button
        type="button"
        className="nudge classic-next"
        onClick={() => onClassicStep('next')}
        aria-label="Jump to next classic tempo"
      >
        <span className="scale-tag">CLASSIC</span>
        <span className="chev" aria-hidden>
          ▶▶
        </span>
      </button>
    </div>
  )
}
