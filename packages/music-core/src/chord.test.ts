import { describe, expect, it } from 'vitest'
import type { ChordDefinition } from './chord-types'
import { chordNotes, formatAlternateSymbol, formatPrimarySymbol } from './chord'
import { pitchClass } from './music'

// ---------------------------------------------------------------------------
// Inline test fixtures — 27 chord definitions with tonalIntervals.
// Defined here independently from any curated data file (Phase 2).
// ---------------------------------------------------------------------------

const TEST_DEFINITIONS: readonly ChordDefinition[] = [
  { id: 'maj',     primarySuffix: '',       fullName: 'major',                 intervals: [0,4,7],          tonalIntervals: ['1P','3M','5P'] },
  { id: 'min',     primarySuffix: 'm',      fullName: 'minor',                 intervals: [0,3,7],          tonalIntervals: ['1P','3m','5P'] },
  { id: 'dim',     primarySuffix: 'dim',    fullName: 'diminished',            intervals: [0,3,6],          tonalIntervals: ['1P','3m','5d'] },
  { id: 'aug',     primarySuffix: 'aug',    fullName: 'augmented',             intervals: [0,4,8],          tonalIntervals: ['1P','3M','5A'] },
  { id: 'sus2',    primarySuffix: 'sus2',   fullName: 'suspended 2nd',         intervals: [0,2,7],          tonalIntervals: ['1P','2M','5P'] },
  { id: 'sus4',    primarySuffix: 'sus4',   fullName: 'suspended 4th',         intervals: [0,5,7],          tonalIntervals: ['1P','4P','5P'] },
  { id: '6',       primarySuffix: '6',      fullName: 'major 6th',             intervals: [0,4,7,9],        tonalIntervals: ['1P','3M','5P','6M'] },
  { id: 'm6',      primarySuffix: 'm6',     fullName: 'minor 6th',             intervals: [0,3,7,9],        tonalIntervals: ['1P','3m','5P','6M'] },
  { id: '6_9',     primarySuffix: '6/9',    fullName: 'six-nine',              intervals: [0,4,7,9,14],     tonalIntervals: ['1P','3M','5P','6M','9M'] },
  { id: 'maj7',    primarySuffix: 'maj7',   fullName: 'major 7th',             intervals: [0,4,7,11],       tonalIntervals: ['1P','3M','5P','7M'] },
  { id: 'm7',      primarySuffix: 'm7',     fullName: 'minor 7th',             intervals: [0,3,7,10],       tonalIntervals: ['1P','3m','5P','7m'] },
  { id: '7',       primarySuffix: '7',      fullName: 'dominant 7th',          intervals: [0,4,7,10],       tonalIntervals: ['1P','3M','5P','7m'] },
  { id: 'm7b5',    primarySuffix: 'm7♭5',   fullName: 'half-diminished 7th',   intervals: [0,3,6,10],       tonalIntervals: ['1P','3m','5d','7m'] },
  { id: 'dim7',    primarySuffix: 'dim7',   fullName: 'diminished 7th',        intervals: [0,3,6,9],        tonalIntervals: ['1P','3m','5d','7d'] },
  { id: 'mmaj7',   primarySuffix: 'mMaj7',  fullName: 'minor-major 7th',       intervals: [0,3,7,11],       tonalIntervals: ['1P','3m','5P','7M'] },
  { id: 'maj9',    primarySuffix: 'maj9',   fullName: 'major 9th',             intervals: [0,4,7,11,14],    tonalIntervals: ['1P','3M','5P','7M','9M'] },
  { id: 'm9',      primarySuffix: 'm9',     fullName: 'minor 9th',             intervals: [0,3,7,10,14],    tonalIntervals: ['1P','3m','5P','7m','9M'] },
  { id: '9',       primarySuffix: '9',      fullName: 'dominant 9th',          intervals: [0,4,7,10,14],    tonalIntervals: ['1P','3M','5P','7m','9M'] },
  { id: '7b9',     primarySuffix: '7♭9',    fullName: 'dominant 7♭9',          intervals: [0,4,7,10,13],    tonalIntervals: ['1P','3M','5P','7m','9m'] },
  { id: '7s9',     primarySuffix: '7♯9',    fullName: 'dominant 7♯9',          intervals: [0,4,7,10,15],    tonalIntervals: ['1P','3M','5P','7m','9A'] },
  { id: 'm11',     primarySuffix: 'm11',    fullName: 'minor 11th',            intervals: [0,3,7,10,14,17], tonalIntervals: ['1P','3m','5P','7m','9M','11P'] },
  { id: 'maj7s11', primarySuffix: 'maj7♯11',fullName: 'Lydian major 7',        intervals: [0,4,7,11,18],    tonalIntervals: ['1P','3M','5P','7M','11A'] },
  { id: '7s11',    primarySuffix: '7♯11',   fullName: 'Lydian dominant',       intervals: [0,4,7,10,14,18], tonalIntervals: ['1P','3M','5P','7m','9M','11A'] },
  { id: 'maj13',   primarySuffix: 'maj13',  fullName: 'major 13th',            intervals: [0,4,7,11,14,21], tonalIntervals: ['1P','3M','5P','7M','9M','13M'] },
  { id: '13',      primarySuffix: '13',     fullName: 'dominant 13th',         intervals: [0,4,7,10,14,21], tonalIntervals: ['1P','3M','5P','7m','9M','13M'] },
  { id: '7b13',    primarySuffix: '7♭13',   fullName: 'dominant 7♭13',         intervals: [0,4,7,10,13,20], tonalIntervals: ['1P','3M','5P','7m','9m','13m'] },
  // 7alt: the tritone is spelled as augmented 4th (F♯ over C), not diminished 5th (G♭),
  // matching the altered-scale convention where the note functions as ♯4/♭5 but
  // is displayed as ♯4 (raised 4th) in this chord stack.
  { id: '7alt',    primarySuffix: '7alt',   fullName: 'altered dominant',      intervals: [0,4,6,10,13,15,20], tonalIntervals: ['1P','3M','4A','7m','9m','9A','13m'] },
]

