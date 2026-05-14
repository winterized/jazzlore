import { describe, expect, it } from 'vitest'
import type { ScaleDefinition } from './scale-types'
import { notesForScale, pitchClass, withOctaves } from './music'

// Minimal inline fixture — covers every intervalDisplay token used in the tests.
// CURATED_SCALES lives in apps/scales and is app data, not music-core's concern.
const TEST_SCALES: readonly ScaleDefinition[] = [
  { id: 'ionian',          name: 'Ionian',          family: 'modes-of-major',          intervalDisplay: ['1','2','3','4','5','6','7'],            semitones: [0,2,4,5,7,9,11] },
  { id: 'dorian',          name: 'Dorian',          family: 'modes-of-major',          intervalDisplay: ['1','2','♭3','4','5','6','♭7'],          semitones: [0,2,3,5,7,9,10] },
  { id: 'phrygian',        name: 'Phrygian',        family: 'modes-of-major',          intervalDisplay: ['1','♭2','♭3','4','5','♭6','♭7'],        semitones: [0,1,3,5,7,8,10] },
  { id: 'bebop-dominant',  name: 'Bebop dominant',  family: 'bebop',                   intervalDisplay: ['1','2','3','4','5','6','♭7','7'],        semitones: [0,2,4,5,7,9,10,11] },
  { id: 'hirajoshi',       name: 'Hirajoshi',       family: 'exotic',                  intervalDisplay: ['1','2','♭3','5','♭6'],                  semitones: [0,2,3,7,8] },
  { id: 'whole-tone',      name: 'Whole tone',      family: 'symmetric',               intervalDisplay: ['1','2','3','♯4','♯5','♭7'],             semitones: [0,2,4,6,8,10] },
  { id: 'altered',         name: 'Altered',         family: 'modes-of-melodic-minor',  intervalDisplay: ['1','♭2','♭3','♭4','♭5','♭6','♭7'],      semitones: [0,1,3,4,6,8,10] },
  { id: 'super-locrian-bb7', name: 'Super Locrian ♭♭7', family: 'modes-of-harmonic-minor', intervalDisplay: ['1','♭2','♭3','♭4','♭5','♭6','♭♭7'], semitones: [0,1,3,4,6,8,9] },
  { id: 'lydian-augmented',name: 'Lydian augmented',family: 'modes-of-melodic-minor',  intervalDisplay: ['1','2','3','♯4','♯5','6','7'],          semitones: [0,2,4,6,8,9,11] },
  { id: 'ionian-aug',      name: 'Ionian ♯5',       family: 'modes-of-harmonic-minor', intervalDisplay: ['1','2','3','4','♯5','6','7'],           semitones: [0,2,4,5,8,9,11] },
  { id: 'dorian-sharp4',   name: 'Dorian ♯4',       family: 'modes-of-harmonic-minor', intervalDisplay: ['1','2','♭3','♯4','5','6','♭7'],         semitones: [0,2,3,6,7,9,10] },
  { id: 'lydian-sharp2',   name: 'Lydian ♯2',       family: 'modes-of-harmonic-minor', intervalDisplay: ['1','♯2','3','♯4','5','6','7'],          semitones: [0,3,4,6,7,9,11] },
]

const findScale = (id: string) => {
  const s = TEST_SCALES.find((x) => x.id === id)
  if (!s) throw new Error(`scale ${id} missing from test fixture`)
  return s
}

describe('notesForScale', () => {
  it('C Ionian → C D E F G A B', () => {
    expect(notesForScale('C', findScale('ionian'))).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B'])
  })

  it('Bb Dorian → Bb C Db Eb F G Ab', () => {
    expect(notesForScale('Bb', findScale('dorian'))).toEqual(['Bb', 'C', 'Db', 'Eb', 'F', 'G', 'Ab'])
  })

  it('F# Phrygian → F# G A B C# D E', () => {
    expect(notesForScale('F#', findScale('phrygian'))).toEqual(['F#', 'G', 'A', 'B', 'C#', 'D', 'E'])
  })

  it('Eb Bebop dominant has 8 notes', () => {
    expect(notesForScale('Eb', findScale('bebop-dominant'))).toHaveLength(8)
  })

  it('C Hirajoshi has 5 notes', () => {
    expect(notesForScale('C', findScale('hirajoshi'))).toHaveLength(5)
  })

  it('Db Ionian → Db Eb F Gb Ab Bb C', () => {
    expect(notesForScale('Db', findScale('ionian'))).toEqual(['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C'])
  })

  it('every test-fixture scale produces the expected note count for root C', () => {
    for (const scale of TEST_SCALES) {
      const notes = notesForScale('C', scale)
      expect(notes).toHaveLength(scale.semitones.length)
    }
  })
})

describe('pitchClass', () => {
  it('C = 0, D = 2, ..., B = 11', () => {
    expect(pitchClass('C')).toBe(0)
    expect(pitchClass('D')).toBe(2)
    expect(pitchClass('E')).toBe(4)
    expect(pitchClass('F')).toBe(5)
    expect(pitchClass('G')).toBe(7)
    expect(pitchClass('A')).toBe(9)
    expect(pitchClass('B')).toBe(11)
  })

  it('sharps add 1', () => {
    expect(pitchClass('C#')).toBe(1)
    expect(pitchClass('F#')).toBe(6)
    expect(pitchClass('A#')).toBe(10)
  })

  it('flats subtract 1', () => {
    expect(pitchClass('Db')).toBe(1)
    expect(pitchClass('Eb')).toBe(3)
    expect(pitchClass('Gb')).toBe(6)
    expect(pitchClass('Ab')).toBe(8)
    expect(pitchClass('Bb')).toBe(10)
  })

  it('double flats subtract 2', () => {
    expect(pitchClass('Bbb')).toBe(9)  // A
    expect(pitchClass('Ebb')).toBe(2)  // D
  })

  it('throws on empty input', () => {
    expect(() => pitchClass('')).toThrow(/empty note/)
  })

  it('throws on unknown letter', () => {
    expect(() => pitchClass('H')).toThrow(/unknown note letter/)
    expect(() => pitchClass('Xb')).toThrow(/unknown note letter/)
  })
})

describe('withOctaves', () => {
  it('C major: octave 4 throughout, no internal bump (closing is the caller’s problem)', () => {
    expect(withOctaves(['C', 'D', 'E', 'F', 'G', 'A', 'B'], 4))
      .toEqual(['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'])
  })

  it('Bb Dorian: bump at C (second note)', () => {
    expect(withOctaves(['Bb', 'C', 'Db', 'Eb', 'F', 'G', 'Ab'], 4))
      .toEqual(['Bb4', 'C5', 'Db5', 'Eb5', 'F5', 'G5', 'Ab5'])
  })

  it('F# Phrygian: bump at C# (5th note)', () => {
    expect(withOctaves(['F#', 'G', 'A', 'B', 'C#', 'D', 'E'], 4))
      .toEqual(['F#4', 'G4', 'A4', 'B4', 'C#5', 'D5', 'E5'])
  })

  it('honors startOctave parameter', () => {
    expect(withOctaves(['C', 'D'], 3))
      .toEqual(['C3', 'D3'])
  })
})
