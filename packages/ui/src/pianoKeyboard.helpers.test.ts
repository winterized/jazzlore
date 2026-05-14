import { describe, expect, it } from 'vitest'
import {
  deriveBlackKeySpecs,
  deriveWhiteKeyNamesForOctave,
  deriveWhiteKeyPcsForOctave,
} from './pianoKeyboard.helpers'

describe('deriveWhiteKeyPcsForOctave', () => {
  it('C-rooted (startPc=0) returns [0,2,4,5,7,9,11]', () => {
    expect(deriveWhiteKeyPcsForOctave(0)).toEqual([0, 2, 4, 5, 7, 9, 11])
  })

  it('F-rooted (startPc=5) returns [5,7,9,11,0,2,4]', () => {
    expect(deriveWhiteKeyPcsForOctave(5)).toEqual([5, 7, 9, 11, 0, 2, 4])
  })

  it('B-rooted (startPc=11) returns [11,0,2,4,5,7,9]', () => {
    expect(deriveWhiteKeyPcsForOctave(11)).toEqual([11, 0, 2, 4, 5, 7, 9])
  })

  it('throws on a black-key startPc', () => {
    expect(() => deriveWhiteKeyPcsForOctave(10)).toThrow(/black key/)
    expect(() => deriveWhiteKeyPcsForOctave(1)).toThrow(/black key/)
  })
})

describe('deriveWhiteKeyNamesForOctave', () => {
  it('C-rooted names', () => {
    expect(deriveWhiteKeyNamesForOctave(0)).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B'])
  })

  it('F-rooted names', () => {
    expect(deriveWhiteKeyNamesForOctave(5)).toEqual(['F', 'G', 'A', 'B', 'C', 'D', 'E'])
  })

  it('throws on a black-key startPc (matching the pcs helper)', () => {
    expect(() => deriveWhiteKeyNamesForOctave(10)).toThrow(/black key/)
  })
})

describe('deriveBlackKeySpecs', () => {
  it('C-rooted: 5 black keys per octave at positions 0,1,3,4,5 (between C-D, D-E, F-G, G-A, A-B)', () => {
    const specs = deriveBlackKeySpecs([0, 2, 4, 5, 7, 9, 11])
    // Over 14 white keys (2 octaves), we expect 10 black keys.
    expect(specs).toHaveLength(10)
    const firstOctave = specs.slice(0, 5)
    expect(firstOctave.map((s) => s.name)).toEqual(['C#', 'D#', 'F#', 'G#', 'A#'])
    expect(firstOctave.map((s) => s.globalWhiteIdx)).toEqual([0, 1, 3, 4, 5])
  })

  it('F-rooted: same 5 unique black-key names, just rotated', () => {
    const specs = deriveBlackKeySpecs([5, 7, 9, 11, 0, 2, 4])
    const uniqueNames = new Set(specs.map((s) => s.name))
    expect(uniqueNames).toEqual(new Set(['C#', 'D#', 'F#', 'G#', 'A#']))
  })

  it('omits the last black key when the trailing white-key pair is a half-step', () => {
    // B-rooted: 14 keys are B C D E F G A B C D E F G A.
    // Pairs: B-C (1), C-D (2), D-E (2), E-F (1), F-G (2), G-A (2), A-B (2),
    //        B-C (1), C-D (2), D-E (2), E-F (1), F-G (2), G-A (2)
    // Whole-step gaps: 5 in first octave + 4 in second = 9 black keys.
    const specs = deriveBlackKeySpecs([11, 0, 2, 4, 5, 7, 9])
    expect(specs.length).toBeLessThan(10)
    expect(specs.length).toBe(9)
  })
})
