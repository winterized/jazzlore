// D7 page-wiring: HomePage / MusicianPage must surface the calm WakingState
// screens when the mockable BFF seam yields the frozen 503 waking shape or a
// hard rejection — never the bare loading guard, never a dead end.

import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

// The H1 seam swap made `defaultSource` (real fetch) the app default that
// HomePage / MusicianPage call. Mock THAT to drive the calm D7 screens
// deterministically — no network, exercising the production default path.
vi.mock('../hooks/useMusicianData', async () => {
  const actual = await vi.importActual<
    typeof import('../hooks/useMusicianData')
  >('../hooks/useMusicianData')
  return {
    ...actual,
    defaultSource: {
      curated: vi.fn(),
      detail: vi.fn(),
      searchIndex: vi.fn(),
      graph: vi.fn(),
    },
  }
})

import { defaultSource } from '../hooks/useMusicianData'
import HomePage from './HomePage'
import MusicianPage from './MusicianPage'

const mocked = defaultSource as unknown as {
  curated: ReturnType<typeof vi.fn>
  detail: ReturnType<typeof vi.fn>
  searchIndex: ReturnType<typeof vi.fn>
  graph: ReturnType<typeof vi.fn>
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
  // HomePage also mounts <Autosuggest/>, whose corpus loader now defaults to
  // defaultSource.searchIndex() (this mock). Give it a benign resolved value
  // so the autosuggest effect never throws while we assert the D7 screens.
  mocked.searchIndex.mockResolvedValue({ corpus: [] })
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
  // Restore the default jsdom connectivity after the offline-routing test.
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: true })
})

function setOnLine(value: boolean): void {
  Object.defineProperty(navigator, 'onLine', { configurable: true, value })
}

describe('D7 page wiring', () => {
  it('HomePage shows the calm "waking" screen on a 503 waking response', async () => {
    mocked.curated.mockResolvedValue({ status: 'waking', retryAfter: 8 })
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )
    expect(
      await screen.findByRole('heading', { level: 1, name: /waking up/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText(/retry in 8s/i)).toBeInTheDocument()
  })

  it('HomePage shows the calm error screen on a hard rejection', async () => {
    mocked.curated.mockRejectedValue(new Error('network down'))
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )
    expect(
      await screen.findByRole('heading', { level: 1, name: /missed a beat/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('MusicianPage shows the waking screen on a 503 for the detail call', async () => {
    mocked.detail.mockResolvedValue({ status: 'waking', retryAfter: 5 })
    render(
      <MemoryRouter initialEntries={['/musicians/wikidata:Q93341']}>
        <Routes>
          <Route path="/musicians/:id" element={<MusicianPage />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(
      await screen.findByRole('heading', { level: 1, name: /waking up/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/retry in 5s/i)).toBeInTheDocument()
  })

  it('MusicianPage shows the OFFLINE screen when the detail call fails while offline', async () => {
    setOnLine(false)
    mocked.detail.mockRejectedValue(new TypeError('Failed to fetch'))
    render(
      <MemoryRouter initialEntries={['/musicians/wikidata:Q93341']}>
        <Routes>
          <Route path="/musicians/:id" element={<MusicianPage />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(
      await screen.findByRole('heading', { level: 1, name: /offline/i }),
    ).toBeInTheDocument()
    // Calm status + a Back affordance, NOT the hard-error "missed a beat" alert.
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: /missed a beat/i }),
    ).toBeNull()
  })

  it('MusicianPage shows the ERROR (not offline) screen when the server fails while online', async () => {
    setOnLine(true)
    mocked.detail.mockRejectedValue(new Error('bff 500 /api/musicians/x'))
    render(
      <MemoryRouter initialEntries={['/musicians/wikidata:Q93341']}>
        <Routes>
          <Route path="/musicians/:id" element={<MusicianPage />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(
      await screen.findByRole('heading', { level: 1, name: /missed a beat/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /offline/i })).toBeNull()
  })
})
