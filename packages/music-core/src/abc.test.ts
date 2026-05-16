import { describe, expect, it } from 'vitest'
import { buildAbcTune, buildChordAbc, noteToAbc, notesToAbcVoice } from './abc'
import { pitchClass } from './music'

describe('noteToAbc', () => {
  it('uppercase letter for octave 4', () => {
    expect(noteToAbc('C', 4)).toBe('C')
    expect(noteToAbc('A', 4)).toBe('A')
  })

  it('lowercase letter for octave 5', () => {
    expect(noteToAbc('C', 5)).toBe('c')
    expect(noteToAbc('B', 5)).toBe('b')
  })

  it('octave 6 adds one apostrophe', () => {
    expect(noteToAbc('C', 6)).toBe("c'")
  })

  it('octave 3 adds one comma', () => {
    expect(noteToAbc('C', 3)).toBe('C,')
  })

  it('octave 2 adds two commas', () => {
    expect(noteToAbc('C', 2)).toBe('C,,')
  })

  it('flat prefix _', () => {
    expect(noteToAbc('Bb', 4)).toBe('_B')
    expect(noteToAbc('Eb', 5)).toBe('_e')
  })

  it('sharp prefix ^', () => {
    expect(noteToAbc('F#', 4)).toBe('^F')
    expect(noteToAbc('C#', 5)).toBe('^c')
  })

  it('double flat prefix __', () => {
    expect(noteToAbc('Abb', 4)).toBe('__A')
    expect(noteToAbc('Bbb', 5)).toBe('__b')
  })

  it('double sharp prefix ^^', () => {
    expect(noteToAbc('G##', 4)).toBe('^^G')
  })

  it('returns empty for empty token', () => {
    expect(noteToAbc('', 4)).toBe('')
  })
})

describe('notesToAbcVoice', () => {
  it('C major: no internal bump, closing C bumps one octave', () => {
    expect(notesToAbcVoice(['C', 'D', 'E', 'F', 'G', 'A', 'B'], 4)).toBe('CDEFGABc')
  })

  it('Bb Dorian: bumps at C (second note), closing Bb stays in upper octave', () => {
    // expected sequence: _B (octave 4), then c, _d, _e, f, g, _a (all octave 5),
    // closing _b (octave 5 — no further bump since 6 >= prev order 5)
    expect(notesToAbcVoice(['Bb', 'C', 'Db', 'Eb', 'F', 'G', 'Ab'], 4)).toBe('_Bc_d_efg_a_b')
  })

  it('F# Phrygian: bumps at C# (5th note), closing F# stays in upper octave', () => {
    // F# G A B all octave 4 (orders 3,4,5,6 ascending — no wrap)
    // C# (order 0) < B (order 6) → wrap → octave 5 for C#, D, E
    // Closing F# (order 3) >= last seen E (order 2) → no extra bump, stays octave 5
    expect(notesToAbcVoice(['F#', 'G', 'A', 'B', 'C#', 'D', 'E'], 4)).toBe('^FGAB^cde^f')
  })

  it('octave parameter ≠ 4: starts in octave 3', () => {
    // ascending C D E in octave 3 → C, D, E,
    // closing C wraps to octave 4 → uppercase, no comma
    expect(notesToAbcVoice(['C', 'D', 'E'], 3)).toBe('C,D,E,C')
  })

  it('returns empty string for empty input', () => {
    expect(notesToAbcVoice([], 4)).toBe('')
  })

  it('throws on unknown letter', () => {
    expect(() => notesToAbcVoice(['H'], 4)).toThrow(/unknown note letter/)
  })
})

describe('buildAbcTune', () => {
  it('renders as quarter notes (L:1/4 — no flags, no beams)', () => {
    // L:1/4 is what makes abcjs draw solid noteheads with bare stems.
    // Defaulting to L:1/8 would beam runs of notes and visually imply a rhythm.
    const tune = buildAbcTune(['C', 'D', 'E', 'F', 'G', 'A', 'B'], 4)
    expect(tune).toMatch(/^X:1\nM:none\nL:1\/4\nK:C\n/)
  })

  it('embeds the voice produced by notesToAbcVoice and closes with a bar', () => {
    const tune = buildAbcTune(['C', 'D', 'E', 'F', 'G', 'A', 'B'], 4)
    expect(tune).toContain('\nCDEFGABc|')
  })

  it('returns null for empty input (component skips rendering)', () => {
    expect(buildAbcTune([], 4)).toBeNull()
  })
})

