// JourneyData — type contract for the 3 "Start a journey" landing pages.
//
// `Random jump` → instant client-side redirect, no entry data needed.
// `Era walk`   → ERA_DATA in `data/eras.ts`  — 7 canonical eras.
// `Label walk` → LABEL_DATA in `data/labels.ts` — 6 iconic mid-century labels.
//
// Both ERA_DATA and LABEL_DATA are `Record<slug, JourneyEntry>`. Object key
// order is meaningful — `JourneyIndexPage` iterates `Object.values(...)` and
// expects chronological order for eras, founding-year order for labels.

export type JourneyVariant = 'era' | 'label'

export interface JourneyMusician {
  /** ID in the same format as the rest of the app — `wikidata:Q…`,
   *  `musicbrainz:<uuid>`, or `discogs:<n>`. Verified against the live
   *  `/api/musicians/search-index` corpus when this data was assembled. */
  id: string
  /** Display name. Must match the corpus's `name` for the resolved id. */
  name: string
  /** 1-line editorial hook, ~12–18 words. Voice mirrors the home-page
   *  CuratedCard hooks. */
  hook: string
}

export interface JourneyEntry {
  /** URL-safe slug — kebab-case (`hard-bop`, `blue-note`). */
  slug: string
  /** Display name (`Hard Bop`, `Blue Note`). */
  name: string
  /** Top-line kicker (uppercase, accent color via `.kicker`). */
  kicker: string
  /** H1 line — one decisive word + a period. */
  h1: string
  /** Italic subtitle — the editorial framing. */
  subtitle: string
  /** Unicode glyph echoed in the index chip + the `<h1>` row. */
  icon: string
  /** 8–12 curated musicians. */
  musicians: JourneyMusician[]
}
