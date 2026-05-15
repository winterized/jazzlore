import { describe, expect, it } from 'vitest'
import type { ChordId } from '@jazzlore/music-core'
import { CURATED_CHORDS } from './curated'
import { CHORD_GROUPS } from './chordGroups'

// ---------------------------------------------------------------------------
// Bidirectional integrity invariant for chordGroups.ts
//
// (a) Every chip id referenced in chordGroups resolves to a real ChordId
//     present in CURATED_CHORDS.
// (b) Every ChordId in CURATED_CHORDS appears in exactly one group
//     (no orphans, no duplicates).
// (c) The union of group chip ids, in order, is a permutation of all 27
//     curated ids (count + set equality).
// ---------------------------------------------------------------------------

const curatedIds = new Set<ChordId>(CURATED_CHORDS.map((c) => c.id))
const allCuratedIds: readonly ChordId[] = CURATED_CHORDS.map((c) => c.id)

describe('chordGroups — bidirectional integrity invariant', () => {
  it('has exactly 6 groups labelled TRIADS/SIXTHS/SEVENTHS/NINTHS/EXTENDED/ALTERED', () => {
    const labels = CHORD_GROUPS.map((g) => g.label)
    expect(labels).toEqual(['TRIADS', 'SIXTHS', 'SEVENTHS', 'NINTHS', 'EXTENDED', 'ALTERED'])
  })

  it('(a) every chip id in chordGroups is a real curated ChordId', () => {
    for (const group of CHORD_GROUPS) {
      for (const id of group.chordIds) {
        expect(
          curatedIds.has(id),
          `Group "${group.label}": id "${id}" not found in CURATED_CHORDS`,
        ).toBe(true)
      }
    }
  })

  it('(b) every curated ChordId appears in exactly one group (no orphans, no duplicates)', () => {
    const allGroupIds = CHORD_GROUPS.flatMap((g) => [...g.chordIds])

    // No duplicates
    const seen = new Set<ChordId>()
    for (const id of allGroupIds) {
      expect(
        seen.has(id),
        `Duplicate id "${id}" found in chordGroups`,
      ).toBe(false)
      seen.add(id)
    }

    // No orphans — every curated id must appear in some group
    for (const id of allCuratedIds) {
      expect(
        seen.has(id),
        `Curated id "${id}" is missing from all chordGroups (orphan)`,
      ).toBe(true)
    }
  })

  it('(c) union of group chip ids is a permutation of all 27 curated ids', () => {
    const allGroupIds = CHORD_GROUPS.flatMap((g) => [...g.chordIds])

    // Same count
    expect(allGroupIds.length).toBe(27)

    // Same set (set equality — all curated ids present, no extras)
    const groupSet = new Set<ChordId>(allGroupIds)
    expect(groupSet.size).toBe(27)
    for (const id of allCuratedIds) {
      expect(groupSet.has(id), `"${id}" missing from the union`).toBe(true)
    }
    for (const id of allGroupIds) {
      expect(curatedIds.has(id), `"${id}" in groups but not in CURATED_CHORDS`).toBe(true)
    }
  })
})
