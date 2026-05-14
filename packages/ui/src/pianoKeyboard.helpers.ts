/**
 * Pure-function helpers for PianoKeyboard's per-octave key derivation.
 *
 * Extracted from PianoKeyboard.tsx so the SVG component stays small and the
 * geometry can be unit-tested without rendering. All functions are pure: same
 * input → same output, no side effects.
 */

/** Canonical white-key pitch classes in ascending order within one octave. */
export const WHITE_KEY_PCS_BASE = [0, 2, 4, 5, 7, 9, 11] as const

/** Note names corresponding to {@link WHITE_KEY_PCS_BASE}. */
export const WHITE_KEY_NAMES_BASE = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const

/** Fast membership check for valid white-key pitch classes. */
export const WHITE_PC_SET: ReadonlySet<number> = new Set(WHITE_KEY_PCS_BASE)

/** Display names for the 5 black-key pitch classes, keyed by their PC (1, 3, 6, 8, 10). */
const BLACK_KEY_NAMES: Readonly<Record<number, string>> = {
  1: 'C#',
  3: 'D#',
  6: 'F#',
  8: 'G#',
  10: 'A#',
}

const NOT_WHITE_KEY_MSG = (startPc: number): string =>
  `startPc ${startPc} is a black key — pass a white-key pitch class (0 C, 2 D, 4 E, 5 F, 7 G, 9 A, 11 B)`

/**
 * Derive the sequence of 7 white-key pitch classes for one octave starting at
 * `startPc`. E.g. `startPc=5` (F) → `[5, 7, 9, 11, 0, 2, 4]`. Throws if
 * `startPc` is not a white-key pitch class.
 */
export function deriveWhiteKeyPcsForOctave(startPc: number): readonly number[] {
  const idx = WHITE_KEY_PCS_BASE.indexOf(startPc as (typeof WHITE_KEY_PCS_BASE)[number])
  if (idx === -1) throw new Error(NOT_WHITE_KEY_MSG(startPc))
  const pcs: number[] = []
  for (let i = 0; i < 7; i++) {
    pcs.push(WHITE_KEY_PCS_BASE[(idx + i) % 7]!)
  }
  return pcs
}

/**
 * Derive the note names for one octave starting at `startPc`.
 * E.g. `startPc=5` → `['F', 'G', 'A', 'B', 'C', 'D', 'E']`. Throws if
 * `startPc` is not a white-key pitch class.
 */
export function deriveWhiteKeyNamesForOctave(startPc: number): readonly string[] {
  const idx = WHITE_KEY_PCS_BASE.indexOf(startPc as (typeof WHITE_KEY_PCS_BASE)[number])
  if (idx === -1) throw new Error(NOT_WHITE_KEY_MSG(startPc))
  const names: string[] = []
  for (let i = 0; i < 7; i++) {
    names.push(WHITE_KEY_NAMES_BASE[(idx + i) % 7]!)
  }
  return names
}

/** Resolved black-key spec for a 2-octave window at a given `startPc`. */
export type DerivedBlackSpec = {
  /** Index of the white key to the left, in the 14-key visible window (0..13). */
  globalWhiteIdx: number
  /** Pitch class of the black key (1, 3, 6, 8, or 10). */
  pc: number
  /** Display name (`C#`, `D#`, `F#`, `G#`, `A#`). */
  name: string
}

/**
 * Derive the black-key specs for a 2-octave window whose 14 white keys have
 * the given pitch-class sequence. A black key sits between two adjacent white
 * keys when they are a whole step apart (2 semitones). The E→F and B→C
 * boundaries (1 semitone) have no black key, so the visible count varies with
 * `startPc` (10 for C- or F-rooted; 9 for windows that drop a B→C or E→F
 * boundary on the right edge).
 */
export function deriveBlackKeySpecs(octavePcs: readonly number[]): readonly DerivedBlackSpec[] {
  const result: DerivedBlackSpec[] = []
  const allPcs = [...octavePcs, ...octavePcs]

  for (let i = 0; i < allPcs.length - 1; i++) {
    const leftPc = allPcs[i]!
    const rightPc = allPcs[i + 1]!
    const dist = (((rightPc - leftPc) % 12) + 12) % 12

    if (dist === 2) {
      const blackPc = (leftPc + 1) % 12
      result.push({
        globalWhiteIdx: i,
        pc: blackPc,
        name: BLACK_KEY_NAMES[blackPc] ?? `${blackPc}`,
      })
    }
  }

  return result
}
