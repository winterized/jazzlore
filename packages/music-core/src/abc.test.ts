import { describe, expect, it } from 'vitest'
import { buildAbcTune, buildChordAbc, noteToAbc, notesToAbcVoice } from './abc'

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
})
