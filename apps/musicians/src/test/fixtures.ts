// Phase D fixtures — DOMAIN-shaped (the BFF response shapes), produced by
// running the FROZEN raw fixtures through the FROZEN mappers. This lets the
// mobile reader lane (D) proceed without the BFF lane (C): the data hook
// returns these shapes, identical to what `/api/musicians/:id` will return.
//
// We do NOT edit the frozen lib/fixtures.ts (raw rows). We compose richer
// scenarios here (rich = Miles-like, moderate = Bobby-like, sparse+duplicate
// = Antoine-like, plus a search corpus) on top of the frozen raw fixtures.

import type {
  CuratedCard,
  GraphData,
  MusicianDetail,
  SearchCorpusEntry,
} from '../lib/types'
import type { RawCollaboratorRow, RawDetailResult } from '../lib/fixtures'
import {
  MODERATE_DETAIL,
  RICH_DETAIL,
  SPARSE_DETAIL,
} from '../lib/fixtures'
import {
  mapGraphData,
  mapMusicianDetail,
  mapSearchCorpus,
} from '../lib/map'

// ─── RICH (Miles-like): expand the frozen RICH_DETAIL with enough
// collaborators (>16) so the "Show all N →" expansion CTA is exercised. ───
function extraCollab(i: number): RawCollaboratorRow {
  const names = [
    'Herbie Hancock',
    'Wayne Shorter',
    'Tony Williams',
    'Bill Evans',
    'Cannonball Adderley',
    'Red Garland',
    'Philly Joe Jones',
    'Gil Evans',
    'Jimmy Cobb',
    'Wynton Kelly',
    'George Coleman',
    'Sam Rivers',
    'Chick Corea',
    'Dave Holland',
    'Jack DeJohnette',
    'Keith Jarrett',
    'John McLaughlin',
    'Joe Zawinul',
  ]
  const name = names[i] ?? `Sideman ${i}`
  return {
    musician: {
      id: `wikidata:rich-${i}`,
      name,
      primary_instruments: [i % 2 === 0 ? 'piano' : 'saxophone'],
      ...(i % 3 === 0
        ? {
            picture_url: `https://commons.example/r${i}.jpg`,
            picture_license: 'CC BY-SA 4.0',
            picture_attribution: 'Wikimedia contributor',
          }
        : {}),
    },
    sharedRecords: [
      {
        record: {
          id: `musicbrainz:rich-rec-${i}`,
          title: `Session ${1960 + i}`,
          release_year: 1960 + i,
          label: 'Columbia',
        },
        edge: { instruments: ['piano'], role: 'sideman', tracks: 'all' },
      },
    ],
  }
}

const RICH_RAW: RawDetailResult = {
  ...RICH_DETAIL,
  collaborators: [
    ...RICH_DETAIL.collaborators,
    ...Array.from({ length: 18 }, (_, i) => extraCollab(i)),
  ],
}

export const RICH: MusicianDetail = mapMusicianDetail(RICH_RAW)
export const MODERATE: MusicianDetail = mapMusicianDetail(MODERATE_DETAIL)
export const SPARSE: MusicianDetail = mapMusicianDetail(SPARSE_DETAIL)

/** Antoine sparse node carries a duplicate twin (same wikidata id, distinct
 * node id) — surfaced so the detail page can show the user-facing duplicate
 * flag exactly as the design specifies. NOT a dedup (landmine 11): a UI
 * signal the page derives from BFF-supplied duplicate metadata. */
export const SPARSE_DUPLICATE_ID = 'musicbrainz:antoine-herve-dupe'

// ─── Search corpus (autosuggest). Includes an accent-folded name + the
// known duplicate, kept faithfully (landmine 11). ───
export const SEARCH_CORPUS: SearchCorpusEntry[] = [
  ...mapSearchCorpus([
    { id: RICH.id, name: RICH.name, primary_instruments: ['trumpet'] },
    { id: MODERATE.id, name: MODERATE.name, primary_instruments: ['piano'] },
    {
      id: SPARSE.id,
      name: SPARSE.name,
      primary_instruments: ['piano'],
    },
    {
      id: SPARSE_DUPLICATE_ID,
      name: 'Antoine Hervé',
      primary_instruments: ['piano'],
    },
    {
      id: 'wikidata:Q1339',
      name: 'Antônio Carlos Jobim',
      primary_instruments: ['piano'],
      aka: ['Tom Jobim'],
    },
    {
      id: 'wikidata:Q7346',
      name: 'John Coltrane',
      primary_instruments: ['tenor saxophone'],
    },
    {
      id: 'wikidata:Q310291',
      name: 'Art Blakey',
      primary_instruments: ['drums'],
    },
  ]),
]

