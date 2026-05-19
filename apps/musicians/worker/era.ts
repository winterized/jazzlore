// Editorial era taxonomy (Phase C's call).
//
// lib/README assumption 3: `era` is NOT a Neo4j field; Phase B deliberately
// left `MusicianDetail.era` / `SearchCorpusEntry.era` undefined and handed the
// taxonomy to Phase C. This derives a single short editorial label from the
// musician's `genres` (primary signal) with a `years_active_start` fallback.
// Pure, fetch-free; the BFF sets it on the mapped domain object post-map so
// the FROZEN mappers stay untouched.

import type { RawMusician } from '../src/lib/types'

// Genre → era, most specific first (first match wins).
const GENRE_ERA: { match: RegExp; era: string }[] = [
  { match: /fusion|jazz[- ]?rock/i, era: 'Fusion' },
  { match: /free jazz|avant|spiritual/i, era: 'Avant-garde' },
  { match: /modal/i, era: 'Modal' },
  { match: /hard ?bop|soul jazz/i, era: 'Hard bop' },
  { match: /cool jazz|west coast|third stream/i, era: 'Cool' },
  { match: /bebop|bop/i, era: 'Bebop' },
  { match: /swing|big band/i, era: 'Swing' },
  { match: /contemporary|post[- ]?bop|modern creative/i, era: 'Contemporary' },
]

// Years-active fallback bands when genres are absent/unmatched.
const YEAR_ERA: { until: number; era: string }[] = [
  { until: 1945, era: 'Swing' },
  { until: 1955, era: 'Bebop' },
  { until: 1965, era: 'Hard bop' },
  { until: 1980, era: 'Modal' },
  { until: 2100, era: 'Contemporary' },
]

/** Editorial era label, or `undefined` when neither genres nor an active
 * start year give a confident signal (sparse is the norm — don't invent). */
export function deriveEra(m: RawMusician): string | undefined {
  const genres = Array.isArray(m.genres) ? m.genres : []
  for (const g of genres) {
    for (const { match, era } of GENRE_ERA) {
      if (match.test(g)) return era
    }
  }
  const start = m.years_active_start
  if (typeof start === 'number' && Number.isFinite(start)) {
    for (const { until, era } of YEAR_ERA) {
      if (start < until) return era
    }
  }
  return undefined
}
