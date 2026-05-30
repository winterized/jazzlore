import { normalizeForSearch } from '@jazzlore/music-core'
import type { SearchResult } from '@jazzlore/ui'
import { CURATED_SCALES, GROUPS } from '../features/scales/data/curated'

const GROUP_LABEL = new Map(GROUPS.map((g) => [g.id, g.label]))

const MAX_RESULTS = 10

/**
 * Substring search over scale name + alias + description + theoryTag
 * (accidental/diacritic-folded), e.g. `locr` → Locrian, Locrian ♮2; `ionian` →
 * Major (via the kept alias); `japanese` → Hirajoshi, In Sen (via description).
 * `result.id` is the DOM anchor `scale-<id>` that `ScaleList` renders on each row.
 */
export function searchScales(query: string): SearchResult[] {
  const q = normalizeForSearch(query)
  if (q === '') return []
  const out: SearchResult[] = []
  for (const s of CURATED_SCALES) {
    const hay = normalizeForSearch(
      `${s.name} ${s.alias ?? ''} ${s.description} ${s.theoryTag}`,
    )
    if (hay.includes(q)) {
      out.push({
        id: `scale-${s.id}`,
        label: s.name,
        sublabel: GROUP_LABEL.get(s.group),
        // Scroll target is the scale row; the scroll-spy chip is the group.
        chipId: `group-${s.group}`,
      })
      if (out.length === MAX_RESULTS) break
    }
  }
  return out
}
