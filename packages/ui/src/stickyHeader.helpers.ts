/**
 * Pure-function helpers for StickyHeader's scroll-spy and chip-centering logic.
 *
 * Extracted so the ChipRow component stays small and the scroll math can be
 * unit-tested independently of React — same pattern as pianoKeyboard.helpers.ts.
 * All functions are pure: same input → same output, no side effects, no DOM.
 */

/**
 * A target resolved from the DOM: the chip's `id` and the current
 * `getBoundingClientRect().top` measurement for its anchor element.
 */
export type ResolvedTarget = {
  /** The chip id — also the DOM element's `id` attribute. */
  id: string
  /** `element.getBoundingClientRect().top` at the time of measurement. */
  top: number
}

/**
 * Determine which chip should be "active" given a list of resolved targets and
 * a threshold (the sticky header's height, in pixels from viewport top).
 *
 * Algorithm: the active chip is the LAST target whose `top <= threshold`.
 * If no target has crossed the threshold yet, the FIRST target is active
 * (the user hasn't scrolled past anything yet).
 * Returns `null` if `targets` is empty.
 *
 * @param targets - Pre-measured targets in document order, each carrying `top`
 *   from `getBoundingClientRect()`.
 * @param threshold - Pixels from the viewport top at which a section is
 *   considered "in view" (typically the sticky header's height).
 */
export function resolveActiveChip(
  targets: readonly ResolvedTarget[],
  threshold: number,
): string | null {
  if (targets.length === 0) return null

  // Default to the first chip — user hasn't scrolled past any section yet.
  let activeId = targets[0]!.id

  for (const target of targets) {
    if (target.top <= threshold) {
      activeId = target.id
    } else {
      // Targets are in document order; once one is below threshold, all
      // subsequent ones will be too — we can stop early.
      break
    }
  }

  return activeId
}

/**
 * Compute the desired `scrollLeft` for a horizontally-scrollable chip row such
 * that the active chip is centered within the visible area.
 *
 * The result is clamped to `[0, maxScrollLeft]` where
 * `maxScrollLeft = totalScrollWidth - rowWidth`.
 *
 * @param rowWidth     - The visible width of the chip row container (`clientWidth`).
 * @param totalScrollWidth - The full scrollable width (`scrollWidth`).
 * @param chipLeft     - The chip's `offsetLeft` within the row's scroll content.
 * @param chipWidth    - The chip's `offsetWidth`.
 */
export function centerScrollLeft(
  rowWidth: number,
  totalScrollWidth: number,
  chipLeft: number,
  chipWidth: number,
): number {
  // Ideal: place the chip's centre at the row's centre.
  const ideal = chipLeft - rowWidth / 2 + chipWidth / 2
  const maxScrollLeft = Math.max(0, totalScrollWidth - rowWidth)
  return Math.max(0, Math.min(ideal, maxScrollLeft))
}

/**
 * Return `true` if the active chip is sufficiently visible inside the chip row
 * without extra scrolling — i.e., it falls within the buffer zone on both sides.
 *
 * @param rowScrollLeft  - Current `scrollLeft` of the row.
 * @param rowWidth       - `clientWidth` of the row.
 * @param chipLeft       - `offsetLeft` of the chip relative to scroll content.
 * @param chipWidth      - `offsetWidth` of the chip.
 * @param buffer         - Pixels of padding required on each visible edge (default 40).
 */
export function isChipVisible(
  rowScrollLeft: number,
  rowWidth: number,
  chipLeft: number,
  chipWidth: number,
  buffer = 40,
): boolean {
  const chipRight = chipLeft + chipWidth
  const viewLeft = rowScrollLeft + buffer
  const viewRight = rowScrollLeft + rowWidth - buffer
  return chipLeft >= viewLeft && chipRight <= viewRight
}
