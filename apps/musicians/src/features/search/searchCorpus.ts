// Client-side autosuggest match over the cached search corpus.
//
// One page = one BFF call: autosuggest never hits the backend per keystroke
// (CLAUDE.md "Autosuggest is client-side over a cached search corpus"). The
// ranker layers four ordered keys on top of an accent-folded substring match
// (FROZEN `lib/fold`):
//
//   1. Curated boost: members of `data/curated.ts` (the home-screen 12)
//      rank above any non-curated match. Unbounded — typing "tim" surfaces
//      Bobby Timmons (curated, substring match) ahead of unrelated
//      "Tim McDonald" pages (non-curated, prefix match). The curated 12 are
//      a deliberately small, first-class list; if one matches at all, it
//      leads.
//   2. Match tier: name-prefix (0) > name-substring (1) > aka-only (2),
//      applied within each curated/non-curated bucket.
//   3. Canonical-prefix tiebreak: within the same (curated, tier) bucket,
//      prefer canonical prefixes — `wikidata:` > `musicbrainz:` >
//      `discogs:`. So a non-curated wikidata canonical leads a non-curated
//      discogs stub even when corpus order would put the stub first.
//   4. Corpus order — stable within everything above (preserves duplicates
//      faithfully, landmine 11).
//
// On top of the sort, a final dedup collapses entries that share the same
// `fold(name)` ACROSS prefixes (Miles Davis canonical wikidata vs a Miles
// Davis discogs stub) — the canonical wins, the stub is dropped (audit
// fix CRIT-A). Same-folded-name SAME-prefix pairs (the Antoine Hervé
// double-node, both wikidata) stay faithful — landmine 11.
//
// `matchRanges` indexes the ORIGINAL (accented) name so the `<em>` highlight
// aligns with rendered text (landmine 9). Capped at 6 (design "Render hits …
// max 6").

import type { SearchCorpusEntry } from '../../lib/types'
import { fold, matchRanges, type MatchRange } from '../../lib/fold'
import { CURATED } from '../../data/curated'

const MAX_RESULTS = 6

/** The home-screen curated 12, as a fast lookup for the rank boost. */
const CURATED_IDS: ReadonlySet<string> = new Set(CURATED.map((c) => c.id))

/** Higher = stronger canonical signal. Used to break ties between matches
 *  of the same quality and to collapse same-folded-name pairs across
 *  prefixes. Entries with an unrecognised prefix get 0 — they lose to any
 *  of the three known canonical schemes but still beat nothing. */
function prefixPriority(id: string): number {
  if (id.startsWith('wikidata:')) return 3
  if (id.startsWith('musicbrainz:')) return 2
  if (id.startsWith('discogs:')) return 1
  return 0
}

export interface SearchHit {
  entry: SearchCorpusEntry
  /** Highlight ranges over the ORIGINAL `entry.name` (frozen matchRanges). */
  ranges: MatchRange[]
}

export function searchCorpus(
  corpus: SearchCorpusEntry[],
  query: string,
): SearchHit[] {
  const q = fold(query.trim())
  if (q === '') return []

  type Scored = {
    hit: SearchHit
    /** 0 = curated, 1 = not curated. Primary sort key — curated always
     *  wins over non-curated when both match. */
    curated: number
    /** 0 = name-prefix, 1 = name-substring, 2 = aka-only. */
    tier: number
    /** Prefix-priority canonical signal — sorted DESCENDING (higher wins),
     *  so we negate when used in the comparator. */
    prefix: number
    /** Cached fold-key of the entry's name — reused by the cross-prefix
     *  dedup pass below. */
    foldedKey: string
    order: number
  }
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

    const curated = CURATED_IDS.has(entry.id) ? 0 : 1
    const prefix = prefixPriority(entry.id)

    // Highlight the original name when it matched; aka-only matches carry no
    // name ranges (the `<em>` only ever wraps a real name substring).
    const ranges = nameIdx === -1 ? [] : matchRanges(query, entry.name)
    scored.push({
      hit: { entry, ranges },
      curated,
      tier,
      prefix,
      foldedKey: foldedName,
      order,
    })
  })

  scored.sort(
    (a, b) =>
      a.curated - b.curated ||
      a.tier - b.tier ||
      b.prefix - a.prefix ||
      a.order - b.order,
  )

  // Cross-prefix dedup: for entries that share `fold(name)`, the canonical
  // wins, the stub is dropped. Same-prefix duplicates (Antoine Hervé) stay.
  // Because the sort above puts higher-prefix entries first within a tier,
  // the FIRST entry seen for each foldedKey is the canonical leader; any
  // later entry with the same key is kept only if it has the SAME prefix
  // priority (i.e. it's a faithful duplicate, not a stub).
  const leaderPrefix = new Map<string, number>()
  const kept: Scored[] = []
  for (const s of scored) {
    const seenPrefix = leaderPrefix.get(s.foldedKey)
    if (seenPrefix === undefined) {
      leaderPrefix.set(s.foldedKey, s.prefix)
      kept.push(s)
      continue
    }
    if (s.prefix === seenPrefix) {
      // Same-prefix duplicate — keep it (landmine 11).
      kept.push(s)
    }
    // Otherwise (lower prefix priority than the leader) → drop the stub.
  }

  return kept.slice(0, MAX_RESULTS).map((s) => s.hit)
}