const find = (id: string): ChordDefinition => {
  const d = TEST_DEFINITIONS.find((c) => c.id === id)
  if (!d) throw new Error(`chord ${id} missing from test fixture`)
  return d
}

// ---------------------------------------------------------------------------
// Explicit pinning tests (spec-mandated)
// ---------------------------------------------------------------------------

describe('chordNotes — explicit pin tests', () => {
  it('C6/9 includes the 5th: [C, E, G, A, D]', () => {
    expect(chordNotes('C', find('6_9')).notes).toEqual(['C', 'E', 'G', 'A', 'D'])
  })

  it('C13 omits the 11th: [C, E, G, B♭, D, A]', () => {
    expect(chordNotes('C', find('13')).notes).toEqual(['C', 'E', 'G', 'B♭', 'D', 'A'])
  })

  it('C7alt is the 7-note altered stack: [C, E, F♯, B♭, D♭, D♯, A♭]', () => {
    expect(chordNotes('C', find('7alt')).notes).toEqual(['C', 'E', 'F♯', 'B♭', 'D♭', 'D♯', 'A♭'])
  })

  it('Cmaj7 baseline: [C, E, G, B]', () => {
    expect(chordNotes('C', find('maj7')).notes).toEqual(['C', 'E', 'G', 'B'])
  })

  it('F♯m7 preserves sharp-root spelling: [F♯, A, C♯, E]', () => {
    expect(chordNotes('F♯', find('m7')).notes).toEqual(['F♯', 'A', 'C♯', 'E'])
  })

  it('B♭dim7 4th note is A♭♭ (double-flat via Tonal 7d)', () => {
    // Tonal transposes Bb by 7d → Abb; we display as A♭♭ (two flat signs, not U+1D12B double-flat).
    expect(chordNotes('B♭', find('dim7')).notes).toEqual(['B♭', 'D♭', 'F♭', 'A♭♭'])
  })

  it('ChordVoicing root matches the input root', () => {
    const v = chordNotes('F♯', find('maj7'))
    expect(v.root).toBe('F♯')
  })
})

// ---------------------------------------------------------------------------
// Symbol formatting tests
// ---------------------------------------------------------------------------

