import { transpose } from '@tonaljs/note'
import type { ScaleDefinition } from './scale-types'

/**
 * Map a display interval token from CURATED_SCALES (e.g. "♭3", "♯4") to a
 * Tonal interval string suitable for transpose(). The display tokens
 * encode the scale-degree spelling intent (♭6 vs ♯5 are 8 semitones apart
 * but spell differently relative to the root letter — F# + ♯5 = C##,
 * F# + ♭6 = D). Driving spelling from the display token rather than from
 * semitones alone keeps the note names diatonic.
 */
const DISPLAY_TO_INTERVAL: Record<string, string> = {
  '1': '1P',
  '♭2': '2m',
  '2': '2M',
  '♯2': '2A',
  '♭3': '3m',
  '3': '3M',
  '♭4': '4d',
  '4': '4P',
  '♯4': '4A',
  '♭5': '5d',
  '5': '5P',
  '♯5': '5A',
  '♭6': '6m',
  '6': '6M',
  '♭♭7': '7d',
  '♭7': '7m',
  '7': '7M',
}

export function notesForScale(root: string, scale: ScaleDefinition): string[] {
  return scale.intervalDisplay.map((token) => {
    const interval = DISPLAY_TO_INTERVAL[token]
    if (!interval) {
      throw new Error(`Unsupported interval token "${token}" in scale ${scale.id}`)
    }
    return transpose(root, interval)
  })
}

/**
 * Canonical chromatic pitch class (0..11) for a note token like 'C', 'F#', 'Bb', 'B𝄫'.
 * - C = 0, C#/Db = 1, ..., B = 11
 * - Sharps: '#'
 * - Flats: 'b'
 * - Double flats: '𝄫' (U+1D12B) or 'bb' suffix — handled by repeatedly subtracting 1
 * Throws on an unknown leading letter.
 */
export function pitchClass(note: string): number {
  const letterOffsets: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
  const head = note[0]
  if (!head) throw new Error('empty note token')
  const base = letterOffsets[head]
  if (base === undefined) throw new Error(`unknown note letter "${head}" in token "${note}"`)
  let pc = base
  // Walk remaining characters for accidentals: '#' = +1, 'b' = -1 (mod 12)
  // (Double flat 𝄫 is U+1D12B; treat any non-#/non-b as ignored for v1 simplicity)
  for (let i = 1; i < note.length; i++) {
    const ch = note[i]
    if (ch === '#') pc = (pc + 1) % 12
    else if (ch === 'b') pc = (pc + 11) % 12
  }
  return pc
}

/**
 * Tag each canonical note in a one-octave-ascending scale with its octave number.
 * Octave bumps when the letter order wraps (e.g. B → C, or A → C, or A → Bb).
 * We use letter-position ordering (C=0..B=6), not pitch-class — sharps and
 * flats stay in the same letter slot, so 'B' → 'C' is a wrap but 'B' → 'C#'
 * is also a wrap, while 'C' → 'C#' is not.
 *
 *   withOctaves(['Bb','C','Db','Eb','F','G','Ab'], 4)
 *     // ['Bb4','C5','Db5','Eb5','F5','G5','Ab5']
 */
export function withOctaves(notes: string[], startOctave: number): string[] {
  const letterOrder: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 }
  let oct = startOctave
  let prev = -1
  return notes.map((n) => {
    const head = n[0]
    if (!head) throw new Error('empty note token')
    const order = letterOrder[head]
    if (order === undefined) {
      throw new Error(`unknown note letter "${head}" in token "${n}"`)
    }
    if (prev !== -1 && order < prev) oct += 1
    prev = order
    return `${n}${oct}`
  })
}
