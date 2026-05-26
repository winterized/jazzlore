// Regression coverage for the URL canonicalization effect (PR #87).
//
// Before the fix in useBffResource, clicking a collaborator (a SPA nav
// that changes `:id`) caused the canonical-id useEffect in MusicianPage
// to observe STALE state (the previous musician's data) during the
// render that first sees the new url-id. The effect saw
// `state.data.id !== id`, called navigate(replace, oldId), and the URL
// ricocheted back to the previous page — making every collaborator and
// era-strip tap a no-op from the user's perspective.

import { render, screen, waitFor } from '@testing-library/react'
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import MusicianPage from './MusicianPage'
import { fixtureDetail } from '../test/fixtures'
import type { DataSource } from '../hooks/useMusicianData'

const FIRST = 'wikidata:Q93341'
const SECOND = 'wikidata:Q7346'

function makeSource(): DataSource {
  return {
    curated: vi.fn(),
    searchIndex: vi.fn(),
    graph: vi.fn(),
    polishedIds: vi.fn(),
    sharedRecords: vi.fn(async () => ({ records: [], totalCount: 0 })),
    // Echo the requested id back as the canonical id so the canonical-id
    // effect's normal "match → no-op" path holds whenever state is FRESH
    // for the current url-id. This isolates the regression: any
    // navigate(replace) observed during the test is the STALE-state bug.
    detail: vi.fn(async (id: string) => ({
      ...fixtureDetail(id),
      id,
      name: `Person ${id}`,
    })),
    // byIds powers the collaborator-portraits effect; resolve empty.
    byIds: vi.fn(async () => ({ items: [] })),
  }
}

function LocationProbe() {
  const loc = useLocation()
  return <div data-testid="loc-pathname">{loc.pathname}</div>
}

function NavTrigger() {
  const nav = useNavigate()
  return (
    <button
      type="button"
      data-testid="nav-trigger"
      onClick={() => nav(`/musicians/${SECOND}`)}
    >
      jump
    </button>
  )
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

describe('MusicianPage canonical-id effect', () => {
  it('SPA-navigating from one detail to another does NOT ricochet back to the previous id', async () => {
    const source = makeSource()

    render(
      <MemoryRouter initialEntries={[`/musicians/${FIRST}`]}>
        <LocationProbe />
        <NavTrigger />
        <Routes>
          <Route
            path="/musicians/:id"
            element={<MusicianPage source={source} />}
          />
        </Routes>
      </MemoryRouter>,
    )

    // Settle the first detail fetch.
    await screen.findAllByText(`Person ${FIRST}`, { exact: false })
    expect(screen.getByTestId('loc-pathname').textContent).toBe(
      `/musicians/${FIRST}`,
    )

    // Trigger an in-router navigation — same code path as ConnRow /
    // EraStrip / MosaicV4's `onActivate` handlers (all of which call
    // navigate(`/musicians/<id>`) for the collaborator's id).
    const { default: user } = await import('@testing-library/user-event')
    await user.setup().click(screen.getByTestId('nav-trigger'))

    // The second detail must render — and the URL must be SECOND, NOT
    // have been replaced back to FIRST by the stale canonical-id effect.
    await screen.findAllByText(`Person ${SECOND}`, { exact: false })
    expect(screen.getByTestId('loc-pathname').textContent).toBe(
      `/musicians/${SECOND}`,
    )
    // The fetch must have run for SECOND too (defends against a regression
    // where the URL is right but the underlying detail fetch wasn't fired).
    expect(source.detail).toHaveBeenCalledWith(SECOND)
  })

  it('still canonicalizes an alias URL to the resolved id (PR #87 behavior, unbroken)', async () => {
    // The whole reason MusicianPage.tsx has the canonical-id useEffect is
    // alias resolution: when a user lands on an alias id (e.g. an old
    // musicbrainz id that the BFF widens to its canonical wikidata id), we
    // replace the URL to the canonical form. Make sure the in-render
    // setState reset hasn't accidentally disabled that path.
    const ALIAS = 'musicbrainz:abc-alias'
    const CANONICAL = 'wikidata:Q132341'
    const source = makeSource()
    // Override detail: when asked for the alias, return the canonical id.
    ;(source.detail as ReturnType<typeof vi.fn>).mockImplementation(
      async (id: string) => ({
        ...fixtureDetail(id),
        id: id === ALIAS ? CANONICAL : id,
        name: id === ALIAS ? `Person ${CANONICAL}` : `Person ${id}`,
      }),
    )

    render(
      <MemoryRouter initialEntries={[`/musicians/${ALIAS}`]}>
        <LocationProbe />
        <Routes>
          <Route
            path="/musicians/:id"
            element={<MusicianPage source={source} />}
          />
        </Routes>
      </MemoryRouter>,
    )

    // Settle: page renders the canonical musician AND the URL has been
    // replaced to the canonical id. Wait on the URL change (which is the
    // *second* effect to fire — first the BFF resolves with `id:CANONICAL`,
    // then the canonical-id useEffect navigates(replace)), not on the
    // rendered text (which appears mid-flight while the URL is still ALIAS).
    await screen.findAllByText(`Person ${CANONICAL}`, { exact: false })
    await waitFor(() => {
      expect(screen.getByTestId('loc-pathname').textContent).toBe(
        `/musicians/${CANONICAL}`,
      )
    })
  })
})
