import { describe, expect, it } from 'vitest'
import {
  mapCollaborator,
  mapCuratedCard,
  mapGraphData,
  mapMusicianDetail,
  mapSearchCorpus,
} from './map'
import type { RawCollaboratorRow, RawDetailResult } from './fixtures'
import type { RawMusician, RawRecord } from './types'
import {
  CORPUS_ROWS,
  DUPLICATE_PAIR,
  MODERATE_DETAIL,
  RICH_DETAIL,
  SPARSE_DETAIL,
} from './fixtures'

describe('mapCollaborator — tier-2 direct artist URLs', () => {
  const rowWith = (over: Record<string, unknown>): RawCollaboratorRow => ({
    musician: { id: 'wikidata:Q7346', name: 'John Coltrane', ...over },
    sharedRecords: [],
  })

  it('carries spotify/apple artist URLs through to the Collaborator', () => {
    const c = mapCollaborator(
      rowWith({
        spotify_artist_url: 'https://open.spotify.com/artist/abc',
        apple_artist_url: 'https://music.apple.com/us/artist/john-coltrane/123',
      }),
    )
    expect(c.spotifyArtistUrl).toBe('https://open.spotify.com/artist/abc')
    expect(c.appleArtistUrl).toBe(
      'https://music.apple.com/us/artist/john-coltrane/123',
    )
  })

  it('leaves them undefined when the raw node has no artist URL', () => {
    const c = mapCollaborator(rowWith({}))
    expect(c.spotifyArtistUrl).toBeUndefined()
    expect(c.appleArtistUrl).toBeUndefined()
  })
})

describe('mapMusicianDetail — rich (Miles-like)', () => {
  const m = mapMusicianDetail(RICH_DETAIL)

  it('maps scalar + list fields faithfully from the raw row', () => {
    expect(m.id).toBe('wikidata:Q93341')
    expect(m.name).toBe('Miles Davis')
    expect(m.aka).toEqual(['Miles Dewey Davis III'])
    expect(m.primaryInstruments).toEqual(['trumpet'])
    expect(m.birthYear).toBe(1926)
    expect(m.birthDate).toBe('1926-05-26')
    expect(m.deathYear).toBe(1991)
    expect(m.nationality).toBe('United States')
    expect(m.genres).toEqual(['cool jazz', 'modal jazz', 'jazz fusion'])
    expect(m.bioSummary).toMatch(/American trumpeter/)
    expect(m.links.wikidataId).toBe('Q93341')
    expect(m.links.discogsId).toBe('23083')
  })

  it('photo is TRUE iff picture_url present (never a name heuristic)', () => {
    expect(m.photo).toBe(true)
    expect(m.portrait.url).toBe('https://commons.example/miles.jpg')
    expect(m.portrait.license).toBe('CC BY-SA 3.0')
    expect(m.portrait.attribution).toBe('Tom Palumbo')
  })

  it('does NOT invent an era taxonomy in Phase B (era stays undefined)', () => {
    expect(m.era).toBeUndefined()
  })

  it('aggregates collaborators: distinct shared-record count + earliest topRecord', () => {
    const trane = m.collaborators.find((c) => c.name === 'John Coltrane')
    expect(trane).toBeDefined()
    expect(trane!.id).toBe('wikidata:Q7346')
    expect(trane!.instrument).toBe('tenor saxophone')
    // shares Kind of Blue (1959) + 'Round About Midnight (1957) → count 2,
    // top = earliest release_year = 'Round About Midnight (1957)
    expect(trane!.sharedRecordCount).toBe(2)
    expect(trane!.topRecord).toEqual({
      title: "'Round About Midnight",
      year: 1957,
    })
    expect(trane!.photo).toBe(true)
  })

  it('collaborator photo:false when the collaborator has no picture_url', () => {
    const ron = m.collaborators.find((c) => c.name === 'Ron Carter')!
    expect(ron.photo).toBe(false)
    const paul = m.collaborators.find((c) => c.name === 'Paul Chambers')!
    expect(paul.photo).toBe(false)
    expect(paul.instrument).toBeUndefined() // bare stub: id + name only
  })

  it('preserves the BFF-given collaborator order (no re-sort, no dedup)', () => {
    expect(m.collaborators.map((c) => c.name)).toEqual([
      'John Coltrane',
      'Ron Carter',
      'Paul Chambers',
    ])
  })

  it("derives RecordRef.primaryArtist from the record's leader edge", () => {
    const kob = m.records.find((r) => r.title === 'Kind of Blue')!
    // Miles is the leader on Kind of Blue in this fixture
    expect(kob.primaryArtist).toBe('Miles Davis')
    expect(kob.releaseYear).toBe(1959)
    expect(kob.label).toBe('Columbia')
    expect(kob.cover.license).toBe('Fair use')
  })
})

