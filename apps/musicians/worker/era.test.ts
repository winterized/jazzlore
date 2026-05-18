import { describe, expect, it } from 'vitest'
import { deriveEra } from './era'

describe('deriveEra — editorial taxonomy (Phase C call)', () => {
  it('prefers a genre signal, most-specific first', () => {
    expect(deriveEra({ id: 'a', name: 'A', genres: ['hard bop'] })).toBe(
      'Hard bop',
    )
    expect(
      deriveEra({ id: 'a', name: 'A', genres: ['jazz fusion'] }),
    ).toBe('Fusion')
    expect(
      deriveEra({ id: 'a', name: 'A', genres: ['modal jazz', 'cool jazz'] }),
    ).toBe('Modal')
  })

  it('falls back to years_active_start bands when genres miss', () => {
    expect(
      deriveEra({ id: 'a', name: 'A', years_active_start: 1942 }),
    ).toBe('Swing')
    expect(
      deriveEra({ id: 'a', name: 'A', years_active_start: 1958 }),
    ).toBe('Hard bop')
    expect(
      deriveEra({ id: 'a', name: 'A', years_active_start: 1995 }),
    ).toBe('Contemporary')
  })

  it('returns undefined when there is no confident signal (sparse norm)', () => {
    expect(deriveEra({ id: 'a', name: 'A' })).toBeUndefined()
    expect(
      deriveEra({ id: 'a', name: 'A', genres: ['polka'] }),
    ).toBeUndefined()
  })
})
