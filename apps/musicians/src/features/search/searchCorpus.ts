// Client-side autosuggest match over the cached search corpus.
//
// One page = one BFF call: autosuggest never hits the backend per keystroke
// (CLAUDE.md "Autosuggest is client-side over a cached search corpus").
// Matching uses the FROZEN accent-fold contract (lib/fold): `fold` for the
// query/name comparison, `matchRanges` for the `<em>` offsets which index
// the ORIGINAL (accented) name so the highlight aligns with rendered text
// (landmine 9). Duplicates are kept faithfully — NO client-side dedup
// (landmine 11). Capped at 6 (design "Render hits ... max 6").

import type { SearchCorpusEntry } from '../../lib/types'
import { fold, matchRanges, type MatchRange } from '../../lib/fold'

const MAX_RESULTS = 6

export interface SearchHit {
  entry: SearchCorpusEntry
  /** Highlight ranges over the ORIGINAL `entry.name` (frozen matchRanges). */
  ranges: MatchRange[]
}

/**
 * Accent-folded substring match over `name` + `aka`. Ranked: name-prefix
 * matches first, then name-substring, then aka-only; stable within a tier
 * (preserves corpus order so duplicates stay adjacent and faithful).
 */
export function searchCorpus(
  corpus: SearchCorpusEntry[],
  query: string,
): SearchHit[] {
  const q = fold(query.trim())
  if (q === '') return []

  type Scored = { hit: SearchHit; tier: number; order: number }
  const scored: Scored[] = []

  corpus.forEach((entry, order) => {
    const foldedName = fold(entry.name)
    const nameIdx = foldedName.indexOf(q)
    const akaHit = entry.aka.some((a) => fold(a).includes(q))

    if (nameIdx === -1 && !akaHit) return

    let tier: number
    if (nameIdx === 0) tier = 0
    else if (nameIdx > 0) tier = 1
    else tier = 2

    // Highlight the original name when it matched; aka-only matches carry no
    // name ranges (the `<em>` only ever wraps a real name substring).
    const ranges = nameIdx === -1 ? [] : matchRanges(query, entry.name)
    scored.push({ hit: { entry, ranges }, tier, order })
  })

  scored.sort((a, b) => a.tier - b.tier || a.order - b.order)
  return scored.slice(0, MAX_RESULTS).map((s) => s.hit)
}
