/** Pitch order within an octave — C is the boundary in scientific pitch notation. */
const PITCH_ORDER: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 }

/**
 * Convert a canonical note name (e.g. 'Bb', 'F#', 'C') at a given octave to its
 * abcjs notation token. abcjs uses uppercase for octave 4, lowercase for octave 5,
 * commas to descend (octave 3 = `C,`), apostrophes to ascend (octave 6 = `c'`).
 * `^` = sharp prefix, `_` = flat prefix.
 */
export function noteToAbc(note: string, octave: number): string {
  const accidental = note.endsWith('#') ? '^' : note.endsWith('b') ? '_' : ''
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