// ─── Curated home list (12). Hand-written hooks; portrait/photo hydrated. ──
export const CURATED: CuratedCard[] = [
  {
    id: RICH.id,
    name: RICH.name,
    hook: 'The restless modernist who reinvented jazz five times over.',
    subtitle: 'Trumpet · Modal & cool',
    photo: RICH.photo,
    portrait: RICH.portrait,
  },
  {
    id: MODERATE.id,
    name: MODERATE.name,
    hook: 'Soul-jazz pianist who gave the Messengers their gospel pulse.',
    subtitle: 'Piano · Hard bop',
    photo: MODERATE.photo,
    portrait: MODERATE.portrait,
  },
  {
    id: 'wikidata:Q7346',
    name: 'John Coltrane',
    hook: 'A saxophone search for the sublime, sheet by sheet of sound.',
    subtitle: 'Tenor saxophone · Modal',
    photo: false,
    portrait: {},
  },
  {
    id: 'wikidata:Q310291',
    name: 'Art Blakey',
    hook: 'The drummer whose academy launched half of modern jazz.',
    subtitle: 'Drums · Hard bop',
    photo: false,
    portrait: {},
  },
  {
    id: 'wikidata:Q160058',
    name: 'Thelonious Monk',
    hook: 'Angular, percussive, and entirely his own grammar.',
    subtitle: 'Piano · Bebop',
    photo: false,
    portrait: {},
  },
  {
    id: 'wikidata:Q133069',
    name: 'Bill Evans',
    hook: 'Impressionist touch that taught the trio to breathe together.',
    subtitle: 'Piano · Modal',
    photo: false,
    portrait: {},
  },
  {
    id: 'wikidata:Q1339',
    name: 'Antônio Carlos Jobim',
    hook: 'The bossa nova architect who slowed the world down.',
    subtitle: 'Piano · Bossa nova',
    photo: false,
    portrait: {},
  },
  {
    id: 'wikidata:Q151952',
    name: 'Cannonball Adderley',
    hook: 'Alto joy with a soul-jazz grin a mile wide.',
    subtitle: 'Alto saxophone · Soul jazz',
    photo: false,
    portrait: {},
  },
  {
    id: 'wikidata:Q57451',
    name: 'Charles Mingus',
    hook: 'Bass-driven big-band fury, tender one bar later.',
    subtitle: 'Double bass · Post-bop',
    photo: false,
    portrait: {},
  },
  {
    id: 'wikidata:Q102301',
    name: 'Sonny Rollins',
    hook: 'The colossus who took the bridge and never came back the same.',
    subtitle: 'Tenor saxophone · Hard bop',
    photo: false,
    portrait: {},
  },
  {
    id: 'wikidata:Q193668',
    name: 'Wayne Shorter',
    hook: 'Composer-saxophonist who wrote in riddles and resolved in awe.',
    subtitle: 'Tenor saxophone · Post-bop',
    photo: false,
    portrait: {},
  },
  {
    id: 'wikidata:Q83321',
    name: 'Herbie Hancock',
    hook: 'Harmonic explorer equally at home in funk and the future.',
    subtitle: 'Piano · Fusion',
    photo: false,
    portrait: {},
  },
]

/** Detail-by-id lookup for the mock data hook. Unknown ids fall back to the
 * sparse fixture (the design's worst-case is still a complete screen). */
export function fixtureDetail(id: string): MusicianDetail {
  if (id === RICH.id) return RICH
  if (id === MODERATE.id) return MODERATE
  return SPARSE
}

// ─── Graph data (desktop graph panel). Built from the SAME raw detail
// results via the FROZEN mapGraphData, so the graph and the detail screen
// always describe one consistent collaboration neighbourhood (what
// `/api/musicians/:id/graph` will return post-mapper). ───
const RICH_GRAPH: GraphData = mapGraphData(RICH_RAW)
const MODERATE_GRAPH: GraphData = mapGraphData(MODERATE_DETAIL)
const SPARSE_GRAPH: GraphData = mapGraphData(SPARSE_DETAIL)

/** Graph-by-id lookup for the mock data hook (mirrors `fixtureDetail`:
 * unknown ids fall back to the sparse neighbourhood). */
export function fixtureGraph(id: string): GraphData {
  if (id === RICH.id) return RICH_GRAPH
  if (id === MODERATE.id) return MODERATE_GRAPH
  return SPARSE_GRAPH
}
