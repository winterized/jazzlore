// Client-side autosuggest match over the cached search corpus.
//
// One page = one BFF call: autosuggest never hits the backend per keystroke
// (CLAUDE.md "Autosuggest is client-side over a cached search corpus"). The
// ranker is layered on top of an accent-folded substring match (FROZEN
// `lib/fold`):
//   1. Curated boost: members of `data/curated.ts` (the home-screen 12)
//      rank above any non-curated match — typing "tim" surfaces Bobby
//      Timmons (curated, substring match) ahead of unrelated "Tim McDonald"
//      pages (non-curated, prefix match). This is the explicit policy: the
//      curated 12 are first-class; if one matches at all, it leads.
//   2. Tier by match position: name-prefix > name-substring > aka-only.
//      Applied within each curated/non-curated bucket.
//   3. Canonical-vs-stub dedup: when two entries fold to the SAME name and
//      both match the query, drop the lower-priority one. Prefix priority
//      is `wikidata > musicbrainz > discogs`. Faithfulness within a single
//      prefix (the Antoine Hervé double-node, both wikidata) is preserved —
//      this only collapses ACROSS prefixes (Wave-1 audit fix CRIT-A).
//
// `matchRanges` indexes the ORIGINAL (accented) name so the `<em>` highlight
// aligns with rendered text (landmine 9). Capped at 6 (design "Render hits …
// max 6"). Duplicates within a prefix are kept faithfully (landmine 11).

import type { SearchCorpusEntry } from '../../lib/types'
import { fold, matchRanges, type MatchRange } from '../../lib/fold'
import { CURATED } from '../../data/curated'

const MAX_RESULTS = 6

/** The home-screen curated 12, as a fast lookup for the rank boost. */
const CURATED_IDS: ReadonlySet<string> = new Set(CURATED.map((c) => c.id))

/** Higher = stronger canonical signal. Used to collapse same-folded-name
 *  pairs (`wikidata:Q93341` "Miles Davis" wins over `discogs:1566346`
 *  "Miles Davis"). Entries with an unrecognised prefix get priority 0 so
 *  they lose to any of the known canonical schemes but still beat nothing. */
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

/**
 * Accent-folded substring match over `name` + `aka`. Ranked:
 *   tier 0 = name-prefix; tier 1 = name-substring; tier 2 = aka-only.
 * Curated-12 members shift one tier up. Same-folded-name pairs across
 * prefixes collapse to the canonical (wikidata > musicbrainz > discogs).
 * Stable within a tier (preserves corpus order so same-prefix duplicates
 * stay adjacent and faithful).
 */
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
    /** 0 = name-prefix, 1 = name-substring, 2 = aka-only. Secondary sort. */
    tier: number
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

    // Highlight the original name when it matched; aka-only matches carry no
    // name ranges (the `<em>` only ever wraps a real name substring).
    const ranges = nameIdx === -1 ? [] : matchRanges(query, entry.name)
    scored.push({ hit: { entry, ranges }, curated, tier, order })
  })

  scored.sort(
    (a, b) =>
      a.curated - b.curated || a.tier - b.tier || a.order - b.order,
  )

  // Canonical-vs-stub dedup: collapse same-folded-name pairs ACROSS prefixes.
  // The first occurrence per folded-name key is "the leader" by sort order;
  // a later entry only displaces it if its prefix priority is STRICTLY
  // higher. Otherwise it's dropped. Faithfulness within a single prefix is
  // preserved because the keying uses prefix-prefixed name keys for known
  // schemes, but the cross-prefix collapse uses bare folded name.
  const winners = new Map<string, Scored>()
  for (const s of scored) {
    const key = fold(s.hit.entry.name)
    const existing = winners.get(key)
    if (!existing) {
      winners.set(key, s)
      continue
    }
    const existingPrefix = prefixPriority(existing.hit.entry.id)
    const candidatePrefix = prefixPriority(s.hit.entry.id)
    if (candidatePrefix > existingPrefix) {
      winners.set(key, s)
    }
    // Equal priority (e.g. two wikidata entries with the same folded name —
    // the Antoine Hervé double-node case): keep the earlier one as the
    // displayed leader for this key, but we MUST still surface the duplicate
    // so the user sees both. We handle that below by keeping all
    // same-prefix-priority same-key entries separately.
  }

  // Re-emit: for each scored entry, keep it if either (a) it's the winner for
  // its folded-name key, or (b) its prefix priority equals the winner's
  // (same-prefix duplicate — landmine 11). This preserves the Antoine Hervé
  // double-node while still collapsing wikidata-vs-discogs stub pairs.
  const kept = scored.filter((s) => {
    const key = fold(s.hit.entry.name)
    const winner = winners.get(key)
    if (!winner) return false
    if (winner === s) return true
    return prefixPriority(s.hit.entry.id) === prefixPriority(winner.hit.entry.id)
  })

  return kept.slice(0, MAX_RESULTS).map((s) => s.hit)
}
