/**
 * chordGroups.ts — 6 ordered chord categories for chords.jazzlore.com.
 *
 * Maps the design's 6 visual groups to the real curated ChordIds from
 * curated.ts. The integrity invariant is enforced by chordGroups.test.ts:
 *   (a) every id here resolves to a real curated ChordId
 *   (b) every curated ChordId appears in exactly one group
 *   (c) union = permutation of all 27 curated ids
 *
 * Group membership notes:
 *   - EXTENDED covers the three 11ths + the two "clean" 13ths (maj13, 13).
 *   - ALTERED covers the two altered 13ths (7b13, 7alt) — tightest dissonance.
 *   - Within-group order mirrors the locked curated ordering (Phase 2):
 *     major → minor → dominant clean → dominant altered.
 */

import type { ChordId } from '@jazzlore/music-core'

export type ChordGroup = {
  /** Display label shown in the chip row and body section dividers. */
  label: string
  /** Ordered curated ChordId values that belong to this group. */
  chordIds: readonly ChordId[]
}

export const CHORD_GROUPS: readonly ChordGroup[] = [
  {
    label: 'TRIADS',
    chordIds: ['maj', 'min', 'dim', 'aug', 'sus2', 'sus4'],
  },
  {
    label: 'SIXTHS',
    chordIds: ['6', 'm6', '6_9'],
  },
  {
    label: 'SEVENTHS',
    chordIds: ['maj7', 'm7', '7', 'm7b5', 'dim7', 'mmaj7'],
  },
  {
    label: 'NINTHS',
    chordIds: ['maj9', 'm9', '9', '7b9', '7s9'],
  },
  {
    label: 'EXTENDED',
    // 11ths (m11, maj7s11, 7s11) + the two "clean" 13ths
    chordIds: ['m11', 'maj7s11', '7s11', 'maj13', '13'],
  },
  {
    label: 'ALTERED',
    // The two most-altered 13ths: 7♭13 and 7alt
    chordIds: ['7b13', '7alt'],
  },
]
