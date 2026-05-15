/**
 * Maps a chord root's pitch class (0-11) to the nearest white-key PC for
 * PianoKeyboard's `startPc` constraint. PianoKeyboard throws when passed a
 * black-key PC (1, 3, 6, 8, 10), so chord roots on black keys must be mapped
 * to an adjacent white key.
 *
 * Convention: prefer the white key BELOW the root. This keeps the root
 * highlight visible in the keyboard window — the chord tone sits on the board
 * rather than below the left edge.
 *
 * Examples:
 *   F♯ (pc 6) → F (pc 5)
 *   B♭ (pc 10) → A (pc 9)
 *   D♭ (pc 1)  → C (pc 0)
 */
const WHITE_PCS = [0, 2, 4, 5, 7, 9, 11] as const

export function rootToStartPc(rootPc: number): number {
  if (WHITE_PCS.includes(rootPc as (typeof WHITE_PCS)[number])) return rootPc
  // rootPc is a black key — walk down to find the nearest white key
  for (let pc = rootPc - 1; pc >= 0; pc--) {
    if (WHITE_PCS.includes(pc as (typeof WHITE_PCS)[number])) return pc
  }
  return 0 // unreachable for valid roots 0-11
}
