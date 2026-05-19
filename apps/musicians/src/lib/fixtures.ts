// Raw-Neo4j-shaped fixtures for mapper TDD (Phase B).
//
// Three data densities, per the design's stress-test set:
//  - RICH      → Miles-like (many collaborators, full fields)
//  - MODERATE  → Bobby-like (~handful of collaborators, rich-enough fields)
//  - SPARSE    → Antoine-like (no bio, no portrait) + the KNOWN DUPLICATE
//                (two distinct node ids, same external id) rendered FAITHFULLY
//                — no mapper/client dedup (landmine 11).
//
// Shapes mirror docs/FRONTEND.md exactly. Reconcile-with-Phase-0: when the
// live audit confirms field names these fixtures + map.ts adjust together;
// the C/D/E contract (types.ts) should not need to change.

import type {
  RawMusician,
  RawPlayedOn,
  RawRecord,
} from './types'

/** One collaborator as the BFF will hand it to the mapper: the collaborator
 * node + the records shared with the focus musician + that collaborator's
 * `:PLAYED_ON` edge per shared record. */
export interface RawCollaboratorRow {
  musician: RawMusician
  sharedRecords: { record: RawRecord; edge: RawPlayedOn }[]
}

export interface RawDetailResult {
  musician: RawMusician
  /** Records the focus musician played on, with their own edge. */
  records: { record: RawRecord; edge: RawPlayedOn }[]
  collaborators: RawCollaboratorRow[]
}

// ─── RICH — Miles-like ────────────────────────────────────────────────────
const MILES: RawMusician = {
  id: 'wikidata:Q93341',
  name: 'Miles Davis',
  aka: ['Miles Dewey Davis III'],
  primary_instruments: ['trumpet'],
  all_instruments: ['trumpet', 'flugelhorn'],
  birth_year: 1926,
  birth_date: '1926-05-26',
  birth_place: 'Alton, Illinois',
  death_year: 1991,
  death_date: '1991-09-28',
  death_place: 'Santa Monica, California',
  years_active_start: 1944,
  years_active_end: 1991,
  nationality: 'United States',
  genres: ['cool jazz', 'modal jazz', 'jazz fusion'],
  picture_url: 'https://commons.example/miles.jpg',
  picture_license: 'CC BY-SA 3.0',
  picture_attribution: 'Tom Palumbo',
  wikipedia_url: 'https://en.wikipedia.org/wiki/Miles_Davis',
  wikidata_id: 'Q93341',
  musicbrainz_id: '561d854a-6a28-4aa7-8c99-323e6ce46c2a',
  discogs_id: '23083',
  bio_summary:
    'American trumpeter, bandleader and composer who was among the most influential figures in jazz.',
}

const KIND_OF_BLUE: RawRecord = {
  id: 'musicbrainz:rg-1959-kob',
  title: 'Kind of Blue',
  type: 'album',
  secondary_types: [],
  is_various_artists: false,
  release_year: 1959,
  recording_year: 1959,
  recording_location: 'Columbia 30th Street Studio, NYC',
  label: 'Columbia',
  catalog_number: 'CL 1355',
  producer: ['Teo Macero', 'Irving Townsend'],
  engineer: ['Fred Plaut'],
  track_count: 5,
  cover_art_url: 'https://commons.example/kob.jpg',
  cover_art_license: 'Fair use',
  wikipedia_url: 'https://en.wikipedia.org/wiki/Kind_of_Blue',
  wikidata_id: 'Q909085',
  musicbrainz_id: 'rg-1959-kob',
  discogs_id: '1972941',
}

const ESP: RawRecord = {
  id: 'musicbrainz:rg-1965-esp',
  title: 'E.S.P.',
  type: 'album',
  release_year: 1965,
  label: 'Columbia',
  track_count: 7,
}

const ROUND_MIDNIGHT: RawRecord = {
  id: 'musicbrainz:rg-1957-ram',
  title: "'Round About Midnight",
  type: 'album',
  release_year: 1957,
  label: 'Columbia',
}

export const RICH_DETAIL: RawDetailResult = {
  musician: MILES,
  records: [
    { record: KIND_OF_BLUE, edge: { instruments: ['trumpet'], role: 'leader', tracks: 'all' } },
    { record: ESP, edge: { instruments: ['trumpet'], role: 'leader', tracks: 'all' } },
    { record: ROUND_MIDNIGHT, edge: { instruments: ['trumpet'], role: 'leader', tracks: 'all' } },
  ],
  collaborators: [
    {
      musician: {
        id: 'wikidata:Q7346',
        name: 'John Coltrane',
        primary_instruments: ['tenor saxophone'],
        picture_url: 'https://commons.example/trane.jpg',
        picture_license: 'Public domain',
        picture_attribution: '',
      },
      sharedRecords: [
        { record: KIND_OF_BLUE, edge: { instruments: ['tenor saxophone'], role: 'sideman', tracks: 'all' } },
        { record: ROUND_MIDNIGHT, edge: { instruments: ['tenor saxophone'], role: 'sideman', tracks: [1, 2] } },
      ],
    },
    {
      musician: {
        id: 'wikidata:Q1339',
        name: 'Ron Carter',
        primary_instruments: ['double bass'],
        // no picture_url → photo:false
      },
      sharedRecords: [
        { record: ESP, edge: { instruments: ['double bass'], role: 'sideman', tracks: 'all' } },
      ],
    },
    {
      musician: {
        id: 'musicbrainz:stub-paul-chambers',
        name: 'Paul Chambers',
        // sideman stub, not yet enriched: only id + name
      },
      sharedRecords: [
        { record: KIND_OF_BLUE, edge: { instruments: ['double bass'], role: 'sideman', tracks: 'all' } },
      ],
    },
  ],
}

