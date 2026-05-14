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
 */

type Props = {
  /** Primary chord symbol, e.g. "Cmaj7", "Cm", "Cdim". */
  primary: string
  /** Alternate chord symbol, e.g. "CΔ7", "C-", "C°". Omit when not applicable. */
  alternate?: string
}

export default function ChordSymbolDisplay({ primary, alternate }: Props) {
  return (
    <div className="chord-symbol-display">
      <p data-testid="chord-primary" className="text-lg font-semibold text-stone-900 dark:text-stone-100">{primary}</p>
      {alternate !== undefined ? (
        <p className="text-xs text-stone-500 dark:text-stone-400">{alternate}</p>
      ) : (
        <div className="h-4" aria-hidden="true" />
      )}
    </div>
  )
}
