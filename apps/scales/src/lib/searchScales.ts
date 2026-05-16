import { normalizeForSearch } from '@jazzlore/music-core'
import type { SearchResult } from '@jazzlore/ui'
import { CURATED_SCALES, FAMILIES } from '../features/scales/data/curated'

const FAMILY_LABEL = new Map(FAMILIES.map((f) => [f.id, f.label]))

const MAX_RESULTS = 10

/**
 * Substring search over scale name + alias (accidental/diacritic-folded), e.g.
 * `locr` → Locrian, Locrian ♮2, Super Locrian… `result.id` is the DOM anchor
 * `scale-<id>` that `ScaleList` renders on each row.
 */
export function searchScales(query: string): SearchResult[] {
  const q = normalizeForSearch(query)
  if (q === '') return []
  const out: SearchResult[] = []
  for (const s of CURATED_SCALES) {
    const hay = normalizeForSearch(`${s.name} ${s.alias ?? ''}`)
    if (hay.includes(q)) {
      out.push({
        id: `scale-${s.id}`,
        label: s.name,
        sublabel: FAMILY_LABEL.get(s.family),
        // Scroll target is the scale row; the scroll-spy chip is the family.
        chipId: `group-${s.family}`,
      })
      if (out.length === MAX_RESULTS) break
    }
  }
  return out
}
