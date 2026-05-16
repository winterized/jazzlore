import { formatPrimarySymbol, normalizeForSearch } from '@jazzlore/music-core'
import type { SearchResult } from '@jazzlore/ui'
import { CURATED_CHORDS } from '../data/curated'

const MAX_RESULTS = 10

/**
 * Substring search over a chord's full name + symbols (accidental-folded),
 * scoped to the current root. e.g. root C + `dim` → "C diminished",
 * "C half-diminished 7th", "C diminished 7th". `result.id` is the existing
 * DOM anchor `chord-<id>` on the chord card `<li>`.
 */
export function searchChords(query: string, rootDisplay: string): SearchResult[] {
  const q = normalizeForSearch(query)
  if (q === '') return []
  const out: SearchResult[] = []
  for (const def of CURATED_CHORDS) {
    const hay = normalizeForSearch(
      `${def.fullName} ${def.primarySuffix} ${def.alternateSuffix ?? ''}`,
    )
    if (hay.includes(q)) {
      out.push({
        id: `chord-${def.id}`,
        label: `${rootDisplay} ${def.fullName}`,
        sublabel: formatPrimarySymbol(rootDisplay, def.primarySuffix),
      })
      if (out.length === MAX_RESULTS) break
    }
  }
  return out
}