describe('mapMusicianDetail — moderate (Bobby-like)', () => {
  const m = mapMusicianDetail(MODERATE_DETAIL)

  it('handles a missing death_date/place gracefully (deathYear only)', () => {
    expect(m.deathYear).toBe(1974)
    expect(m.deathDate).toBeUndefined()
    expect(m.deathPlace).toBeUndefined()
  })

  it('primaryArtist falls back when the focus musician is not the leader', () => {
    // Bobby is a sideman on Moanin'; the collaborator Art Blakey is leader.
    const moanin = m.records.find((r) => r.title === "Moanin'")!
    expect(moanin.primaryArtist).toBe('Art Blakey')
  })

  it('empty aka array stays an empty array (not undefined)', () => {
    expect(m.aka).toEqual([])
  })
})

describe('mapMusicianDetail — sparse (Antoine-like)', () => {
  const m = mapMusicianDetail(SPARSE_DETAIL)

  it('degrades gracefully: no bio, no portrait, photo:false', () => {
    expect(m.bioSummary).toBeUndefined()
    expect(m.photo).toBe(false)
    expect(m.portrait.url).toBeUndefined()
    expect(m.portrait.license).toBeUndefined()
  })

  it('absent optional scalars are undefined, list fields default to []', () => {
    expect(m.deathYear).toBeUndefined()
    expect(m.birthDate).toBeUndefined()
    expect(m.yearsActiveStart).toBeUndefined()
    expect(m.aka).toEqual([])
    expect(m.allInstruments).toEqual([])
    expect(m.genres).toEqual([])
  })

  it('still maps the thin collaborator + record it does have', () => {
    expect(m.collaborators).toHaveLength(1)
    expect(m.collaborators[0]!.name).toBe('Didier Lockwood')
    expect(m.records[0]!.primaryArtist).toBe('Antoine Hervé') // Antoine = leader
  })
})

describe('duplicates rendered faithfully — NO mapper/client dedup', () => {
  it('two distinct node ids with the same wikidata_id both map through', () => {
    const corpus = mapSearchCorpus(CORPUS_ROWS)
    const antoines = corpus.filter((e) => e.name === 'Antoine Hervé')
    expect(antoines).toHaveLength(2)
    expect(antoines.map((a) => a.id).sort()).toEqual(
      ['musicbrainz:antoine-herve-dupe', 'wikidata:Q2856321'].sort(),
    )
    // Neither the mapper nor the corpus collapses them.
    expect(corpus).toHaveLength(CORPUS_ROWS.length)
  })

  it('the duplicate pair shares an external id but keeps distinct node ids', () => {
    const [a, b] = DUPLICATE_PAIR
    expect(a.wikidata_id).toBe(b.wikidata_id)
    expect(a.id).not.toBe(b.id)
  })
})

describe('mapSearchCorpus', () => {
  it('maps name + aka + primary instrument; era stays undefined (Phase B)', () => {
    const corpus = mapSearchCorpus(CORPUS_ROWS)
    const miles = corpus.find((e) => e.id === 'wikidata:Q93341')!
    expect(miles).toEqual({
      id: 'wikidata:Q93341',
      name: 'Miles Davis',
      aka: ['Miles Dewey Davis III'],
      primaryInstrument: 'trumpet',
      era: undefined,
    })
    const antoine = corpus.find((e) => e.id === 'wikidata:Q2856321')!
    expect(antoine.aka).toEqual([])
  })
})

describe('mapCuratedCard', () => {
  it('hydrates a hand-picked id+hook with live name/photo', () => {
    const card = mapCuratedCard(
      { id: 'wikidata:Q93341', hook: 'The man who reinvented jazz five times.' },
      RICH_DETAIL.musician,
    )
    expect(card).toEqual({
      id: 'wikidata:Q93341',
      name: 'Miles Davis',
      hook: 'The man who reinvented jazz five times.',
      subtitle: 'trumpet',
      photo: true,
      portrait: {
        url: 'https://commons.example/miles.jpg',
        license: 'CC BY-SA 3.0',
        attribution: 'Tom Palumbo',
      },
    })
  })

  it('curated card with a sparse musician → photo:false, no subtitle crash', () => {
    const card = mapCuratedCard(
      { id: 'wikidata:Q2856321', hook: 'A French voice worth a detour.' },
      DUPLICATE_PAIR[0],
    )
    expect(card.photo).toBe(false)
    expect(card.subtitle).toBe('piano')
  })
})

