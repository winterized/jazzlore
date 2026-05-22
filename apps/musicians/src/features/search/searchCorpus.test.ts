import { describe, expect, it } from 'vitest'
import type { SearchCorpusEntry } from '../../lib/types'
import { searchCorpus } from './searchCorpus'

const corpus: SearchCorpusEntry[] = [
  { id: '1', name: 'Miles Davis', aka: [], primaryInstrument: 'trumpet' },
  { id: '2', name: 'John Coltrane', aka: [], primaryInstrument: 'tenor saxophone' },
  {
    id: '3',
    name: 'Antônio Carlos Jobim',
    aka: ['Tom Jobim'],
    primaryInstrument: 'piano',
  },
  { id: '4', name: 'Antoine Hervé', aka: [], primaryInstrument: 'piano' },
  // Duplicate kept faithfully (landmine 11) — same name, distinct id.
  { id: '5', name: 'Antoine Hervé', aka: [], primaryInstrument: 'piano' },
  { id: '6', name: 'Art Blakey', aka: [], primaryInstrument: 'drums' },
  { id: '7', name: 'Cannonball Adderley', aka: [], primaryInstrument: 'alto sax' },
]

describe('searchCorpus', () => {
  it('returns [] for an empty / whitespace query', () => {
    expect(searchCorpus(corpus, '')).toEqual([])
    expect(searchCorpus(corpus, '   ')).toEqual([])
  })

  it('matches accent-folded (query without accents finds accented names)', () => {
    const hits = searchCorpus(corpus, 'anto')
    const names = hits.map((h) => h.entry.name)
    expect(names).toContain('Antônio Carlos Jobim')
    expect(names).toContain('Antoine Hervé')
  })

  it('matches the folded name even when the query carries accents', () => {
    const hits = searchCorpus(corpus, 'hervé')
    expect(hits.map((h) => h.entry.id)).toEqual(
      expect.arrayContaining(['4', '5']),
    )
  })

  it('matches on aka as well as name', () => {
    const hits = searchCorpus(corpus, 'tom jobim')
    expect(hits[0]?.entry.id).toBe('3')
  })

  it('caps results at 6', () => {
    const big: SearchCorpusEntry[] = Array.from({ length: 20 }, (_, i) => ({
      id: `m${i}`,
      name: `Aaron ${i}`,
      aka: [],
    }))
    expect(searchCorpus(big, 'aaron')).toHaveLength(6)
  })

  it('keeps duplicates faithfully (no client-side dedup, landmine 11)', () => {
    const hits = searchCorpus(corpus, 'antoine herve')
    const ids = hits.map((h) => h.entry.id)
    expect(ids).toContain('4')
    expect(ids).toContain('5')
  })

  it('returns match ranges that index the ORIGINAL (accented) name', () => {
    const hit = searchCorpus(corpus, 'anto').find(
      (h) => h.entry.name === 'Antônio Carlos Jobim',
    )
    expect(hit).toBeDefined()
    const r = hit!.ranges[0]!
    // "anto" (4 folded chars) maps back to the 4 ORIGINAL code points
    // "Antô" — the accented ô counts as one original char (landmine 9).
    expect('Antônio Carlos Jobim'.slice(r.start, r.end)).toBe('Antô')
  })

  it('prefers prefix matches (name starting with the query ranks first)', () => {
    const hits = searchCorpus(corpus, 'a')
    // "Antônio", "Antoine", "Art" all start with A; "Cannonball Adderley"
    // only contains an "a" mid-word → ranked after the prefix matches.
    const lastName = hits[hits.length - 1]?.entry.name
    expect(lastName).not.toMatch(/^A/)
  })

  // Wave 1 / PR1 — Audit CRIT-A + CRIT-B: ranker must prefer canonical
  // wikidata entities over discogs stubs on a same-name collision, and must
  // boost the curated-12 above non-curated entries so e.g. "tim" surfaces
  // Bobby Timmons (curated) before unrelated "Tim McDonald" pages.

  it('ranks curated-12 members above non-curated when both match', () => {
    // Bobby Timmons (wikidata:Q132341) is in CURATED. "tim" is a substring
    // for both; without the boost, "Tim McDonald" (tier 0 prefix) outranks
    // "Bobby Timmons" (tier 1 substring). Curated boost is unbounded — a
    // curated tier-1 entry beats any non-curated entry that also matches.
    const c: SearchCorpusEntry[] = [
      { id: 'wikidata:OBSCURE', name: 'Tim McDonald', aka: [] },
      { id: 'wikidata:Q132341', name: 'Bobby Timmons', aka: [] }, // curated
    ]
    const hits = searchCorpus(c, 'tim')
    expect(hits[0]?.entry.id).toBe('wikidata:Q132341')
  })

  it('ranks curated entries above non-curated even when curated matches only via aka', () => {
    // The curated boost is unbounded: a curated tier-2 (aka-only) match
    // beats a non-curated tier-0 (prefix) match. This is intentional — the
    // home-screen 12 are a small, deliberately-chosen first-class list.
    const c: SearchCorpusEntry[] = [
      { id: 'wikidata:OBSCURE', name: 'Trane Smith', aka: [] }, // prefix
      { id: 'wikidata:Q7346', name: 'John Coltrane', aka: ['Trane'] }, // curated, aka-only
    ]
    const hits = searchCorpus(c, 'trane')
    expect(hits[0]?.entry.id).toBe('wikidata:Q7346')
  })

  it('ranks wikidata canonical above discogs stub on prefix-priority tiebreak (non-curated)', () => {
    // Names DIFFER ("lee morgan + her" vs "lee morgan") → no same-folded-name
    // collapse. Both stay; canonical leads via prefix-priority tiebreak
    // inside the same (non-curated, tier-0) bucket. Uses NON-curated ids
    // to isolate the prefix-priority mechanism from the curated boost
    // (the audit-symptomatic Miles Davis case has the canonical id IN the
    // curated 12 — that case is covered by the curated-boost test above).
    const c: SearchCorpusEntry[] = [
      { id: 'discogs:8888', name: 'Lee Morgan + Her Trio', aka: [] },
      { id: 'wikidata:Q380929', name: 'Lee Morgan', aka: [] },
    ]
    const hits = searchCorpus(c, 'lee')
    expect(hits[0]?.entry.id).toBe('wikidata:Q380929')
    expect(hits.map((h) => h.entry.id)).toContain('discogs:8888')
  })

  it('collapses exact same-folded-name pairs to the canonical prefix', () => {
    // Two entries that fold to the SAME name (one wikidata, one discogs).
    // The stub is dropped; the canonical wins.
    const c: SearchCorpusEntry[] = [
      { id: 'discogs:9999', name: 'John Coltrane', aka: [] },
      { id: 'wikidata:Q7346', name: 'John Coltrane', aka: [] },
    ]
    const hits = searchCorpus(c, 'coltrane')
    expect(hits.map((h) => h.entry.id)).toEqual(['wikidata:Q7346'])
  })

  it('keeps faithful same-prefix duplicates (no client-side dedup, landmine 11)', () => {
    // The Antoine Hervé double-node (both wikidata canonical) must stay.
    // The canonical-vs-stub collapse only fires ACROSS prefixes.
    const c: SearchCorpusEntry[] = [
      { id: 'wikidata:Q1', name: 'Antoine Hervé', aka: [] },
      { id: 'wikidata:Q2', name: 'Antoine Hervé', aka: [] },
    ]
    const hits = searchCorpus(c, 'antoine')
    expect(hits.map((h) => h.entry.id)).toEqual(
      expect.arrayContaining(['wikidata:Q1', 'wikidata:Q2']),
    )
  })
})
