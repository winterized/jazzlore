// Regression: the widget v1.1 "blank screen" bug.
//
// Tapping the home-screen widget for a sparse "polished" musician (Lee Morse)
// opened the app to a BLANK screen after the splash. Root cause: the BFF
// returns a degenerate record with no `title`/`id` for such musicians, and
// AttribAlbum → spotifyRecordUrl(undefined,…) → term() did `undefined.trim()`
// → uncaught TypeError → (no ErrorBoundary) → the whole React tree unmounted.
//
// This test feeds MusicianPage Lee Morse's EXACT live BFF payload and asserts
// the page renders her instead of throwing. It deliberately does NOT wrap the
// page in the app ErrorBoundary, so it proves the PAGE itself no longer
// crashes — not that the crash is merely masked by the boundary.

import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import MusicianPage from './MusicianPage'
import type { DataSource } from '../hooks/useMusicianData'
import type { MusicianDetailWithEra } from '../hooks/useMusicianData'

const LEE_MORSE_ID = 'wikidata:Q3829380'

// Verbatim from `GET /api/musicians/wikidata%3AQ3829380` (2026-06-08): note the
// empty `collaborators` and the single title-less/id-less `records` entry.
const LEE_MORSE: MusicianDetailWithEra = {
  id: LEE_MORSE_ID,
  name: 'Lee Morse',
  aka: ['Lena Corinne "Lee" Morse', 'Lena Corinne Morse'],
  primaryInstruments: ['guitar', 'voice'],
  allInstruments: ['guitar', 'voice'],
  birthYear: 1897,
  deathYear: 1954,
  nationality: 'United States',
  genres: ['jazz'],
  era: 'Swing',
  bioSummary:
    'Lena Corinne "Lee" Morse was an American jazz and blues singer-songwriter, composer, guitarist, and actress.',
  portrait: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Leemorse_03.jpg',
    license: 'Public domain',
    attribution: 'Unknown author',
  },
  photo: true,
  links: { wikipediaUrl: 'https://en.wikipedia.org/wiki/Lee_Morse' },
  collaborators: [],
  // The malformed record that crashed the page (no id, no title).
  records: [
    { primaryArtist: 'Lee Morse', cover: {}, links: {} },
  ] as unknown as MusicianDetailWithEra['records'],
  sameEra: [],
}

function sourceFor(detail: MusicianDetailWithEra): DataSource {
  return {
    curated: vi.fn(),
    searchIndex: vi.fn(),
    graph: vi.fn(),
    polishedIds: vi.fn(),
    sharedRecords: vi.fn(async () => ({ records: [], totalCount: 0 })),
    detail: vi.fn(async () => detail),
    byIds: vi.fn(async () => ({ items: [] })),
  }
}

beforeEach(() => {
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: false,
    media: q,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    onchange: null,
    dispatchEvent: vi.fn(),
  }))
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('MusicianPage — sparse musician (widget blank-screen regression)', () => {
  it('renders Lee Morse instead of crashing to a blank page', async () => {
    render(
      <MemoryRouter initialEntries={[`/musicians/${LEE_MORSE_ID}`]}>
        <Routes>
          <Route
            path="/musicians/:id"
            element={<MusicianPage source={sourceFor(LEE_MORSE)} />}
          />
        </Routes>
      </MemoryRouter>,
    )
    // Her name renders in the detail heading → the detail view mounted
    // without throwing. (Query the heading specifically: the name also appears
    // in aria-labels / links, so a bare text query is ambiguous.)
    expect(
      await screen.findByRole('heading', { name: 'Lee Morse' }),
    ).toBeInTheDocument()
    // The title-less record is dropped, so "Records they shaped" never appears.
    await waitFor(() =>
      expect(screen.queryByText(/Records they shaped/i)).not.toBeInTheDocument(),
    )
  })
})