describe('formatPrimarySymbol', () => {
  it('F♯ maj7 → F♯maj7', () => {
    expect(formatPrimarySymbol('F♯', 'maj7')).toBe('F♯maj7')
  })

  it('C with empty suffix → C (no trailing space/char)', () => {
    expect(formatPrimarySymbol('C', '')).toBe('C')
  })

  it('B♭ with m7♭5 → B♭m7♭5', () => {
    expect(formatPrimarySymbol('B♭', 'm7♭5')).toBe('B♭m7♭5')
  })
})

describe('formatAlternateSymbol', () => {
  it('F♯ Δ7 → F♯Δ7', () => {
    expect(formatAlternateSymbol('F♯', 'Δ7')).toBe('F♯Δ7')
  })

  it('C undefined → null (no alternate)', () => {
    expect(formatAlternateSymbol('C', undefined)).toBeNull()
  })

  it('B♭ ø7 → B♭ø7', () => {
    expect(formatAlternateSymbol('B♭', 'ø7')).toBe('B♭ø7')
  })
})

// ---------------------------------------------------------------------------
// Parameterized 81-case fixture (27 chords × 3 roots: C, F♯, B♭)
// Expected outputs were pre-computed by transposing with Tonal interval strings
// and converting ASCII accidentals to Unicode — derived independently of the
// chordNotes implementation (computed once, committed as static data below).
// ---------------------------------------------------------------------------

type Fixture = { id: string; root: string; notes: string[] }

