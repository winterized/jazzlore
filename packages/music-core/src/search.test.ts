import { afterEach, describe, expect, it, vi } from 'vitest'
import { normalizeForSearch, prefersReducedMotion } from './search'

describe('normalizeForSearch', () => {
  it('lowercases', () => {
    expect(normalizeForSearch('Locrian')).toBe('locrian')
  })

  it('folds musical accidentals: ♭→b, ♯→#, ♮→removed', () => {
    expect(normalizeForSearch('B♭')).toBe('bb')
    expect(normalizeForSearch('C♯')).toBe('c#')
    expect(normalizeForSearch('Locrian ♮2')).toBe('locrian 2')
  })

  it('strips combining diacritics (NFKD)', () => {
    expect(normalizeForSearch('café')).toBe('cafe')
  })

  it('collapses whitespace and trims', () => {
    expect(normalizeForSearch('  half   diminished  ')).toBe('half diminished')
  })

  it("the user's examples match as substrings", () => {
    // scales: 'locr' finds Locrian and Locrian ♮2
    expect(normalizeForSearch('Locrian').includes(normalizeForSearch('locr'))).toBe(true)
    expect(normalizeForSearch('Locrian ♮2').includes(normalizeForSearch('locr'))).toBe(true)
    // chords: 'dim' / 'half-dim' find the diminished family
    expect(normalizeForSearch('diminished').includes(normalizeForSearch('dim'))).toBe(true)
    expect(
      normalizeForSearch('half-diminished 7th').includes(normalizeForSearch('half-dim')),
    ).toBe(true)
  })
})

describe('prefersReducedMotion', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns false when matchMedia is unavailable (jsdom default)', () => {
    expect(prefersReducedMotion()).toBe(false)
  })

  it('reflects the media query when matchMedia exists', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: q.includes('reduce'),
      media: q,
    }))
    expect(prefersReducedMotion()).toBe(true)
  })
})
