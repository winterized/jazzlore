import { describe, expect, it } from 'vitest'
import { formatIntervals } from './formatIntervals'

describe('formatIntervals', () => {
  it('formats major triad: 1P 3M 5P → "1 3 5"', () => {
    expect(formatIntervals(['1P', '3M', '5P'])).toBe('1 3 5')
  })

  it('formats minor triad: 1P 3m 5P → "1 ♭3 5"', () => {
    expect(formatIntervals(['1P', '3m', '5P'])).toBe('1 ♭3 5')
  })

  it('formats diminished triad: 1P 3m 5d → "1 ♭3 ♭5"', () => {
    expect(formatIntervals(['1P', '3m', '5d'])).toBe('1 ♭3 ♭5')
  })

  it('formats augmented triad: 1P 3M 5A → "1 3 ♯5"', () => {
    expect(formatIntervals(['1P', '3M', '5A'])).toBe('1 3 ♯5')
  })

  it('formats major 7th: 1P 3M 5P 7M → "1 3 5 7"', () => {
    expect(formatIntervals(['1P', '3M', '5P', '7M'])).toBe('1 3 5 7')
  })

  it('formats minor 7th: 1P 3m 5P 7m → "1 ♭3 5 ♭7"', () => {
    expect(formatIntervals(['1P', '3m', '5P', '7m'])).toBe('1 ♭3 5 ♭7')
  })

  it('formats dominant 7th: 1P 3M 5P 7m → "1 3 5 ♭7"', () => {
    expect(formatIntervals(['1P', '3M', '5P', '7m'])).toBe('1 3 5 ♭7')
  })

  it('formats diminished 7th: 1P 3m 5d 7d → "1 ♭3 ♭5 ♭♭7"', () => {
    expect(formatIntervals(['1P', '3m', '5d', '7d'])).toBe('1 ♭3 ♭5 ♭♭7')
  })

  it('formats dominant 7♭9: 1P 3M 5P 7m 9m → "1 3 5 ♭7 ♭9"', () => {
    expect(formatIntervals(['1P', '3M', '5P', '7m', '9m'])).toBe('1 3 5 ♭7 ♭9')
  })

  it('formats dominant 7♯9: 1P 3M 5P 7m 9A → "1 3 5 ♭7 ♯9"', () => {
    expect(formatIntervals(['1P', '3M', '5P', '7m', '9A'])).toBe('1 3 5 ♭7 ♯9')
  })

  it('formats 7alt (clean ascending altered stack): 1P 3M 7m 9m 9A 11A 13m → "1 3 ♭7 ♭9 ♯9 ♯11 ♭13"', () => {
    expect(formatIntervals(['1P', '3M', '7m', '9m', '9A', '11A', '13m'])).toBe(
      '1 3 ♭7 ♭9 ♯9 ♯11 ♭13',
    )
  })

  it('formats major 13th: 1P 3M 5P 7M 9M 13M → "1 3 5 7 9 13"', () => {
    expect(formatIntervals(['1P', '3M', '5P', '7M', '9M', '13M'])).toBe('1 3 5 7 9 13')
  })

  it('formats maj7♯11: 1P 3M 5P 7M 11A → "1 3 5 7 ♯11"', () => {
    expect(formatIntervals(['1P', '3M', '5P', '7M', '11A'])).toBe('1 3 5 7 ♯11')
  })

  it('formats sus2: 1P 2M 5P → "1 2 5"', () => {
    expect(formatIntervals(['1P', '2M', '5P'])).toBe('1 2 5')
  })

  it('formats sus4: 1P 4P 5P → "1 4 5"', () => {
    expect(formatIntervals(['1P', '4P', '5P'])).toBe('1 4 5')
  })
})
