import type { ChordDefinition } from '@jazzlore/music-core'

// re-export type for callers that import from this file
export type { ChordDefinition }

/**
 * Canonical 27-chord curated list for chords.jazzlore.com.
 *
 * Locked ordering (Phase 2, 2026-05-14):
 *   Triads (6) → 6ths (3) → 7ths (6) → 9ths (5) → 11ths (3) → 13ths (4)
 * Within each bucket: major → minor → dominant clean → dominant altered.
 *
 * `intervals` and `tonalIntervals` mirror the test fixture in
 * packages/music-core/src/chord.test.ts — they coexist intentionally under
 * different concerns (engine proof vs. canonical app data).
 */
export const CURATED_CHORDS: readonly ChordDefinition[] = [
  // ── Triads (6) ───────────────────────────────────────────────────────────
  { id: 'maj',     primarySuffix: '',        fullName: 'major',              intervals: [0,4,7],               tonalIntervals: ['1P','3M','5P'] },
  { id: 'min',     primarySuffix: 'm',       alternateSuffix: '-',           fullName: 'minor',              intervals: [0,3,7],               tonalIntervals: ['1P','3m','5P'] },
  { id: 'dim',     primarySuffix: 'dim',     alternateSuffix: '°',           fullName: 'diminished',         intervals: [0,3,6],               tonalIntervals: ['1P','3m','5d'] },
  { id: 'aug',     primarySuffix: 'aug',     alternateSuffix: '+',           fullName: 'augmented',          intervals: [0,4,8],               tonalIntervals: ['1P','3M','5A'] },
  { id: 'sus2',    primarySuffix: 'sus2',    fullName: 'suspended 2nd',       intervals: [0,2,7],               tonalIntervals: ['1P','2M','5P'] },
  { id: 'sus4',    primarySuffix: 'sus4',    fullName: 'suspended 4th',       intervals: [0,5,7],               tonalIntervals: ['1P','4P','5P'] },

  // ── 6ths (3) ─────────────────────────────────────────────────────────────
  { id: '6',       primarySuffix: '6',       fullName: 'major 6th',           intervals: [0,4,7,9],             tonalIntervals: ['1P','3M','5P','6M'] },
  { id: 'm6',      primarySuffix: 'm6',      alternateSuffix: '-6',          fullName: 'minor 6th',           intervals: [0,3,7,9],             tonalIntervals: ['1P','3m','5P','6M'] },
  { id: '6_9',     primarySuffix: '6/9',     fullName: 'six-nine',            intervals: [0,4,7,9,14],          tonalIntervals: ['1P','3M','5P','6M','9M'] },

  // ── 7ths (6) ─────────────────────────────────────────────────────────────
  { id: 'maj7',    primarySuffix: 'maj7',    alternateSuffix: 'Δ7',          fullName: 'major 7th',           intervals: [0,4,7,11],            tonalIntervals: ['1P','3M','5P','7M'] },
  { id: 'm7',      primarySuffix: 'm7',      alternateSuffix: '-7',          fullName: 'minor 7th',           intervals: [0,3,7,10],            tonalIntervals: ['1P','3m','5P','7m'] },
  { id: '7',       primarySuffix: '7',       fullName: 'dominant 7th',        intervals: [0,4,7,10],            tonalIntervals: ['1P','3M','5P','7m'] },
  { id: 'm7b5',    primarySuffix: 'm7♭5',    alternateSuffix: 'ø7',          fullName: 'half-diminished 7th', intervals: [0,3,6,10],            tonalIntervals: ['1P','3m','5d','7m'] },
  { id: 'dim7',    primarySuffix: 'dim7',    alternateSuffix: '°7',          fullName: 'diminished 7th',      intervals: [0,3,6,9],             tonalIntervals: ['1P','3m','5d','7d'] },
  { id: 'mmaj7',   primarySuffix: 'mMaj7',   alternateSuffix: '-Δ7',         fullName: 'minor-major 7th',     intervals: [0,3,7,11],            tonalIntervals: ['1P','3m','5P','7M'] },

  // ── 9ths (5) ─────────────────────────────────────────────────────────────
  { id: 'maj9',    primarySuffix: 'maj9',    alternateSuffix: 'Δ9',          fullName: 'major 9th',           intervals: [0,4,7,11,14],         tonalIntervals: ['1P','3M','5P','7M','9M'] },
  { id: 'm9',      primarySuffix: 'm9',      alternateSuffix: '-9',          fullName: 'minor 9th',           intervals: [0,3,7,10,14],         tonalIntervals: ['1P','3m','5P','7m','9M'] },
  { id: '9',       primarySuffix: '9',       fullName: 'dominant 9th',        intervals: [0,4,7,10,14],         tonalIntervals: ['1P','3M','5P','7m','9M'] },
  { id: '7b9',     primarySuffix: '7♭9',     fullName: 'dominant 7♭9',        intervals: [0,4,7,10,13],         tonalIntervals: ['1P','3M','5P','7m','9m'] },
  { id: '7s9',     primarySuffix: '7♯9',     fullName: 'dominant 7♯9',        intervals: [0,4,7,10,15],         tonalIntervals: ['1P','3M','5P','7m','9A'] },

  // ── 11ths (3) ────────────────────────────────────────────────────────────
  { id: 'm11',     primarySuffix: 'm11',     alternateSuffix: '-11',         fullName: 'minor 11th',          intervals: [0,3,7,10,14,17],      tonalIntervals: ['1P','3m','5P','7m','9M','11P'] },
  { id: 'maj7s11', primarySuffix: 'maj7♯11', alternateSuffix: 'Δ7♯11',       fullName: 'Lydian major 7',      intervals: [0,4,7,11,18],         tonalIntervals: ['1P','3M','5P','7M','11A'] },
  { id: '7s11',    primarySuffix: '7♯11',    fullName: 'Lydian dominant',     intervals: [0,4,7,10,14,18],      tonalIntervals: ['1P','3M','5P','7m','9M','11A'] },

  // ── 13ths (4) ────────────────────────────────────────────────────────────
  { id: 'maj13',   primarySuffix: 'maj13',   alternateSuffix: 'Δ13',         fullName: 'major 13th',          intervals: [0,4,7,11,14,21],      tonalIntervals: ['1P','3M','5P','7M','9M','13M'] },
  { id: '13',      primarySuffix: '13',      fullName: 'dominant 13th',       intervals: [0,4,7,10,14,21],      tonalIntervals: ['1P','3M','5P','7m','9M','13M'] },
  { id: '7b13',    primarySuffix: '7♭13',    fullName: 'dominant 7♭13',       intervals: [0,4,7,10,13,20],      tonalIntervals: ['1P','3M','5P','7m','9m','13m'] },
  // 7alt: the standard altered-dominant tone set (NO natural 5th), re-spelled
  // as a clean ascending stack 1 3 ♭7 ♭9 ♯9 ♯11 ♭13. The tritone is the ♯11
  // (true 11th, '11A' = F♯ over C), not a ♯4 — same 7 pitch classes as before,
  // just respelled so the score reads upward without a backward jump.
  { id: '7alt',    primarySuffix: '7alt',    fullName: 'altered dominant',    intervals: [0,4,10,13,15,18,20],   tonalIntervals: ['1P','3M','7m','9m','9A','11A','13m'] },
]
