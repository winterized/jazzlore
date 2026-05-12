import { describe, expect, it } from 'vitest'
import { ALL_ROOTS, DEFAULT_ROOTS, alternateSpelling, isAmbiguous, normalizeRoot } from './spelling'

describe('DEFAULT_ROOTS', () => {
  it('has 12 entries in chromatic order, jazz-default spellings', () => {
    expect(DEFAULT_ROOTS).toEqual(['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'])
  })
})

describe('ALL_ROOTS', () => {
  it('has 17 entries (12 defaults + 5 alternates)', () => {
    expect(ALL_ROOTS).toHaveLength(17)
  })

  it('includes C# Db D# Eb F# Gb G# Ab A# Bb', () => {
    for (const r of ['C#', 'Db', 'D#', 'Eb', 'F#', 'Gb', 'G#', 'Ab', 'A#', 'Bb']) {
      expect(ALL_ROOTS).toContain(r)
    }
  })
})

describe('isAmbiguous', () => {
  it('returns true for the 5 ambiguous pitches and their alternates', () => {
    for (const r of ['Db', 'C#', 'Eb', 'D#', 'F#', 'Gb', 'Ab', 'G#', 'Bb', 'A#']) {
      expect(isAmbiguous(r)).toBe(true)
    }
  })

  it('returns false for naturals', () => {
    for (const r of ['C', 'D', 'E', 'F', 'G', 'A', 'B']) {
      expect(isAmbiguous(r)).toBe(false)
    }
  })
})

describe('alternateSpelling', () => {
  it('Db ↔ C#', () => {
    expect(alternateSpelling('Db')).toBe('C#')
    expect(alternateSpelling('C#')).toBe('Db')
  })
  it('F# ↔ Gb', () => {
    expect(alternateSpelling('F#')).toBe('Gb')
    expect(alternateSpelling('Gb')).toBe('F#')
  })
  it('returns null for naturals', () => {
    expect(alternateSpelling('C')).toBeNull()
    expect(alternateSpelling('D')).toBeNull()
  })
})

describe('normalizeRoot', () => {
  it('accepts ALL_ROOTS as-is', () => {
    for (const r of ALL_ROOTS) {
      expect(normalizeRoot(r)).toBe(r)
    }
  })

  it('returns null for unknown values', () => {
    expect(normalizeRoot('H')).toBeNull()
    expect(normalizeRoot('Cb')).toBeNull()
    expect(normalizeRoot('foo')).toBeNull()
    expect(normalizeRoot('')).toBeNull()
  })
})
