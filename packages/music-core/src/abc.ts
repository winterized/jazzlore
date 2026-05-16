import { pitchClass } from './music'

/** Pitch order within an octave — C is the boundary in scientific pitch notation. */
const PITCH_ORDER: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 }

/**
 * Convert a canonical note name (e.g. 'Bb', 'F#', 'C') at a given octave to its
 * abcjs notation token. abcjs uses uppercase for octave 4, lowercase for octave 5,
 * commas to descend (octave 3 = `C,`), apostrophes to ascend (octave 6 = `c'`).
 * `^` = sharp prefix, `_` = flat prefix.
 */
export function noteToAbc(note: string, octave: number): string {
  // Order matters: check the two-char accidentals before the one-char ones,
  // so 'Abb' is recognised as a double flat (__) not a single 'A' + flat 'b'.
  const accidental = note.endsWith('##')
    ? '^^'
    : note.endsWith('bb')
    ? '__'
    : note.endsWith('#')
    ? '^'
    : note.endsWith('b')
    ? '_'
    : ''
  const letter = note[0]
  if (!letter) return ''
  if (octave === 4) return `${accidental}${letter}`
  if (octave > 4) return `${accidental}${letter.toLowerCase()}${"'".repeat(octave - 5)}`
  return `${accidental}${letter}${','.repeat(4 - octave)}`
}

/**
 * Convert a one-octave-ascending scale's notes into a single abcjs voice line,
 * including a closing tonic an octave higher. Bumps the octave whenever the
 * pitch order wraps past a C boundary (e.g. B → C, or any letter back to a
 * lower-ordered letter).
 *
 * Throws on an unknown letter (anything outside C/D/E/F/G/A/B).
 */
export function notesToAbcVoice(notes: string[], startOctave: number): string {
  if (notes.length === 0) return ''
  const tonic = notes[0]
  if (!tonic) return ''

  const orderOf = (n: string): number => {
    const head = n[0]
    if (!head) throw new Error(`empty note token`)
    const o = PITCH_ORDER[head]
    if (o === undefined) throw new Error(`unknown note letter "${head}" in token "${n}"`)
    return o
  }

  let oct = startOctave
  let prevOrder = -1
  const tokens = notes.map((n) => {
    const order = orderOf(n)
    if (prevOrder !== -1 && order < prevOrder) oct += 1
    prevOrder = order
    return noteToAbc(n, oct)
  })

  const closingOrder = orderOf(tonic)
  const closingOct = closingOrder < prevOrder ? oct + 1 : oct
  tokens.push(noteToAbc(tonic, closingOct))
  return tokens.join('')
}

/**
 * Build the full abc tune string for a scale, ready to pass to abcjs.renderAbc.
 *
 * Headers:
 *   X:1     reference number
 *   M:none  no meter / no bar lines (scales aren't metrical)
 *   L:1/4   note length = quarter (renders solid noteheads with stems, no flags
 *           and no beams — the right read for a scale; eighths would default
 *           to beaming and visually imply a rhythmic group)
 *   K:C     key = C (we encode accidentals on every note via _ and ^)
 *
 * Returns null when there are no notes to render.
 */
export function buildAbcTune(notes: string[], startOctave: number): string | null {
  const voice = notesToAbcVoice(notes, startOctave)
  if (!voice) return null
  return `X:1\nM:none\nL:1/4\nK:C\n${voice}|`
}

/**
 * Normalise a note name that may carry Unicode accidentals (♯ / ♭ / 𝄫) to the
 * ASCII convention used throughout this module (# / b / bb). The single-character
 * double-flat U+1D12B is expanded to two ASCII flats so downstream code only has
 * to handle one accidental representation.
 */
function normaliseNote(note: string): string {
  return note.replace(/𝄫/g, 'bb').replace(/♯/g, '#').replace(/♭/g, 'b')
}

/**
 * Build a complete ABC tune string for a chord rendered as stacked noteheads
 * (`[CEG]` syntax), ready to pass to abcjs.renderAbc.
 *
 * Notes are accepted with either Unicode (♯/♭) or ASCII (#/b) accidentals.
 * The root note (the first element) is placed in `octave` (default 4).
 *
 * **Octave-fold — matches the piano keyboard.** The chord is laid out at the
 * SAME semitone positions the keyboard uses
 * (`packages/ui/src/pianoKeyboard.helpers.ts → resolveChordKeyPositions`):
 * each note's root-relative semitone offset is reconstructed as the smallest
 * value ≥ the previous note's offset that is congruent (mod 12) to the note's
 * pitch class relative to the root — this rebuilds the ascending chord stack
 * the keyboard receives via its `intervals` array (so a 13th's 9th sits at
 * +14, not +2). The offset is then folded into the fixed 2-octave window with
 * `while (offset > 23) offset -= 12`, identical to the keyboard's fold. Each
 * notehead's staff octave is derived from that folded offset, so the rendered
 * score never exceeds 2 octaves and reads identically to the keyboard dots.
 * Chords that already fit in ≤2 octaves (triads, 7ths) are unchanged.
 *
 * Headers:
 *   X:1     reference number
 *   M:none  no meter / no bar lines
 *   L:1/1   whole-note duration (chord is a single simultaneous beat)
 *   K:C     no key signature — every accidental is written explicitly
 *
 * Returns null when the notes array is empty.
 */
export function buildChordAbc(notes: string[], octave = 4): string | null {
  if (notes.length === 0) return null

  const normalised = notes.map(normaliseNote)

  const rootName = normalised[0]!
  const rootPc = pitchClass(rootName)
  // Absolute pitch reference for the root, in pitch-class semitones.
  const rootMidi = rootPc + octave * 12

  let prevOffset = 0
  const tokens = normalised.map((n, i) => {
    let offset: number
    if (i === 0) {
      offset = 0
    } else {
      // Smallest offset ≥ prevOffset that is congruent (mod 12) to this note's
      // pitch class relative to the root — rebuilds the ascending chord stack.
      const rel = (((pitchClass(n) - rootPc) % 12) + 12) % 12
      offset = prevOffset + (((rel - prevOffset) % 12) + 12) % 12
      // Keyboard fold: keep every tone inside the 2-octave (24-semitone) window.
      while (offset > 23) offset -= 12
    }
    prevOffset = offset
    const target = rootMidi + offset
    // Choose the staff octave so the notehead lands on `target`. abcjs places
    // by (letter, octave); pitchClass(n) gives this note's own class so the
    // rounding resolves the correct octave even across enharmonic spellings.
    const oct = Math.round((target - pitchClass(n)) / 12)
    return noteToAbc(n, oct)
  })

  return `X:1\nM:none\nL:1/1\nK:C\n[${tokens.join('')}]`
}
