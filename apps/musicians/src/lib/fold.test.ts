import { describe, expect, it } from 'vitest'
import { fold, matchRanges } from './fold'

describe('fold', () => {
  it('strips diacritics and lowercases', () => {
    expect(fold('José')).toBe('jose')
    expect(fold('Antoine Hervé')).toBe('antoine herve')
    expect(fold('Antônio Carlos Jobim')).toBe('antonio carlos jobim')
    expect(fold('Dvořák')).toBe('dvorak')
  })

  it('is idempotent and handles already-folded / empty input', () => {
    expect(fold('miles davis')).toBe('miles davis')
    expect(fold('')).toBe('')
    expect(fold(fold('Béla'))).toBe('bela')
  })

  it('preserves non-letter characters and internal spacing', () => {
    expect(fold("J.J. Johnson")).toBe('j.j. johnson')
    expect(fold('Tony  Williams')).toBe('tony  williams')
  })
})

describe('matchRanges', () => {
  it('returns [] for an empty / whitespace query', () => {
    expect(matchRanges('', 'José')).toEqual([])
    expect(matchRanges('   ', 'José')).toEqual([])
  })

  it('"jose" matches "José" with offsets against the ORIGINAL string', () => {
    // "José" — the é is ONE original char; folded "jose" length === original
    // length here, but the contract is offsets index the original string.
    expect(matchRanges('jose', 'José')).toEqual([{ start: 0, end: 4 }])
  })

  it('"herve" matches the accented tail of "Antoine Hervé"', () => {
    const original = 'Antoine Hervé'
    const [r] = matchRanges('herve', original)
    expect(r).toEqual({ start: 8, end: 13 })
    // Offsets must slice the ORIGINAL (accented) substring, not the fold.
    expect(original.slice(r!.start, r!.end)).toBe('Hervé')
  })

  it('matches a clean prefix and returns original-indexed range', () => {
    const original = 'Miles Davis'
    expect(matchRanges('mil', original)).toEqual([{ start: 0, end: 3 }])
    expect(original.slice(0, 3)).toBe('Mil')
  })

  it('returns all non-overlapping occurrences', () => {
    // "an" appears twice in "Ana Banana"
    const ranges = matchRanges('an', 'Ana Banana')
    expect(ranges).toEqual([
      { start: 0, end: 2 },
      { start: 5, end: 7 },
      { start: 7, end: 9 },
    ])
  })

  it('folds the query too ("José" query → "jose" name)', () => {
    expect(matchRanges('José', 'jose carlos')).toEqual([{ start: 0, end: 4 }])
  })

  it('returns [] when there is no match', () => {
    expect(matchRanges('xyz', 'Miles Davis')).toEqual([])
  })
})
