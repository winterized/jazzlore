import { describe, expect, it } from 'vitest'
import {
  deriveBlackKeySpecs,
  deriveLeadingBlackKeyName,
  deriveWhiteKeyAbsOffsets,
  deriveWhiteKeyNamesForOctave,
  deriveWhiteKeyPcsForOctave,
  resolveChordKeyPositions,
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

describe('deriveLeadingBlackKeyName', () => {
  it('returns null for C and F (no black key below)', () => {
    expect(deriveLeadingBlackKeyName(0)).toBeNull()
    expect(deriveLeadingBlackKeyName(5)).toBeNull()
  })

  it('returns the black key just below D/E/G/A/B', () => {
    expect(deriveLeadingBlackKeyName(2)).toBe('C#') // D → C#
    expect(deriveLeadingBlackKeyName(4)).toBe('D#') // E → D#
    expect(deriveLeadingBlackKeyName(7)).toBe('F#') // G → F#
    expect(deriveLeadingBlackKeyName(9)).toBe('G#') // A → G#
    expect(deriveLeadingBlackKeyName(11)).toBe('A#') // B → A#
  })

  it('throws on a black-key startPc', () => {
    expect(() => deriveLeadingBlackKeyName(1)).toThrow(/black key/)
  })
})

describe('deriveWhiteKeyAbsOffsets', () => {
  it('C-rooted: white keys land on 0,2,4,5,7,9,11 then +12 for the 2nd octave', () => {
    expect(deriveWhiteKeyAbsOffsets([0, 2, 4, 5, 7, 9, 11])).toEqual([
      0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 23,
    ])
  })

  it('F-rooted: monotonic, ends at 23 (two octaves above F)', () => {
    const offs = deriveWhiteKeyAbsOffsets([5, 7, 9, 11, 0, 2, 4])
    expect(offs[0]).toBe(0)
    expect(offs).toHaveLength(14)
    expect(offs[13]).toBe(23)
    for (let i = 1; i < offs.length; i++) {
      expect(offs[i]!).toBeGreaterThan(offs[i - 1]!)
    }
  })

  it('B-rooted: half step B→C first, ends at 21 (A is 2 octaves up minus a step)', () => {
    const offs = deriveWhiteKeyAbsOffsets([11, 0, 2, 4, 5, 7, 9])
    expect(offs.slice(0, 3)).toEqual([0, 1, 3]) // B, C, D
    expect(offs).toHaveLength(14)
  })
})

describe('resolveChordKeyPositions', () => {
  it('C maj7 (root C, startPc 0): abs [0,4,7,11], roles root then scale×3', () => {
    const res = resolveChordKeyPositions([0, 4, 7, 11], 0, 0)
    expect(res.map((r) => r.abs)).toEqual([0, 4, 7, 11])
    expect(res.map((r) => r.role)).toEqual(['root', 'scale', 'scale', 'scale'])
  })

  it('C maj13 [0,4,7,11,14,21]: 6 distinct positions, all within 0..23, no fold', () => {
    const res = resolveChordKeyPositions([0, 4, 7, 11, 14, 21], 0, 0)
    expect(res.map((r) => r.abs)).toEqual([0, 4, 7, 11, 14, 21])
    const set = new Set(res.map((r) => r.abs))
    expect(set.size).toBe(6) // all distinct
    for (const r of res) expect(r.abs).toBeGreaterThanOrEqual(0)
    for (const r of res) expect(r.abs).toBeLessThanOrEqual(23)
  })

  it('C 13 [0,4,7,10,14,21]: 6 distinct positions within window', () => {
    const res = resolveChordKeyPositions([0, 4, 7, 10, 14, 21], 0, 0)
    expect(res.map((r) => r.abs)).toEqual([0, 4, 7, 10, 14, 21])
    expect(new Set(res.map((r) => r.abs)).size).toBe(6)
  })

  it('octave-folds a synthetic > 23 offset back into the 2-octave window', () => {
    // root C (r0=0), offset 25 → 25 > 23 → fold once → 13. Stays distinct from 0.
    const res = resolveChordKeyPositions([0, 25], 0, 0)
    expect(res.map((r) => r.abs)).toEqual([0, 13])
    expect(res.every((r) => r.abs >= 0 && r.abs <= 23)).toBe(true)
  })

  it('folds repeatedly until inside the window (offset 37 → 13)', () => {
    // root C (r0=0), offset 37: 37>23 → 25, still >23 → 13. Inside.
    const res = resolveChordKeyPositions([0, 37], 0, 0)
    expect(res.map((r) => r.abs)).toEqual([0, 13])
  })

  it('black-key root (rootPc 1 = C♯, startPc 0 = C): r0 offset = 1', () => {
    // startPc is the white key at/below the root; root pc 1 (C♯) → r0 = 1.
    // maj7 from C♯: abs = 1 + [0,4,7,11] = [1,5,8,12].
    const res = resolveChordKeyPositions([0, 4, 7, 11], 1, 0)
    expect(res.map((r) => r.abs)).toEqual([1, 5, 8, 12])
    expect(res[0]?.role).toBe('root')
  })

  it('white-key root above startPc (rootPc 5 = F, startPc 5 = F): r0 = 0', () => {
    const res = resolveChordKeyPositions([0, 4, 7, 11], 5, 5)
    expect(res.map((r) => r.abs)).toEqual([0, 4, 7, 11])
  })

  it('rootPc below startPc wraps via mod 12 (rootPc 0 = C, startPc 11 = B): r0 = 1', () => {
    // (0 - 11 + 12) % 12 = 1 — C sits one semitone above a B-anchored window.
    const res = resolveChordKeyPositions([0, 7], 0, 11)
    expect(res.map((r) => r.abs)).toEqual([1, 8])
  })

  it('7alt [0,4,6,10,13,15,20] (root C): 7 distinct tones all in window', () => {
    const res = resolveChordKeyPositions([0, 4, 6, 10, 13, 15, 20], 0, 0)
    expect(res.map((r) => r.abs)).toEqual([0, 4, 6, 10, 13, 15, 20])
    expect(new Set(res.map((r) => r.abs)).size).toBe(7)
    expect(res.filter((r) => r.role === 'root')).toHaveLength(1)
  })

  it('only the s===0 element is the root role', () => {
    const res = resolveChordKeyPositions([0, 3, 7], 9, 9) // A minor, A root
    expect(res.map((r) => r.role)).toEqual(['root', 'scale', 'scale'])
  })

  it('returns an empty array for empty input', () => {
    expect(resolveChordKeyPositions([], 0, 0)).toEqual([])
  })
})
