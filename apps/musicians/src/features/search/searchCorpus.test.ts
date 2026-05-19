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
})