// ─── MODERATE — Bobby-like ────────────────────────────────────────────────
const BOBBY: RawMusician = {
  id: 'wikidata:Q379938',
  name: 'Bobby Timmons',
  aka: [],
  primary_instruments: ['piano'],
  all_instruments: ['piano'],
  birth_year: 1935,
  birth_date: '1935-12-19',
  birth_place: 'Philadelphia, Pennsylvania',
  death_year: 1974,
  years_active_start: 1956,
  years_active_end: 1974,
  nationality: 'United States',
  genres: ['hard bop', 'soul jazz'],
  picture_url: 'https://commons.example/bobby.jpg',
  picture_license: 'CC BY 2.0',
  picture_attribution: 'Brian McMillen',
  wikipedia_url: 'https://en.wikipedia.org/wiki/Bobby_Timmons',
  wikidata_id: 'Q379938',
  bio_summary: 'American jazz pianist and composer; a leading hard-bop voice.',
}

const MOANIN: RawRecord = {
  id: 'musicbrainz:rg-1958-moanin',
  title: "Moanin'",
  type: 'album',
  release_year: 1959,
  recording_year: 1958,
  label: 'Blue Note',
  catalog_number: 'BLP 4003',
  cover_art_url: 'https://commons.example/moanin.jpg',
  cover_art_license: 'Fair use',
}

const SF: RawRecord = {
  id: 'musicbrainz:rg-1959-sf',
  title: 'The Cannonball Adderley Quintet in San Francisco',
  release_year: 1959,
  label: 'Riverside',
}

export const MODERATE_DETAIL: RawDetailResult = {
  musician: BOBBY,
  records: [
    { record: MOANIN, edge: { instruments: ['piano'], role: 'sideman', tracks: 'all' } },
    { record: SF, edge: { instruments: ['piano'], role: 'sideman', tracks: 'all' } },
  ],
  collaborators: [
    {
      musician: {
        id: 'wikidata:Q310291',
        name: 'Art Blakey',
        primary_instruments: ['drums'],
        picture_url: 'https://commons.example/blakey.jpg',
        picture_license: 'CC BY-SA 4.0',
        picture_attribution: 'Roland Godefroy',
      },
      sharedRecords: [
        { record: MOANIN, edge: { instruments: ['drums'], role: 'leader', tracks: 'all' } },
      ],
    },
    {
      musician: {
        id: 'wikidata:Q151952',
        name: 'Cannonball Adderley',
        primary_instruments: ['alto saxophone'],
      },
      sharedRecords: [
        { record: SF, edge: { instruments: ['alto saxophone'], role: 'leader', tracks: 'all' } },
      ],
    },
  ],
}

// ─── SPARSE — Antoine-like + KNOWN DUPLICATE ──────────────────────────────
// Two distinct node ids share the same wikidata_id — a populator-owned data
// quality issue. The mapper renders BOTH faithfully (NO dedup, landmine 11);
// the BFF (Phase C) — not the mapper — logs the structured duplicate warning.
const ANTOINE_A: RawMusician = {
  id: 'wikidata:Q2856321',
  name: 'Antoine Hervé',
  primary_instruments: ['piano'],
  birth_year: 1959,
  nationality: 'France',
  wikidata_id: 'Q2856321',
  // no bio_summary, no picture_url → sparse + photo:false
}

const ANTOINE_B: RawMusician = {
  id: 'musicbrainz:antoine-herve-dupe',
  name: 'Antoine Hervé',
  primary_instruments: ['piano'],
  wikidata_id: 'Q2856321', // SAME external id, DIFFERENT node id → duplicate
}

const ONJ: RawRecord = {
  id: 'musicbrainz:rg-1989-onj',
  title: 'Orchestre National de Jazz 1989',
  release_year: 1989,
  label: 'Label Bleu',
  // no cover_art → no album caption
}

export const SPARSE_DETAIL: RawDetailResult = {
  musician: ANTOINE_A,
  records: [{ record: ONJ, edge: { instruments: ['piano'], role: 'leader' } }],
  collaborators: [
    {
      musician: {
        id: 'musicbrainz:stub-didier-lockwood',
        name: 'Didier Lockwood',
        primary_instruments: ['violin'],
      },
      sharedRecords: [
        { record: ONJ, edge: { instruments: ['violin'], role: 'sideman' } },
      ],
    },
  ],
}

/** The known duplicate, exposed so the mapper test can assert BOTH nodes are
 * rendered faithfully (no dedup) and the BFF can later detect the shared
 * external id. */
export const DUPLICATE_PAIR: [RawMusician, RawMusician] = [ANTOINE_A, ANTOINE_B]

// ─── Search-corpus + curated raw shapes ───────────────────────────────────
export const CORPUS_ROWS: RawMusician[] = [
  MILES,
  BOBBY,
  ANTOINE_A,
  ANTOINE_B, // duplicate kept faithfully in the corpus
]
