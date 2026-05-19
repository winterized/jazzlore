/**
 * Shared BFF route mock for the musicians e2e + a11y specs.
 *
 * The SPA now calls `/api/musicians/*` through the production `httpSource`
 * (the H1 seam swap). The Playwright/Vite dev server (port 5175) serves only
 * the SPA bundle — it has no `/api/*` — so these specs intercept `**\/api/**`
 * with `page.route` and return the FROZEN-shaped envelopes (rich = Miles,
 * sparse = Antoine, curated, search-index, graph, the 503 waking shape). The
 * fixture shapes ARE the frozen `/api/musicians/*` contract, so the journey
 * the SPA drives over these is the real fetch→parse→render path; only the
 * network hop is stubbed. Any UNMOCKED `/api/*` call fails loudly (HTTP 599)
 * so a future seam change forces these specs to be revisited.
 *
 * `httpSource.detail(id)` issues `encodeURIComponent(id)` so the wire id is
 * `wikidata%3AQ93341`; the matcher decodes the URL before testing so both the
 * encoded and the raw form resolve.
 */

import type { Page, Route } from '@playwright/test'

const RICH_DETAIL = {
  id: 'wikidata:Q93341',
  name: 'Miles Davis',
  aka: ['Miles Dewey Davis III'],
  primaryInstruments: ['trumpet'],
  allInstruments: ['trumpet', 'flugelhorn'],
  birthYear: 1926,
  deathYear: 1991,
  genres: ['cool jazz', 'modal jazz'],
  bioSummary:
    'American trumpeter, bandleader and composer who was among the most influential figures in jazz. He shaped cool jazz, modal jazz and jazz fusion.',
  portrait: {
    url: 'https://commons.example/miles.jpg',
    license: 'CC BY-SA 3.0',
    attribution: 'Tom Palumbo',
  },
  photo: true,
  links: { wikidataId: 'Q93341' },
  collaborators: [
    {
      id: 'wikidata:Q7346',
      name: 'John Coltrane',
      instrument: 'tenor saxophone',
      sharedRecordCount: 2,
      topRecord: { title: 'Kind of Blue', year: 1959 },
      photo: true,
    },
  ],
  records: [
    {
      id: 'musicbrainz:rg-1959-kob',
      title: 'Kind of Blue',
      type: 'album' as const,
      releaseYear: 1959,
      label: 'Columbia',
      cover: {
        url: 'https://commons.example/kob.jpg',
        license: 'Fair use',
        attribution: '',
      },
      links: {},
    },
  ],
}

const SPARSE_DETAIL = {
  id: 'wikidata:Q2856321',
  name: 'Antoine Hervé',
  aka: [],
  primaryInstruments: ['piano'],
  allInstruments: [],
  birthYear: 1959,
  genres: [],
  portrait: {},
  photo: false,
  links: { wikidataId: 'Q2856321' },
  collaborators: [
    {
      id: 'musicbrainz:stub-didier-lockwood',
      name: 'Didier Lockwood',
      instrument: 'violin',
      sharedRecordCount: 1,
      photo: false,
    },
  ],
  records: [
    {
      id: 'musicbrainz:rg-1989-onj',
      title: 'Orchestre National de Jazz 1989',
      releaseYear: 1989,
      label: 'Label Bleu',
      cover: {},
      links: {},
    },
  ],
}

const WAKING_503 = { status: 'waking', retryAfter: 8 }

function graphFor(detail: typeof RICH_DETAIL | typeof SPARSE_DETAIL) {
  const focus = {
    id: detail.id,
    name: detail.name,
    recordCount: detail.records.length,
    focus: true,
  }
  const peers = detail.collaborators.map((c) => ({
    id: c.id,
    name: c.name,
    instrument: c.instrument,
    recordCount: c.sharedRecordCount,
    focus: false,
  }))
  const edges = detail.collaborators.map((c) => ({
    source: detail.id,
    target: c.id,
    weight: c.sharedRecordCount,
  }))
  return { graph: { nodes: [focus, ...peers], edges } }
}