const FIXTURES: readonly Fixture[] = [
  { id: 'maj',     root: 'C',  notes: ['C', 'E', 'G'] },
  { id: 'maj',     root: 'F♯', notes: ['F♯', 'A♯', 'C♯'] },
  { id: 'maj',     root: 'B♭', notes: ['B♭', 'D', 'F'] },
  { id: 'min',     root: 'C',  notes: ['C', 'E♭', 'G'] },
  { id: 'min',     root: 'F♯', notes: ['F♯', 'A', 'C♯'] },
  { id: 'min',     root: 'B♭', notes: ['B♭', 'D♭', 'F'] },
  { id: 'dim',     root: 'C',  notes: ['C', 'E♭', 'G♭'] },
  { id: 'dim',     root: 'F♯', notes: ['F♯', 'A', 'C'] },
  { id: 'dim',     root: 'B♭', notes: ['B♭', 'D♭', 'F♭'] },
  { id: 'aug',     root: 'C',  notes: ['C', 'E', 'G♯'] },
  { id: 'aug',     root: 'F♯', notes: ['F♯', 'A♯', 'C♯♯'] },
  { id: 'aug',     root: 'B♭', notes: ['B♭', 'D', 'F♯'] },
  { id: 'sus2',    root: 'C',  notes: ['C', 'D', 'G'] },
  { id: 'sus2',    root: 'F♯', notes: ['F♯', 'G♯', 'C♯'] },
  { id: 'sus2',    root: 'B♭', notes: ['B♭', 'C', 'F'] },
  { id: 'sus4',    root: 'C',  notes: ['C', 'F', 'G'] },
  { id: 'sus4',    root: 'F♯', notes: ['F♯', 'B', 'C♯'] },
  { id: 'sus4',    root: 'B♭', notes: ['B♭', 'E♭', 'F'] },
  { id: '6',       root: 'C',  notes: ['C', 'E', 'G', 'A'] },
  { id: '6',       root: 'F♯', notes: ['F♯', 'A♯', 'C♯', 'D♯'] },
  { id: '6',       root: 'B♭', notes: ['B♭', 'D', 'F', 'G'] },
  { id: 'm6',      root: 'C',  notes: ['C', 'E♭', 'G', 'A'] },
  { id: 'm6',      root: 'F♯', notes: ['F♯', 'A', 'C♯', 'D♯'] },
  { id: 'm6',      root: 'B♭', notes: ['B♭', 'D♭', 'F', 'G'] },
  { id: '6_9',     root: 'C',  notes: ['C', 'E', 'G', 'A', 'D'] },
  { id: '6_9',     root: 'F♯', notes: ['F♯', 'A♯', 'C♯', 'D♯', 'G♯'] },
  { id: '6_9',     root: 'B♭', notes: ['B♭', 'D', 'F', 'G', 'C'] },
  { id: 'maj7',    root: 'C',  notes: ['C', 'E', 'G', 'B'] },
  { id: 'maj7',    root: 'F♯', notes: ['F♯', 'A♯', 'C♯', 'E♯'] },
  { id: 'maj7',    root: 'B♭', notes: ['B♭', 'D', 'F', 'A'] },
  { id: 'm7',      root: 'C',  notes: ['C', 'E♭', 'G', 'B♭'] },
  { id: 'm7',      root: 'F♯', notes: ['F♯', 'A', 'C♯', 'E'] },
  { id: 'm7',      root: 'B♭', notes: ['B♭', 'D♭', 'F', 'A♭'] },
  { id: '7',       root: 'C',  notes: ['C', 'E', 'G', 'B♭'] },
  { id: '7',       root: 'F♯', notes: ['F♯', 'A♯', 'C♯', 'E'] },
  { id: '7',       root: 'B♭', notes: ['B♭', 'D', 'F', 'A♭'] },
  { id: 'm7b5',    root: 'C',  notes: ['C', 'E♭', 'G♭', 'B♭'] },
  { id: 'm7b5',    root: 'F♯', notes: ['F♯', 'A', 'C', 'E'] },
  { id: 'm7b5',    root: 'B♭', notes: ['B♭', 'D♭', 'F♭', 'A♭'] },
  { id: 'dim7',    root: 'C',  notes: ['C', 'E♭', 'G♭', 'B♭♭'] },
  { id: 'dim7',    root: 'F♯', notes: ['F♯', 'A', 'C', 'E♭'] },
  { id: 'dim7',    root: 'B♭', notes: ['B♭', 'D♭', 'F♭', 'A♭♭'] },
  { id: 'mmaj7',   root: 'C',  notes: ['C', 'E♭', 'G', 'B'] },
  { id: 'mmaj7',   root: 'F♯', notes: ['F♯', 'A', 'C♯', 'E♯'] },
  { id: 'mmaj7',   root: 'B♭', notes: ['B♭', 'D♭', 'F', 'A'] },
  { id: 'maj9',    root: 'C',  notes: ['C', 'E', 'G', 'B', 'D'] },
  { id: 'maj9',    root: 'F♯', notes: ['F♯', 'A♯', 'C♯', 'E♯', 'G♯'] },
  { id: 'maj9',    root: 'B♭', notes: ['B♭', 'D', 'F', 'A', 'C'] },
  { id: 'm9',      root: 'C',  notes: ['C', 'E♭', 'G', 'B♭', 'D'] },
  { id: 'm9',      root: 'F♯', notes: ['F♯', 'A', 'C♯', 'E', 'G♯'] },
  { id: 'm9',      root: 'B♭', notes: ['B♭', 'D♭', 'F', 'A♭', 'C'] },
  { id: '9',       root: 'C',  notes: ['C', 'E', 'G', 'B♭', 'D'] },
  { id: '9',       root: 'F♯', notes: ['F♯', 'A♯', 'C♯', 'E', 'G♯'] },
  { id: '9',       root: 'B♭', notes: ['B♭', 'D', 'F', 'A♭', 'C'] },
  { id: '7b9',     root: 'C',  notes: ['C', 'E', 'G', 'B♭', 'D♭'] },
  { id: '7b9',     root: 'F♯', notes: ['F♯', 'A♯', 'C♯', 'E', 'G'] },
  { id: '7b9',     root: 'B♭', notes: ['B♭', 'D', 'F', 'A♭', 'C♭'] },
  { id: '7s9',     root: 'C',  notes: ['C', 'E', 'G', 'B♭', 'D♯'] },
  { id: '7s9',     root: 'F♯', notes: ['F♯', 'A♯', 'C♯', 'E', 'G♯♯'] },
  { id: '7s9',     root: 'B♭', notes: ['B♭', 'D', 'F', 'A♭', 'C♯'] },
  { id: 'm11',     root: 'C',  notes: ['C', 'E♭', 'G', 'B♭', 'D', 'F'] },
  { id: 'm11',     root: 'F♯', notes: ['F♯', 'A', 'C♯', 'E', 'G♯', 'B'] },
  { id: 'm11',     root: 'B♭', notes: ['B♭', 'D♭', 'F', 'A♭', 'C', 'E♭'] },
  { id: 'maj7s11', root: 'C',  notes: ['C', 'E', 'G', 'B', 'F♯'] },
  { id: 'maj7s11', root: 'F♯', notes: ['F♯', 'A♯', 'C♯', 'E♯', 'B♯'] },
  { id: 'maj7s11', root: 'B♭', notes: ['B♭', 'D', 'F', 'A', 'E'] },
  { id: '7s11',    root: 'C',  notes: ['C', 'E', 'G', 'B♭', 'D', 'F♯'] },
  { id: '7s11',    root: 'F♯', notes: ['F♯', 'A♯', 'C♯', 'E', 'G♯', 'B♯'] },
  { id: '7s11',    root: 'B♭', notes: ['B♭', 'D', 'F', 'A♭', 'C', 'E'] },
  { id: 'maj13',   root: 'C',  notes: ['C', 'E', 'G', 'B', 'D', 'A'] },
  { id: 'maj13',   root: 'F♯', notes: ['F♯', 'A♯', 'C♯', 'E♯', 'G♯', 'D♯'] },
  { id: 'maj13',   root: 'B♭', notes: ['B♭', 'D', 'F', 'A', 'C', 'G'] },
  { id: '13',      root: 'C',  notes: ['C', 'E', 'G', 'B♭', 'D', 'A'] },
  { id: '13',      root: 'F♯', notes: ['F♯', 'A♯', 'C♯', 'E', 'G♯', 'D♯'] },
  { id: '13',      root: 'B♭', notes: ['B♭', 'D', 'F', 'A♭', 'C', 'G'] },
  { id: '7b13',    root: 'C',  notes: ['C', 'E', 'G', 'B♭', 'D♭', 'A♭'] },
  { id: '7b13',    root: 'F♯', notes: ['F♯', 'A♯', 'C♯', 'E', 'G', 'D'] },
  { id: '7b13',    root: 'B♭', notes: ['B♭', 'D', 'F', 'A♭', 'C♭', 'G♭'] },
  { id: '7alt',    root: 'C',  notes: ['C', 'E', 'F♯', 'B♭', 'D♭', 'D♯', 'A♭'] },
  { id: '7alt',    root: 'F♯', notes: ['F♯', 'A♯', 'B♯', 'E', 'G', 'G♯♯', 'D'] },
  { id: '7alt',    root: 'B♭', notes: ['B♭', 'D', 'E', 'A♭', 'C♭', 'C♯', 'G♭'] },
]

