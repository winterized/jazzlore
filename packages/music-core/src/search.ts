/**
 * Search helpers shared by the scales & chords header search.
 *
 * `normalizeForSearch` makes an ASCII query (`locr`, `dim`, `half-dim`) match
 * names that carry Unicode accidentals/diacritics (`Locrian ♮2`,
 * `half-diminished 7th`) — fold case + accidentals, drop combining marks.
 */
export function normalizeForSearch(s: string): string {
  return s
    .toLowerCase()
    .replace(/♭/g, 'b')
    .replace(/♯/g, '#')
    .replace(/♮/g, '')
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * True when the OS asks for reduced motion. `matchMedia`-guarded — jsdom (the
 * unit-test env) does not implement it; mirrors `theme.ts` `systemPreference`.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