describe('mapGraphData', () => {
  const g = mapGraphData(RICH_DETAIL)

  it('focus node carries total record count and focus:true', () => {
    const focus = g.nodes.find((n) => n.focus)!
    expect(focus.id).toBe('wikidata:Q93341')
    expect(focus.recordCount).toBe(3)
  })

  it('one node per collaborator, edges weighted by shared-record count', () => {
    const ids = g.nodes.map((n) => n.id)
    expect(ids).toContain('wikidata:Q7346')
    expect(ids).toContain('wikidata:Q1339')
    const traneEdge = g.edges.find((e) => e.target === 'wikidata:Q7346')!
    expect(traneEdge.source).toBe('wikidata:Q93341')
    expect(traneEdge.weight).toBe(2) // Coltrane shares 2 records
  })

  it('renders duplicate collaborator nodes faithfully (no dedup)', () => {
    // graph mirrors the collaborator list 1:1; count matches.
    expect(g.nodes.length).toBe(RICH_DETAIL.collaborators.length + 1)
  })
})

describe('issue #155 Lever 1 — mapper ignores the trimmed-away fields', () => {
  // detailCypher (Lever 1) stopped shipping the fields below for the per-record
  // and per-collaborator collections (the `{.*}` → explicit-projection change).
  // This test PROVES the mapper never read them: feeding a result that carries
  // ONLY the projected fields must produce byte-identical domain output to the
  // full fixture. If anyone later teaches the mapper to read a trimmed-away
  // field, this fails — flagging that the Cypher must re-add it.

  // Top-level record keeps the 14 fields mapRecordRef reads; everything else
  // (secondary_types, is_various_artists, recording_location, producer,
  // engineer) is dropped.
  const pickRecordTop = (r: RawRecord): RawRecord => ({
    id: r.id,
    title: r.title,
    type: r.type,
    release_year: r.release_year,
    recording_year: r.recording_year,
    label: r.label,
    catalog_number: r.catalog_number,
    track_count: r.track_count,
    cover_art_url: r.cover_art_url,
    cover_art_license: r.cover_art_license,
    wikipedia_url: r.wikipedia_url,
    wikidata_id: r.wikidata_id,
    musicbrainz_id: r.musicbrainz_id,
    discogs_id: r.discogs_id,
  })
  // Nested shared record keeps only {id, title, release_year}.
  const pickRecordNested = (r: RawRecord): RawRecord => ({
    id: r.id,
    title: r.title,
    release_year: r.release_year,
  })
  // Collaborator node keeps only the 6 fields mapCollaborator + mapGraphData
  // read (drops bio_summary, aka, all_instruments, dates/places, genres,
  // picture_license, picture_attribution, also_known_as_ids, …).
  const pickCollab = (m: RawMusician): RawMusician => ({
    id: m.id,
    name: m.name,
    primary_instruments: m.primary_instruments,
    picture_url: m.picture_url,
    spotify_artist_url: m.spotify_artist_url,
    apple_artist_url: m.apple_artist_url,
  })

  // Faithful simulation of what Aura returns AFTER Lever 1. Edges keep their
  // full property maps (properties(fe)/properties(ce) is unchanged). The focus
  // musician keeps the full m{.*} spread.
  const TRIMMED: RawDetailResult = {
    musician: RICH_DETAIL.musician,
    records: RICH_DETAIL.records.map(({ record, edge }) => ({
      record: pickRecordTop(record),
      edge,
    })),
    collaborators: RICH_DETAIL.collaborators.map(({ musician, sharedRecords }) => ({
      musician: pickCollab(musician),
      sharedRecords: sharedRecords.map(({ record, edge }) => ({
        record: pickRecordNested(record),
        edge,
      })),
    })),
  }

  it('mapMusicianDetail output is identical with trimmed vs full input', () => {
    expect(mapMusicianDetail(TRIMMED)).toEqual(mapMusicianDetail(RICH_DETAIL))
  })

  it('mapGraphData output is identical with trimmed vs full input', () => {
    expect(mapGraphData(TRIMMED)).toEqual(mapGraphData(RICH_DETAIL))
  })
})