describe('chordNotes — parameterized 81 cases (27 chords × 3 roots)', () => {
  it.each(FIXTURES)('$id on $root', ({ id, root, notes }) => {
    expect(chordNotes(root, find(id)).notes).toEqual(notes)
  })
})

// ---------------------------------------------------------------------------
// Invariant: intervals[] and tonalIntervals[] must stay in sync.
// Without this, a future contributor editing one array but not the other
// would silently corrupt either UI highlighting (intervals consumers) or
// note spelling (tonalIntervals consumers). The check cross-validates the
// whole chain: tonalIntervals → Tonal transpose → toUnicode → pitchClass
// must equal (rootPc + intervals[i]) mod 12 for every (chord, root) pair.
// ---------------------------------------------------------------------------

describe('intervals ↔ tonalIntervals semitone invariant', () => {
  it('every definition has matching array lengths', () => {
    for (const def of TEST_DEFINITIONS) {
      expect(def.intervals.length, `${def.id}.intervals vs tonalIntervals length`).toBe(
        def.tonalIntervals.length,
      )
    }
  })

  it.each(FIXTURES)('$id on $root: every note pitch-class matches (rootPc + intervals[i]) mod 12', ({ id, root }) => {
    const def = find(id)
    const { notes } = chordNotes(root, def)
    const rootPc = pitchClass(root)
    for (let i = 0; i < def.intervals.length; i++) {
      const expectedPc = (rootPc + def.intervals[i]!) % 12
      const actualPc = pitchClass(notes[i]!)
      expect(actualPc, `${id} on ${root} at position ${i} (interval ${def.intervals[i]}, note "${notes[i]}")`).toBe(expectedPc)
    }
  })
})
