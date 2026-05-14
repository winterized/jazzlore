import { describe, expect, it } from 'vitest'
import { ALL_ROOTS, DEFAULT_ROOTS, alternateSpelling, formatRoot, isAmbiguous, normalizeRoot, toInternal } from './spelling'

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

describe('formatRoot', () => {
  it('passes naturals through unchanged', () => {
    for (const r of ['C', 'D', 'E', 'F', 'G', 'A', 'B']) {
      expect(formatRoot(r)).toBe(r)
    }
  })

  it('converts flats: Bb → B♭, Db → D♭, Eb → E♭, Ab → A♭, Gb → G♭', () => {
    expect(formatRoot('Bb')).toBe('B♭')
    expect(formatRoot('Db')).toBe('D♭')
    expect(formatRoot('Eb')).toBe('E♭')
    expect(formatRoot('Ab')).toBe('A♭')
    expect(formatRoot('Gb')).toBe('G♭')
  })

  it('converts sharps: F# → F♯, C# → C♯, D# → D♯, G# → G♯, A# → A♯', () => {
    expect(formatRoot('F#')).toBe('F♯')
    expect(formatRoot('C#')).toBe('C♯')
    expect(formatRoot('D#')).toBe('D♯')
    expect(formatRoot('G#')).toBe('G♯')
    expect(formatRoot('A#')).toBe('A♯')
  })
})

describe('toInternal', () => {
  it('passes naturals through unchanged', () => {
    for (const r of ['C', 'D', 'E', 'F', 'G', 'A', 'B']) {
      expect(toInternal(r)).toBe(r)
    }
  })

  it('converts display flats to internal: B♭ → Bb, D♭ → Db, E♭ → Eb, A♭ → Ab, G♭ → Gb', () => {
    expect(toInternal('B♭')).toBe('Bb')
    expect(toInternal('D♭')).toBe('Db')
    expect(toInternal('E♭')).toBe('Eb')
    expect(toInternal('A♭')).toBe('Ab')
    expect(toInternal('G♭')).toBe('Gb')
  })

  it('converts display sharps to internal: F♯ → F#, C♯ → C#, D♯ → D#, G♯ → G#, A♯ → A#', () => {
    expect(toInternal('F♯')).toBe('F#')
    expect(toInternal('C♯')).toBe('C#')
    expect(toInternal('D♯')).toBe('D#')
    expect(toInternal('G♯')).toBe('G#')
    expect(toInternal('A♯')).toBe('A#')
  })

  it('passes already-internal input through unchanged (idempotent)', () => {
    expect(toInternal('Bb')).toBe('Bb')
    expect(toInternal('F#')).toBe('F#')
  })

  it('formatRoot ∘ toInternal is identity for the 12 default roots', () => {
    for (const r of DEFAULT_ROOTS) {
      expect(toInternal(formatRoot(r))).toBe(r)
    }
  })
})
