// Pure helpers for DetailIdentity's identity-meta-chain (Group C item 2) and
// bio teaser (Group C item 3). Lives in its OWN module — co-locating with
// `DetailIdentity.tsx` would trip `react-refresh/only-export-components`
// (the rule reserves component files for components + their direct
// dependencies, not pure helpers callers may want to import elsewhere).

import type { MusicianDetail } from '../../lib/types'

/** Title-cases the first character only (Aura's `genres` are stored lowercased,
 * e.g. `"cool jazz"` → `"Cool jazz"`). We deliberately do NOT capitalize each
 * word — multi-word genres like "cool jazz" / "modal jazz" / "jazz fusion"
 * read as proper nouns whose head is lowercase, matching the design's
 * "Cool · Modal · Fusion" short-form spelling without inventing a label map. */
export function capitalizeFirst(s: string): string {
  return s.length === 0 ? s : (s[0]?.toUpperCase() ?? '') + s.slice(1)
}

/** Identity meta line — capitalized primary instrument + the FULL `genres`
 * chain (each capitalized) + the years range. Per Group C item 2, the chain
 * replaces the single-bucket `deriveEra` label (`d.era`) that hides the
 * actual breadth (cool/modal/fusion for Miles). `genres` is on the FROZEN
 * `MusicianDetail` contract — non-optional `string[]` — so no sibling-field
 * deviation is needed. */
export function metaLine(d: MusicianDetail): string {
  const bits: string[] = []
  const inst = d.primaryInstruments[0]
  if (inst) bits.push(capitalizeFirst(inst))
  for (const g of d.genres) {
    if (typeof g === 'string' && g.length > 0) bits.push(capitalizeFirst(g))
  }
  const start = d.birthYear ?? d.yearsActiveStart
  if (start !== undefined) {
    const end = d.deathYear
    bits.push(end !== undefined ? `${start}–${end}` : `${start}–present`)
  }
  return bits.join(' · ')
}

/** Returns the FIRST sentence of a bio string — text up to and including the
 * first `.`, `!` or `?`. If none found, returns the whole trimmed string.
 * Used by Item 3 to render a one-line italic teaser on the detail page; the
 * full bio still renders in the "More about" sheet (sheet is a separate
 * context — deliberate non-dedup per the Group C plan). */
export function firstSentence(s: string): string {
  const match = s.match(/^[^.!?]+[.!?]/)
  return match ? match[0].trim() : s.trim()
}
