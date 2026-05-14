import { describe, expect, it } from 'vitest'
import { rootFromSlug, slugFromRoot } from './url'

describe('slugFromRoot', () => {
  it('naturals round-trip as themselves', () => {
    for (const r of ['C', 'D', 'E', 'F', 'G', 'A', 'B']) {
      expect(slugFromRoot(r)).toBe(r)
    }
  })

  it('flats become *-flat', () => {
    expect(slugFromRoot('Db')).toBe('D-flat')
    expect(slugFromRoot('Eb')).toBe('E-flat')
    expect(slugFromRoot('Gb')).toBe('G-flat')
    expect(slugFromRoot('Ab')).toBe('A-flat')
    expect(slugFromRoot('Bb')).toBe('B-flat')
  })

  it('sharps become *-sharp', () => {
    expect(slugFromRoot('C#')).toBe('C-sharp')
    expect(slugFromRoot('D#')).toBe('D-sharp')
    expect(slugFromRoot('F#')).toBe('F-sharp')
    expect(slugFromRoot('G#')).toBe('G-sharp')
    expect(slugFromRoot('A#')).toBe('A-sharp')
  })
})

describe('rootFromSlug', () => {
  it('naturals round-trip', () => {
    expect(rootFromSlug('C')).toBe('C')
    expect(rootFromSlug('B')).toBe('B')
  })

  it('parses flats and sharps', () => {
    expect(rootFromSlug('D-flat')).toBe('Db')
    expect(rootFromSlug('F-sharp')).toBe('F#')
  })

  it('returns null for invalid slugs', () => {
    expect(rootFromSlug('H')).toBeNull()
    expect(rootFromSlug('c-flat')).toBeNull()
    expect(rootFromSlug('foo')).toBeNull()
    expect(rootFromSlug('')).toBeNull()
    expect(rootFromSlug('C-flat')).toBeNull()
  })
})
