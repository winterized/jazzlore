interface TapButtonProps {
  tapArmed: boolean
  onTap: () => void
}

/** Full-width dashed button. Becomes solid amber (`armed`) within 2 s of the
 *  last tap. The TAP-T keyboard shortcut and this button funnel to the same
 *  handler — the page wires the 2 s `TAP_DISARM` timer. */
export function TapButton({ tapArmed, onTap }: TapButtonProps) {
  return (
    <div className="tap-row">
      <button
        type="button"
        className={`tap-big${tapArmed ? ' armed' : ''}`}
        onClick={onTap}
        aria-label="Tap tempo"
        aria-pressed={tapArmed}
      >
        <span>TAP</span>
        <span className="hint">
          tap a few times, last 6 averaged · <kbd>T</kbd>
        </span>
      </button>
    </div>
  )
}
