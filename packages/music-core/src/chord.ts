/**
 * chord.ts — resolve a chord definition + root into spelled note names.
 *
 * Design decisions
 * ================
 * 1. Spelling via Tonal interval strings, not raw semitones.
 *    Each ChordDefinition carries `tonalIntervals` (e.g. '3M', '5d') which
 *    encode the enharmonic spelling intent. Two chords can share a semitone
 *    yet spell it differently:
 *      - m7♭5 tritone: '5d' → G♭ over C   (diminished-5th function)
 *      - 7alt tritone: '4A' → F♯ over C   (augmented-4th / ♯4 function)
 *      - dim7 minor-7th: '7d' → B♭♭ over C (diminished-7th function)
 *      - 6th chord: '6M' → A over C       (major-6th function)
 *
 * 2. Root format: display Unicode accidentals (♭ / ♯).
 *    `chordNotes` accepts roots in display form (e.g. 'F♯', 'B♭', 'C') and
 *    converts them to ASCII for Tonal before transposing. Results are
 *    converted back to Unicode before returning.
 *
 * 3. Double-flat notation.
 *    Tonal returns 'Abb' for B♭ dim7's 4th note (Tonal '7d'). We convert
 *    the trailing 'bb' to '♭♭' (two flat signs). We do NOT use the
 *    double-flat glyph U+1D12B (𝄫) as it has poor font coverage.
 *    Example: B♭ dim7 → ['B♭', 'D♭', 'F♭', 'A♭♭'].
 *
 * 4. Pure functions — no state, no side effects, deterministic.
 */

import { transpose } from '@tonaljs/note'
import type { ChordDefinition, ChordVoicing } from './chord-types'

// ---------------------------------------------------------------------------
// Internal helpers — Unicode ↔ ASCII accidental conversion
// ---------------------------------------------------------------------------

/** Convert a display-form note ('F♯', 'B♭') to Tonal-compatible ASCII ('F#', 'Bb'). */
function toAscii(note: string): string {
  return note.replace(/♯/g, '#').replace(/♭/g, 'b')
}

/**
 * Convert a Tonal result ('F#', 'Bb', 'Abb', 'Bbb') to display form
 * ('F♯', 'B♭', 'A♭♭', 'B♭♭').
 *
 * Strategy: replace every '#' with '♯' and every 'b' (after the first
 * character, which is always the letter) with '♭'. The letter is always
 * a single capital A-G, never 'b', so the replacement is safe.
 */
function toUnicode(note: string): string {
  if (!note) return note
  const letter = note[0] ?? ''
  const accidentals = note.slice(1)
  const unicodeAcc = accidentals.replace(/#/g, '♯').replace(/b/g, '♭')
  return letter + unicodeAcc
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Resolve a chord definition + root into a ChordVoicing.
 *
 * @param rootNote  Root in display form, e.g. 'C', 'F♯', 'B♭'.
 * @param definition  A ChordDefinition with `tonalIntervals` populated.
 * @returns  ChordVoicing with `root` (echoing the input) and `notes` (spelled,
 *           in Unicode display form, root-first, in chord-stack order).
 *
 * @example
 *   chordNotes('C', cmaj7def) // { root: 'C', notes: ['C', 'E', 'G', 'B'] }
 *   chordNotes('F♯', fm7def)  // { root: 'F♯', notes: ['F♯', 'A', 'C♯', 'E'] }
 */
export function chordNotes(rootNote: string, definition: ChordDefinition): ChordVoicing {
  const asciiRoot = toAscii(rootNote)
  const notes = definition.tonalIntervals.map((interval) => {
    const result = transpose(asciiRoot, interval)
    return toUnicode(result)
  })
  return { root: rootNote, notes }
}

/**
 * Format the primary chord symbol by concatenating root and suffix.
 *
 * @param rootNote  Root in display form, e.g. 'F♯'.
 * @param suffix    Primary suffix from ChordDefinition, e.g. 'maj7', ''.
 * @returns  Display string, e.g. 'F♯maj7'. Empty suffix returns just the root.
 */
export function formatPrimarySymbol(rootNote: string, suffix: string): string {
  return rootNote + suffix
}

/**
 * Format the alternate chord symbol, or return null if no alternate exists.
 *
 * @param rootNote  Root in display form, e.g. 'F♯'.
 * @param suffix    Alternate suffix, e.g. 'Δ7', or undefined.
 * @returns  Display string ('F♯Δ7') or null when suffix is undefined.
 */
export function formatAlternateSymbol(rootNote: string, suffix: string | undefined): string | null {
  if (suffix === undefined) return null
  return rootNote + suffix
}
