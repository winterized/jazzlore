/**
 * ChordSymbolDisplay — dual-form chord symbol renderer.
 *
 * Shows the primary symbol at full size and an optional alternate symbol in
 * smaller subdued type below. When the alternate is absent, an invisible
 * placeholder preserves the row height so every chord row in the page aligns
 * vertically.
 *
 * Design conventions (from apps/chords/CLAUDE.md):
 * - Primary: modern lead-sheet style (Cmaj7, Cm7♭5).
 * - Alternate: traditional jazz style (CΔ7, Cø7). No parentheses.
 * - Empty alternate slot holds its height to preserve vertical rhythm.
 *
 * Left-alignment contract (diagnosed 2026-05-15):
 * The two lines are a single left-aligned column with no padding, margin, or
 * text-indent on either line and no per-line text-align — so the primary and
 * alternate share one identical left origin. Measured in a real browser, the
 * box-left of both lines is bit-identical (Δ = 0px, light and dark); the only
 * residual is ~0.25px of irreducible font left-side-bearing (a 18px capital
 * carries a slightly larger side-bearing than the same glyph at 12px). That
 * sub-pixel difference is inherent to the intentional text-lg/text-xs size
 * contrast and is not "fixed" with a magic offset. Instead the structural
 * guarantee is made explicit here (inline-flex column, items-start, w-fit, no
 * indent) and locked by ChordSymbolDisplay.test.tsx so it can never regress
 * into a real, visible whole-pixel misalignment.
 */

type Props = {
  /** Primary chord symbol, e.g. "Cmaj7", "Cm", "Cdim". */
  primary: string
  /** Alternate chord symbol, e.g. "CΔ7", "C-", "C°". Omit when not applicable. */
  alternate?: string
}

export default function ChordSymbolDisplay({ primary, alternate }: Props) {
  return (
    <div className="chord-symbol-display inline-flex w-fit flex-col items-start text-left">
      <p data-testid="chord-primary" className="chord-symbol-primary text-lg font-semibold text-stone-900 dark:text-stone-100">{primary}</p>
      {alternate !== undefined ? (
        <p className="chord-symbol-alternate text-xs text-stone-600 dark:text-stone-400">{alternate}</p>
      ) : (
        <div className="h-4" aria-hidden="true" />
      )}
    </div>
  )
}
