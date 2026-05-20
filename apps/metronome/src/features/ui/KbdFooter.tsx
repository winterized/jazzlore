/** Mobile-only keyboard-shortcut hints, shown at the bottom of the page.
 *  Hidden on desktop via the `.mt[data-layout="desktop"] .kbd-hints` rule
 *  in theme.css (the desktop layout surfaces the keyboard list in the left
 *  side rail instead). */
export function KbdFooter() {
  return (
    <div className="kbd-hints" aria-label="Keyboard shortcuts">
      <span>
        <kbd>space</kbd> start / stop
      </span>
      <span>
        <kbd>T</kbd> tap
      </span>
      <span>
        <kbd>←</kbd>
        <kbd>→</kbd> ±1
      </span>
      <span>
        <kbd>⇧</kbd>+<kbd>←</kbd>
        <kbd>→</kbd> ±10
      </span>
      <span>
        <kbd>[</kbd>
        <kbd>]</kbd> classic step
      </span>
    </div>
  )
}
