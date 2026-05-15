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

/**
 * The black-key name immediately below a white-key `startPc`, or `null` when
 * the white key is preceded by another white key (C and F — their lower
 * neighbour is B and E, half steps with no black key between).
 *
 * Used to draw the decorative leading half black-key for orientation when the
 * 2-octave window starts on D, E, G, A or B. Throws if `startPc` is not a
 * white-key pitch class (mirrors the other derive* helpers).
 *
 * Pure: same input → same output, no side effects.
 */
export function deriveLeadingBlackKeyName(startPc: number): string | null {
  if (!WHITE_PC_SET.has(startPc)) throw new Error(NOT_WHITE_KEY_MSG(startPc))
  const belowPc = (((startPc - 1) % 12) + 12) % 12
  return BLACK_KEY_NAMES[belowPc] ?? null
}

/**
 * Absolute semitone offset (from the leftmost white key) of each of the 14
 * visible white keys, given their pitch-class sequence for one octave.
 *
 * White key 0 is the anchor (offset 0). Each subsequent key adds the ascending
 * semitone gap to the previous white key (2 for whole steps, 1 for the E→F /
 * B→C half steps), so the values are monotonically increasing and align with
 * {@link resolveChordKeyPositions}'s `abs` coordinate. A black key sits one
 * semitone above the white key it follows (`whiteAbs[globalWhiteIdx] + 1`).
 *
 * Pure: same input → same output, no side effects.
 */
export function deriveWhiteKeyAbsOffsets(octavePcs: readonly number[]): readonly number[] {
  const offsets: number[] = [0]
  let prev = octavePcs[0] ?? 0
  for (let i = 1; i < 14; i++) {
    const pc = octavePcs[i % 7]!
    const gap = (((pc - prev) % 12) + 12) % 12
    offsets.push(offsets[i - 1]! + gap)
    prev = pc
  }
  return offsets
}

/**
 * The role a resolved chord key plays: the chord's root, or any other tone.
 */
export type ChordKeyRole = 'root' | 'scale'

/** A single resolved chord-tone placement within the 2-octave window. */
export type ResolvedChordKey = {
  /**
   * Absolute semitone position from the leftmost white key (`startPc`),
   * always 0..23 — i.e. inside the fixed 2-octave (24-semitone) window.
   */
  abs: number
  /** `'root'` for the chord's root tone (offset 0), else `'scale'`. */
  role: ChordKeyRole
}

/**
 * Resolve a chord's ascending root-position semitone offsets to absolute key
 * positions inside the fixed 2-octave (24-semitone) piano window.
 *
 * Unlike scale mode (which repeats a pitch-class pattern every octave), a
 * chord is a *set of specific voices*: each tone is placed exactly once,
 * ascending from the root, so a 13th's 9th sits at root+14 (not root+2).
 *
 * `chordSemitones` are root-relative offsets in ascending stack order, e.g.
 * `[0, 4, 7, 11, 14, 21]` for a maj13; element 0 (offset 0) is the root.
 *
 * `r0 = (rootPc - startPc + 12) % 12` is the root's absolute position. Because
 * the caller anchors `startPc` on the white key at or just below the root,
 * `r0` is normally 0, 1 or 2; the modulo also handles a wrapped window
 * (e.g. C against a B-anchored window → r0 = 1).
 *
 * **Octave-fold (Option A):** if `r0 + s` would fall past position 23 it is
 * dropped one octave at a time (−12) until it lands once inside the window —
 * keeps the card width constant and every tone always visible. All 27 curated
 * chords fit without folding (widest spans 21 semitones < 24); the fold is a
 * forward-looking fallback.
 *
 * Pure: same input → same output, no side effects.
 */
export function resolveChordKeyPositions(
  chordSemitones: readonly number[],
  rootPc: number,
  startPc: number,
): readonly ResolvedChordKey[] {
  const r0 = (((rootPc - startPc) % 12) + 12) % 12
  return chordSemitones.map((s) => {
    let target = r0 + s
    while (target > 23) target -= 12
    return { abs: target, role: s === 0 ? ('root' as const) : ('scale' as const) }
  })
}
