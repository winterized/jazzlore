// Unit tests for the helpers behind DetailIdentity's identity-meta-chain
// (Group C item 2) and bio teaser (Group C item 3). The render-side wiring is
// exercised by DetailView.test.tsx; this file is the pure-helper coverage
// that documents the expected joiner shape.

import { describe, expect, it } from 'vitest'
import type { MusicianDetail } from '../../lib/types'
import { metaLine, firstSentence } from './detailIdentityMeta'

// Minimal `MusicianDetail` shaped just enough for `metaLine`. Anything the
// helper does not touch can stay as empty arrays / undefined — keeping the
// fixture local makes the assertions read at the call site.
function makeDetail(overrides: Partial<MusicianDetail>): MusicianDetail {
  return {
    id: 'wikidata:Qtest',
    name: 'Test Musician',
    aka: [],
    primaryInstruments: [],
    allInstruments: [],
    genres: [],
    portrait: {},
    photo: false,
    links: {},
    collaborators: [],
    records: [],
    ...overrides,
  }
}

describe('metaLine (Group C item 2 — identity meta chain)', () => {
  it('joins capitalized instrument + each capitalized genre + years', () => {
    const d = makeDetail({
      primaryInstruments: ['trumpet'],
      genres: ['cool jazz', 'modal jazz', 'jazz fusion'],
      birthYear: 1926,
      deathYear: 1991,
    })
    expect(metaLine(d)).toBe(
      'Trumpet · Cool jazz · Modal jazz · Jazz fusion · 1926–1991',
    )
  })

  it('omits the genres segment(s) when genres is empty (no extra separator)', () => {
    const d = makeDetail({
      primaryInstruments: ['piano'],
      genres: [],
      birthYear: 1936,
      deathYear: 1974,
    })
    expect(metaLine(d)).toBe('Piano · 1936–1974')
  })

  it('skips empty / non-string genre entries (no double `·`)', () => {
    // `genres` is `string[]` on the frozen contract, but defensive against
    // bogus values that would otherwise emit empty segments.
    const d = makeDetail({
      primaryInstruments: ['trumpet'],
      genres: ['cool jazz', '', 'modal jazz'],
      birthYear: 1926,
      deathYear: 1991,
    })
    expect(metaLine(d)).toBe('Trumpet · Cool jazz · Modal jazz · 1926–1991')
  })

  it('falls back to yearsActiveStart when birthYear is absent', () => {
    const d = makeDetail({
      primaryInstruments: ['saxophone'],
      genres: ['hard bop'],
      yearsActiveStart: 1955,
    })
    // No deathYear → "–present" form.
    expect(metaLine(d)).toBe('Saxophone · Hard bop · 1955–present')
  })

  it('omits the years segment when neither birthYear nor yearsActiveStart is set', () => {
    const d = makeDetail({
      primaryInstruments: ['guitar'],
      genres: ['fusion'],
    })
    expect(metaLine(d)).toBe('Guitar · Fusion')
  })

  it('omits the instrument segment when primaryInstruments is empty', () => {
    const d = makeDetail({
      primaryInstruments: [],
      genres: ['bebop'],
      birthYear: 1920,
      deathYear: 1955,
    })
    expect(metaLine(d)).toBe('Bebop · 1920–1955')
  })

  it('renders "<start>–present" when birthYear is set but deathYear is not', () => {
    const d = makeDetail({
      primaryInstruments: ['piano'],
      genres: ['post-bop'],
      birthYear: 1960,
    })
    expect(metaLine(d)).toBe('Piano · Post-bop · 1960–present')
  })
})

describe('firstSentence (Group C item 3 — bio teaser splitter)', () => {
  it('returns the first sentence of a multi-sentence bio', () => {
    const bio =
      'American trumpeter, bandleader and composer who was among the most influential figures in jazz. He recorded for over four decades.'
    expect(firstSentence(bio)).toBe(
      'American trumpeter, bandleader and composer who was among the most influential figures in jazz.',
    )
  })

  it('returns the whole string when there is no terminal punctuation', () => {
    const bio = 'A leading hard-bop voice with no period'
    expect(firstSentence(bio)).toBe('A leading hard-bop voice with no period')
  })

  it('recognises ! and ? as sentence terminators', () => {
    expect(firstSentence('Wow! That was a take. And another.')).toBe('Wow!')
    expect(firstSentence('Really? Yes, really.')).toBe('Really?')
  })

  it('trims surrounding whitespace', () => {
    expect(firstSentence('  Padded start. Tail.')).toBe('Padded start.')
  })
})
