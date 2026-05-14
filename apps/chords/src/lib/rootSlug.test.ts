/**
 * Tests for rootSlug encode/decode helpers used in /chords/:root URL routing.
 * The slug format is identical to apps/scales (backed by music-core/url.ts).
 */
import { describe, expect, it } from 'vitest'
import { encodeSlug, decodeSlug } from './rootSlug'

const VALID_CASES: Array<[string, string]> = [
  // Natural notes (ASCII slug = root)
  ['C', 'C'],
  ['D', 'D'],
  ['E', 'E'],
  ['F', 'F'],
  ['G', 'G'],
  ['A', 'A'],
  ['B', 'B'],
  // Flats (internal form → slug)
  ['Db', 'D-flat'],
  ['Eb', 'E-flat'],
  ['Gb', 'G-flat'],
  ['Ab', 'A-flat'],
  ['Bb', 'B-flat'],
  // Sharps (internal form → slug)
  ['C#', 'C-sharp'],
  ['D#', 'D-sharp'],
  ['F#', 'F-sharp'],
  ['G#', 'G-sharp'],
  ['A#', 'A-sharp'],
]

describe('encodeSlug', () => {
  it.each(VALID_CASES)('encodes %s → %s', (root, slug) => {
    expect(encodeSlug(root)).toBe(slug)
  })
})

describe('decodeSlug', () => {
  it.each(VALID_CASES)('decodes %s ← %s', (root, slug) => {
    expect(decodeSlug(slug)).toBe(root)
  })

  it('returns null for an empty string', () => {
    expect(decodeSlug('')).toBeNull()
  })

  it('returns null for a completely invalid slug', () => {
    expect(decodeSlug('invalid')).toBeNull()
  })

  it('returns null for a partial slug like "H-flat"', () => {
    expect(decodeSlug('H-flat')).toBeNull()
  })

  it('returns null for a slug with a nonexistent enharmonic like "B-sharp"', () => {
    // B# is not in ALL_ROOTS
    expect(decodeSlug('B-sharp')).toBeNull()
  })

  it('returns null for numeric input', () => {
    expect(decodeSlug('42')).toBeNull()
  })

  it('round-trips all valid roots', () => {
    for (const [root, slug] of VALID_CASES) {
      expect(decodeSlug(encodeSlug(root))).toBe(root)
      expect(encodeSlug(decodeSlug(slug) ?? '')).toBe(slug)
    }
  })
})