/**
 * A 3×3 solid-blue PNG (deterministic, non-greyscale). The Phase-H hero
 * portrait <img>s point at the non-resolvable `commons.example` host; this
 * lets the e2e serve a REAL bitmap so the duotone treatment actually paints
 * (a sampled pixel is the blue/duotone-tinted image, never the monogram
 * gradient) and the `onError`→monogram fallback is not spuriously triggered.
 */
const BLUE_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAMAAAADCAYAAABWKLW/AAAAFklEQVR4nGNkYPjPgAcw4ZMc' +
    'VTAcFAAA6QAGGA9YJgAAAABJRU5ErkJggg==',
  'base64',
)

/**
 * Install the BFF guard. Returns the correctly-shaped frozen fixture for
 * every `/api/musicians/*` endpoint the SPA calls; fails loudly on any
 * unmocked `/api/*` (the seam changed → these specs must be revisited).
 * Also serves a real bitmap for the Phase-H portrait host so the hero
 * photos genuinely paint in-browser.
 */
export async function mockBff(page: Page): Promise<void> {
  await page.route('**/commons.example/**', (route: Route) =>
    route.fulfill({ contentType: 'image/png', body: BLUE_PNG }),
  )
  await page.route('**/api/**', async (route: Route) => {
    // `httpSource` percent-encodes the id (`:` → `%3A`); decode so the raw
    // and encoded forms both match.
    const url = decodeURIComponent(route.request().url())

    if (url.includes('/api/musicians/curated')) {
      return route.fulfill({
        json: {
          curated: [
            {
              // A CC-licensed portrait → the card paints a real duotone
              // photo AND the LEGAL credit must render (Phase H).
              id: RICH_DETAIL.id,
              name: RICH_DETAIL.name,
              hook: 'The restless modernist.',
              photo: true,
              portrait: RICH_DETAIL.portrait,
            },
            {
              // No portrait → graceful monogram, no credit (the legal
              // rule's inverse: nothing to attribute).
              id: SPARSE_DETAIL.id,
              name: SPARSE_DETAIL.name,
              hook: 'A quieter corner of the graph.',
              photo: false,
              portrait: {},
            },
          ],
        },
      })
    }
    if (url.includes('/api/musicians/search-index')) {
      return route.fulfill({
        json: {
          corpus: [
            { id: RICH_DETAIL.id, name: 'Miles Davis', aka: [] },
            { id: SPARSE_DETAIL.id, name: 'Antoine Hervé', aka: [] },
          ],
        },
      })
    }
    if (url.includes(`/api/musicians/${RICH_DETAIL.id}/graph`)) {
      return route.fulfill({ json: graphFor(RICH_DETAIL) })
    }
    if (url.includes(`/api/musicians/${SPARSE_DETAIL.id}/graph`)) {
      return route.fulfill({ json: graphFor(SPARSE_DETAIL) })
    }
    if (url.includes('/graph')) {
      // Any other focus id (e.g. a re-centre onto Coltrane) → a minimal
      // self-only neighbourhood so the graph still renders + re-centres.
      const m = url.match(/\/api\/musicians\/([^/]+)\/graph/)
      const id = m && m[1] ? m[1] : 'unknown'
      return route.fulfill({
        json: {
          graph: {
            nodes: [{ id, name: id, recordCount: 1, focus: true }],
            edges: [],
          },
        },
      })
    }
    if (url.includes(`/api/musicians/${SPARSE_DETAIL.id}`)) {
      return route.fulfill({ json: SPARSE_DETAIL })
    }
    if (url.includes(`/api/musicians/${RICH_DETAIL.id}`)) {
      return route.fulfill({ json: RICH_DETAIL })
    }
    if (url.includes('/__waking')) {
      return route.fulfill({ status: 503, json: WAKING_503 })
    }
    // Any other detail id → the sparse screen (a complete screen for an
    // un-fixtured id, matching the fixture source's worst-case fallback).
    if (/\/api\/musicians\/[^/]+$/.test(url)) {
      return route.fulfill({ json: SPARSE_DETAIL })
    }
    // Unmocked /api/* call — fail loudly: the data seam changed and these
    // specs (and the launch-readiness assumptions) must be revisited.
    return route.fulfill({
      status: 599,
      body: `Unmocked BFF call in e2e: ${url}`,
    })
  })
}