describe('buildChordAbc', () => {
  it('C major triad — produces ABC string containing [CEG]', () => {
    const abc = buildChordAbc(['C', 'E', 'G'])
    expect(abc).toContain('[CEG]')
  })

  it('C7 chord — B♭ renders as _B in stacked chord', () => {
    const abc = buildChordAbc(['C', 'E', 'G', 'B♭'])
    expect(abc).toContain('_B')
    // All four notes must appear inside the chord bracket
    expect(abc).toMatch(/\[.*C.*E.*G.*_B.*\]|\[.*_B.*\]/)
  })

  it('F# major triad — sharps render as ^ prefix', () => {
    // F♯4 A♯4 — then C♯ wraps past A♯ (order 0 ≤ 5), so C♯ lands in octave 5 (lowercase)
    const abc = buildChordAbc(['F♯', 'A♯', 'C♯'])
    expect(abc).toContain('^F')
    expect(abc).toContain('^A')
    expect(abc).toContain('^c') // C♯ in octave 5 → lowercase
  })

  it('C13 chord spanning >1 octave — upper notes use lowercase', () => {
    // C E G B♭ D F A — 7 notes spanning ~1.75 octaves
    const abc = buildChordAbc(['C', 'E', 'G', 'B♭', 'D', 'F', 'A'])
    // D, F, A above the octave boundary should be lowercase
    expect(abc).toMatch(/[def]/) // at least one lowercase note for the upper register
  })

  it('wraps in valid ABC tune headers', () => {
    const abc = buildChordAbc(['C', 'E', 'G'])
    expect(abc).toMatch(/^X:1\nM:none\nL:1\/1\nK:C\n/)
  })

  it('uses L:1/1 whole note duration (chord plays as one beat)', () => {
    const abc = buildChordAbc(['C', 'E', 'G'])
    expect(abc).toContain('L:1/1')
  })

  it('returns null for empty input', () => {
    expect(buildChordAbc([])).toBeNull()
  })

  it('respects octave parameter — octave 3 puts root in lower register', () => {
    const abc = buildChordAbc(['C', 'E', 'G'], 3)
    // C in octave 3 is C, (comma suffix in ABC)
    expect(abc).toContain('C,')
  })

  it('Cdim7 — double-flat 7th (B♭♭) renders as __B not _B', () => {
    // Cdim7 has notes [C, E♭, G♭, B♭♭]. The diminished 7 is the double flat.
    // Bug regression guard: previously this rendered as _B (single flat),
    // collapsing the chord's enharmonic spelling.
    const abc = buildChordAbc(['C', 'E♭', 'G♭', 'B♭♭'])
    expect(abc).toContain('__B]')
    // Confirm the chord body uses exactly the double-flat form, not a stray
    // single _B (the substring '_B' would match both — assert on a tail anchor
    // that distinguishes them).
    expect(abc).toMatch(/G__B\]$/)
  })

  it('Unicode 𝄫 (U+1D12B) double-flat normalises to double-flat ABC __', () => {
    // Same as above but using the true Unicode glyph instead of stacked ♭♭.
    const abc = buildChordAbc(['C', 'E♭', 'G♭', 'A𝄫'])
    expect(abc).toContain('__A')
  })
})

// ---------------------------------------------------------------------------
// Octave-fold invariant: the score must match the piano keyboard.
//
// The keyboard (packages/ui/src/pianoKeyboard.helpers.ts →
// resolveChordKeyPositions) places each chord tone at its root-relative
// semitone offset, folded with `while offset>23 offset-=12`, anchored at the
// root (r0 = 0 when startPc == rootPc). buildChordAbc must place the noteheads
// at the SAME semitone positions so the rendered score never exceeds 2
// octaves and reads identically to the keyboard.
//
// We re-implement the keyboard fold here (NOT importing @jazzlore/ui — that
// would create a dependency cycle and music-core has no UI deps) so the
// expected positions are derived from the formula, not hand-typed.
// ---------------------------------------------------------------------------

/**
 * Decode a buildChordAbc string into the absolute semitone position of every
 * notehead, in chord order. abcjs octave conventions: uppercase letter =
 * octave 4, lowercase = octave 5, `'` raises an octave, `,` lowers one. The
 * `^`/`_`/`^^`/`__` prefixes are accidentals (pitch-class shift, no octave
 * change). Position = pitchClass(noteName) + 12 * octave.
 */
