import { describe, expect, it } from 'vitest'
import { chordNotes } from '@jazzlore/music-core'
import { CURATED_CHORDS } from './curated'

// ---------------------------------------------------------------------------
// Data integrity tests for the 27-chord canonical list.
// These tests prove that the curated list is well-formed and compatible
// with music-core's expectations.
// ---------------------------------------------------------------------------

describe('CURATED_CHORDS — data integrity', () => {
  it('has exactly 27 entries', () => {
    expect(CURATED_CHORDS).toHaveLength(27)
  })

  it('has no duplicate id values', () => {
    const ids = CURATED_CHORDS.map((c) => c.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('all entries have a non-empty fullName', () => {
    for (const chord of CURATED_CHORDS) {
      expect(chord.fullName.length, `${chord.id} must have a non-empty fullName`).toBeGreaterThan(0)
    }
  })

  it('where alternateSuffix is defined, it differs from primarySuffix', () => {
    for (const chord of CURATED_CHORDS) {
      if (chord.alternateSuffix !== undefined) {
        expect(
          chord.alternateSuffix,
          `${chord.id}: alternateSuffix must differ from primarySuffix`,
        ).not.toBe(chord.primarySuffix)
      }
    }
  })

  it('all intervals are within 0-23 (inclusive)', () => {
    for (const chord of CURATED_CHORDS) {
      for (const interval of chord.intervals) {
        expect(
          interval,
          `${chord.id}: interval ${interval} out of range`,
        ).toBeGreaterThanOrEqual(0)
        expect(
          interval,
          `${chord.id}: interval ${interval} out of range`,
        ).toBeLessThanOrEqual(23)
      }
    }
  })

  it('first interval is always 0 (root)', () => {
    for (const chord of CURATED_CHORDS) {
      expect(chord.intervals[0], `${chord.id}: first interval must be 0`).toBe(0)
    }
  })

  it('intervals and tonalIntervals arrays have the same length', () => {
    for (const chord of CURATED_CHORDS) {
      expect(
        chord.intervals.length,
        `${chord.id}: intervals.length must equal tonalIntervals.length`,
      ).toBe(chord.tonalIntervals.length)
    }
  })
})

// ---------------------------------------------------------------------------
// Ordering test — locked Q1 order:
// triads (6) → 6ths (3) → 7ths (6) → 9ths (5) → 11ths (3) → 13ths (4)
// Within each bucket: major → minor → dominant clean → dominant altered
// ---------------------------------------------------------------------------

describe('CURATED_CHORDS — locked ordering', () => {
  const EXPECTED_ORDER = [
    // Triads (6)
    'maj', 'min', 'dim', 'aug', 'sus2', 'sus4',
    // 6ths (3)
    '6', 'm6', '6_9',
    // 7ths (6)
    'maj7', 'm7', '7', 'm7b5', 'dim7', 'mmaj7',
    // 9ths (5)
    'maj9', 'm9', '9', '7b9', '7s9',
    // 11ths (3)
    'm11', 'maj7s11', '7s11',
    // 13ths (4)
    'maj13', '13', '7b13', '7alt',
  ]

  it('ids appear in the locked order', () => {
    expect(CURATED_CHORDS.map((c) => c.id)).toEqual(EXPECTED_ORDER)
  })

  it('triads occupy positions 0-5', () => {
    const triadIds = CURATED_CHORDS.slice(0, 6).map((c) => c.id)
    expect(triadIds).toEqual(['maj', 'min', 'dim', 'aug', 'sus2', 'sus4'])
  })

  it('6ths occupy positions 6-8', () => {
    const sixthIds = CURATED_CHORDS.slice(6, 9).map((c) => c.id)
    expect(sixthIds).toEqual(['6', 'm6', '6_9'])
  })

  it('7ths occupy positions 9-14', () => {
    const seventhIds = CURATED_CHORDS.slice(9, 15).map((c) => c.id)
    expect(seventhIds).toEqual(['maj7', 'm7', '7', 'm7b5', 'dim7', 'mmaj7'])
  })

  it('9ths occupy positions 15-19', () => {
    const ninthIds = CURATED_CHORDS.slice(15, 20).map((c) => c.id)
    expect(ninthIds).toEqual(['maj9', 'm9', '9', '7b9', '7s9'])
  })

  it('11ths occupy positions 20-22', () => {
    const eleventhIds = CURATED_CHORDS.slice(20, 23).map((c) => c.id)
    expect(eleventhIds).toEqual(['m11', 'maj7s11', '7s11'])
  })

  it('13ths occupy positions 23-26', () => {
    const thirteenthIds = CURATED_CHORDS.slice(23, 27).map((c) => c.id)
    expect(thirteenthIds).toEqual(['maj13', '13', '7b13', '7alt'])
  })
})

// ---------------------------------------------------------------------------
// Cross-check with music-core: every entry must produce valid chordNotes output.
// Proves curated.ts entries are compatible with music-core's expectations.
// ---------------------------------------------------------------------------

describe('CURATED_CHORDS — music-core cross-check', () => {
  it('chordNotes("C", entry) returns a non-empty array for every entry', () => {
    for (const chord of CURATED_CHORDS) {
      const { notes } = chordNotes('C', chord)
      expect(notes.length, `${chord.id}: chordNotes returned empty array`).toBeGreaterThan(0)
    }
  })

  it('chordNotes("C", entry).notes.length matches entry.intervals.length', () => {
    for (const chord of CURATED_CHORDS) {
      const { notes } = chordNotes('C', chord)
      expect(
        notes.length,
        `${chord.id}: notes.length (${notes.length}) must match intervals.length (${chord.intervals.length})`,
      ).toBe(chord.intervals.length)
    }
  })

  it('chordNotes root matches the input root for all entries', () => {
    for (const chord of CURATED_CHORDS) {
      const voicing = chordNotes('C', chord)
      expect(voicing.root, `${chord.id}: root must be "C"`).toBe('C')
    }
  })
})
