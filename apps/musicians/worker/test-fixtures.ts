// Synthetic Aura HTTP Query API v2 payloads for the Phase C worker tests.
//
// Hand-written here (NOT importing the FROZEN src/lib/fixtures.ts) so the BFF
// tests own their own Aura-shaped inputs. Shape mirrors the documented v2
// response `{ data: { fields, values } }` (Context7-confirmed). A mocked
// `fetch` returns these; the worker reshapes them into the frozen raw shapes
// then maps via the frozen pure mappers.

/** Build a mock `fetch` that returns `body` as JSON with `status`. */
export function mockFetchJson(
  body: unknown,
  status = 200,
): typeof fetch {
  return (async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })) as unknown as typeof fetch
}

/** A mock `fetch` that never resolves before the AbortSignal fires (cold
 * Aura). Rejects with an AbortError when aborted, like the real runtime. */
export function mockFetchHang(): typeof fetch {
  return ((_url: string, init?: RequestInit) =>
    new Promise((_resolve, reject) => {
      const signal = init?.signal
      if (signal) {
        signal.addEventListener('abort', () => {
          reject(
            Object.assign(new Error('aborted'), { name: 'AbortError' }),
          )
        })
      }
    })) as unknown as typeof fetch
}

export const HEALTH_OK = {
  data: { fields: ['n'], values: [[1234]] },
}

export const CYPHER_ERROR = {
  errors: [{ code: 'Neo.ClientError.Statement.SyntaxError', message: 'bad' }],
}

// One detail row: focus Miles, 2 records, 2 collaborators (one shares 2
// records → weight 2). Mirrors detailCypher's RETURN m, records, collaborators.
const MILES = {
  id: 'wikidata:Q93341',
  name: 'Miles Davis',
  primary_instruments: ['trumpet'],
  genres: ['cool jazz', 'modal jazz'],
  years_active_start: 1944,
  picture_url: 'https://commons.example/miles.jpg',
  picture_license: 'CC BY-SA 3.0',
  picture_attribution: 'Tom Palumbo',
  bio_summary: 'American trumpeter and bandleader.',
  wikidata_id: 'Q93341',
}
const KOB = {
  id: 'musicbrainz:rg-kob',
  title: 'Kind of Blue',
  type: 'album',
  release_year: 1959,
  label: 'Columbia',
}
const RAM = {
  id: 'musicbrainz:rg-ram',
  title: "'Round About Midnight",
  type: 'album',
  release_year: 1957,
  label: 'Columbia',
}

export const DETAIL_MILES = {
  data: {
    fields: ['m', 'records', 'collaborators'],
    values: [
      [
        MILES,
        [
          { record: KOB, edge: { role: 'leader', instruments: ['trumpet'], tracks: 'all' } },
          { record: RAM, edge: { role: 'leader', instruments: ['trumpet'], tracks: 'all' } },
        ],
        [
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
              { record: KOB, edge: { role: 'sideman', tracks: 'all' } },
              { record: RAM, edge: { role: 'sideman', tracks: [1, 2] } },
            ],
          },
          {
            musician: {
              id: 'wikidata:Q1339',
              name: 'Ron Carter',
              primary_instruments: ['double bass'],
            },
            sharedRecords: [
              { record: KOB, edge: { role: 'sideman', tracks: 'all' } },
            ],
          },
        ],
      ],
    ],
  },
}

export const DETAIL_NOT_FOUND = {
  data: { fields: ['m', 'records', 'collaborators'], values: [] },
}

// Search corpus incl. the known Antoine Hervé double-node (same wikidata_id,
// distinct node ids) → exactly one duplicate group, rendered faithfully.
export const SEARCH_INDEX = {
  data: {
    fields: ['m'],
    values: [
      [MILES],
      [
        {
          id: 'wikidata:Q379938',
          name: 'Bobby Timmons',
          aka: [],
          primary_instruments: ['piano'],
          wikidata_id: 'Q379938',
        },
      ],
      [
        {
          id: 'wikidata:Q2856321',
          name: 'Antoine Hervé',
          primary_instruments: ['piano'],
          wikidata_id: 'Q2856321',
        },
      ],
      [
        {
          id: 'musicbrainz:antoine-herve-dupe',
          name: 'Antoine Hervé',
          primary_instruments: ['piano'],
          wikidata_id: 'Q2856321',
        },
      ],
    ],
  },
}

// Curated hydration: only 2 of the picked ids exist in Neo4j (Miles, Bobby);
// the rest are unresolved → faithfully dropped (reconcile in Phase 0).
export const CURATED_PARTIAL = {
  data: {
    fields: ['m'],
    values: [
      [MILES],
      [
        {
          id: 'wikidata:Q379938',
          name: 'Bobby Timmons',
          primary_instruments: ['piano'],
          picture_url: 'https://commons.example/bobby.jpg',
          picture_license: 'CC BY 2.0',
          picture_attribution: 'Brian McMillen',
          genres: ['hard bop'],
        },
      ],
    ],
  },
}