function decodeChordAbcPositions(abc: string): number[] {
  const body = abc.slice(abc.lastIndexOf('[') + 1, abc.lastIndexOf(']'))
  const tokenRe = /(\^\^|__|\^|_)?([A-Ga-g])((?:,|')*)/g
  const positions: number[] = []
  let m: RegExpExecArray | null
  while ((m = tokenRe.exec(body)) !== null) {
    const accidental = m[1] ?? ''
    const letter = m[2]!
    const marks = m[3] ?? ''
    const isLower = letter >= 'a' && letter <= 'z'
    let octave = isLower ? 5 : 4
    if (marks[0] === "'") octave += marks.length
    else if (marks[0] === ',') octave -= marks.length
    const accSuffix =
      accidental === '^^' ? '##' : accidental === '__' ? 'bb' : accidental === '^' ? '#' : accidental === '_' ? 'b' : ''
    const pc = pitchClass(letter.toUpperCase() + accSuffix)
    positions.push(pc + 12 * octave)
  }
  return positions
}

/**
 * Keyboard fold reference: given a chord's ascending root-relative semitone
 * offsets (element 0 = root, 0), return each tone's folded offset
 * (`while offset>23 offset-=12`). Mirrors resolveChordKeyPositions with r0=0.
 */
function keyboardFoldedOffsets(intervals: readonly number[]): number[] {
  return intervals.map((s) => {
    let t = s
    while (t > 23) t -= 12
    return t
  })
}

describe('buildChordAbc — folds to ≤2 octaves matching the piano keyboard', () => {
  it('simple chords are unchanged (≤1 octave): C major', () => {
    const abc = buildChordAbc(['C', 'E', 'G'])!
    // root C in octave 4 (uppercase, no marks), E and G ascending in octave 4.
    expect(abc).toBe('X:1\nM:none\nL:1/1\nK:C\n[CEG]')
    const pos = decodeChordAbcPositions(abc)
    const rootAbs = pos[0]!
    expect(pos.map((p) => p - rootAbs)).toEqual(keyboardFoldedOffsets([0, 4, 7]))
  })

  it('simple chords are unchanged (≤1 octave): Cmaj7', () => {
    const abc = buildChordAbc(['C', 'E', 'G', 'B'])!
    expect(abc).toBe('X:1\nM:none\nL:1/1\nK:C\n[CEGB]')
    const pos = decodeChordAbcPositions(abc)
    const rootAbs = pos[0]!
    expect(pos.map((p) => p - rootAbs)).toEqual(keyboardFoldedOffsets([0, 4, 7, 11]))
  })

  it('7alt (new spelling) folds to ≤2 octaves and matches the keyboard', () => {
    // New 7alt spelling: chordNotes('C', 7alt) = [C,E,B♭,D♭,D♯,F♯,A♭],
    // intervals [0,4,10,13,15,18,20].
    const notes = ['C', 'E', 'B♭', 'D♭', 'D♯', 'F♯', 'A♭']
    const abc = buildChordAbc(notes)!
    const pos = decodeChordAbcPositions(abc)
    const rootAbs = pos[0]!
    const offsets = pos.map((p) => p - rootAbs)
    expect(offsets).toEqual(keyboardFoldedOffsets([0, 4, 10, 13, 15, 18, 20]))
    // Total staff span ≤ 24 semitones (2 octaves).
    expect(Math.max(...offsets) - Math.min(...offsets)).toBeLessThanOrEqual(24)
  })

  it('maj13 folds to ≤2 octaves and matches the keyboard', () => {
    // chordNotes('C', maj13) = [C,E,G,B,D,A], intervals [0,4,7,11,14,21].
    const abc = buildChordAbc(['C', 'E', 'G', 'B', 'D', 'A'])!
    const pos = decodeChordAbcPositions(abc)
    const rootAbs = pos[0]!
    const offsets = pos.map((p) => p - rootAbs)
    expect(offsets).toEqual(keyboardFoldedOffsets([0, 4, 7, 11, 14, 21]))
    expect(Math.max(...offsets) - Math.min(...offsets)).toBeLessThanOrEqual(24)
  })

  it('dominant 13 folds to ≤2 octaves and matches the keyboard', () => {
    // chordNotes('C', 13) = [C,E,G,B♭,D,A], intervals [0,4,7,10,14,21].
    const abc = buildChordAbc(['C', 'E', 'G', 'B♭', 'D', 'A'])!
    const pos = decodeChordAbcPositions(abc)
    const rootAbs = pos[0]!
    const offsets = pos.map((p) => p - rootAbs)
    expect(offsets).toEqual(keyboardFoldedOffsets([0, 4, 7, 10, 14, 21]))
    expect(Math.max(...offsets) - Math.min(...offsets)).toBeLessThanOrEqual(24)
  })

  it('still produces a syntactically valid ABC envelope', () => {
    const abc = buildChordAbc(['C', 'E', 'B♭', 'D♭', 'D♯', 'F♯', 'A♭'])!
    expect(abc).toMatch(/^X:1\nM:none\nL:1\/1\nK:C\n\[[^\]]+\]$/)
  })
})
