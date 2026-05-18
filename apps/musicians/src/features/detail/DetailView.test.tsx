import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MODERATE, RICH, SPARSE } from '../../test/fixtures'
import { DetailView } from './DetailView'

function setup(detail = MODERATE, opts: { duplicate?: boolean } = {}) {
  return render(
    <MemoryRouter>
      <DetailView detail={detail} duplicate={opts.duplicate ?? false} />
    </MemoryRouter>,
  )
}

describe('DetailView — identity / bio / listen', () => {
  it('renders the identity strip with name + instrument line', () => {
    setup()
    expect(
      screen.getByRole('heading', { level: 1, name: /Bobby Timmons/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/piano/i)).toBeInTheDocument()
  })

  it('renders the bio + a "More about" disclosure link to #about', () => {
    setup()
    expect(screen.getByText(/leading hard-bop voice/i)).toBeInTheDocument()
    const more = screen.getByRole('link', { name: /more about bobby/i })
    expect(more).toHaveAttribute('href', '#about')
  })

  it('renders Spotify + Apple deep-links from the frozen links builder', () => {
    setup()
    const listen = screen.getByRole('region', {
      name: /listen to bobby timmons/i,
    })
    const spotify = within(listen).getByRole('link', {
      name: /listen on spotify/i,
    })
    const apple = within(listen).getByRole('link', { name: /apple music/i })
    expect(spotify).toHaveAttribute(
      'href',
      'https://open.spotify.com/search/Bobby%20Timmons',
    )
    expect(apple).toHaveAttribute(
      'href',
      'https://music.apple.com/search?term=Bobby%20Timmons',
    )
  })

  it('renders the orbit mosaic and the records strip', () => {
    setup()
    expect(screen.getByRole('group', { name: /orbit/i })).toBeInTheDocument()
    expect(screen.getByText(/records they shaped/i)).toBeInTheDocument()
  })
})

describe('DetailView — headliners + expansion CTA (total > 16)', () => {
  it('caps headliners at 16 and shows the expansion CTA only when total > 16', () => {
    setup(RICH)
    // RICH fixture has 3 + 18 = 21 collaborators.
    const rail = screen.getByRole('list', { name: /where to go from here/i })
    const rows = within(rail).getAllByRole('link', { name: /records?/i })
    // 16 headliner rows (each ConnRow is role=link with a "records" label).
    const headliners = rows.filter((r) =>
      /\d+ records?/.test(r.getAttribute('aria-label') ?? ''),
    )
    expect(headliners).toHaveLength(16)
    expect(
      screen.getByRole('button', { name: /show all 21 collaborators/i }),
    ).toBeInTheDocument()
  })

  it('does NOT show the CTA when total ≤ 16 (Bobby-like)', () => {
    setup(MODERATE)
    expect(screen.queryByRole('button', { name: /show all/i })).toBeNull()
  })

  it('expands inline on CTA tap: CTA hidden, tail-marker shown, long tail rendered', async () => {
    setup(RICH)
    await userEvent.setup().click(
      screen.getByRole('button', { name: /show all 21 collaborators/i }),
    )
    expect(screen.queryByRole('button', { name: /show all/i })).toBeNull()
    expect(screen.getByText(/the rest/i)).toBeInTheDocument()
    const rail = screen.getByRole('list', { name: /where to go from here/i })
    const allRows = within(rail).getAllByRole('link', {
      name: /\d+ records?/i,
    })
    expect(allRows).toHaveLength(21)
  })
})

describe('DetailView — sparse variant + duplicate flag', () => {
  it('shows a "bio not yet written" placeholder when there is no bio', () => {
    setup(SPARSE)
    expect(screen.getByText(/bio not yet written/i)).toBeInTheDocument()
  })

  it('renders initials (no portrait) for sparse musicians — never silent', () => {
    setup(SPARSE)
    // Antoine Hervé → AH initials on the identity tile.
    expect(screen.getAllByText('AH').length).toBeGreaterThan(0)
  })

  it('shows the user-facing duplicate flag when flagged (Antoine design)', () => {
    setup(SPARSE, { duplicate: true })
    expect(screen.getByText(/possible duplicate/i)).toBeInTheDocument()
  })

  it('does NOT show the duplicate flag when not flagged', () => {
    setup(SPARSE, { duplicate: false })
    expect(screen.queryByText(/possible duplicate/i)).toBeNull()
  })

  it('renders an empty-state line when there are no collaborators', () => {
    setup({ ...SPARSE, collaborators: [] })
    expect(screen.getByText(/no collaborators on file/i)).toBeInTheDocument()
  })
})

describe('DetailView — "More about" #about sheet', () => {
  it('opens the sheet when the route hash is #about (link-addressable)', () => {
    render(
      <MemoryRouter initialEntries={['/musicians/x#about']}>
        <DetailView detail={MODERATE} />
      </MemoryRouter>,
    )
    expect(
      screen.getByRole('dialog', { name: /more about bobby timmons/i }),
    ).toBeInTheDocument()
  })

  it('does not render the sheet without the #about hash', () => {
    setup(MODERATE)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('the bio "More about" link targets #about', () => {
    setup(MODERATE)
    expect(screen.getByRole('link', { name: /more about bobby/i })).toHaveAttribute(
      'href',
      '#about',
    )
  })

  // Decision 3 / Highest-risk #3: the open sheet is link-addressable. A
  // direct/bookmarked/reloaded `…#about` has NO in-app history entry to
  // pop — closing must land back on its OWN detail page, never navigate
  // away (the old unconditional navigate(-1) bug popped off the detail
  // route entirely).
  it('deep-linked #about: closing stays on the detail page, not a pop away', async () => {
    render(
      <MemoryRouter initialEntries={['/musicians/x#about']}>
        <Routes>
          <Route path="/musicians/:id" element={<DetailView detail={MODERATE} />} />
          <Route path="*" element={<div>OFF THE DETAIL PAGE</div>} />
        </Routes>
      </MemoryRouter>,
    )
    expect(
      screen.getByRole('dialog', { name: /more about bobby timmons/i }),
    ).toBeInTheDocument()
    await userEvent.setup().click(
      screen.getByRole('button', { name: /close — more about/i }),
    )
    // Sheet closed (hash dropped) and we are STILL on the detail route.
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.queryByText('OFF THE DETAIL PAGE')).toBeNull()
    expect(
      screen.getByRole('heading', { level: 1, name: /bobby timmons/i }),
    ).toBeInTheDocument()
  })

  it('in-app open: closing pops history back to the pushed-from entry', async () => {
    // Models the in-app `<a href="#about">` push: a prior entry exists, so
    // location.key is NOT 'default' and close must navigate(-1) to keep
    // browser-Back and in-app-close symmetric (Decision 3).
    render(
      <MemoryRouter
        initialEntries={['/musicians/x', '/musicians/x#about']}
        initialIndex={1}
      >
        <Routes>
          <Route
            path="/musicians/:id"
            element={<DetailView detail={MODERATE} />}
          />
          <Route path="*" element={<div>OFF THE DETAIL PAGE</div>} />
        </Routes>
      </MemoryRouter>,
    )
    expect(
      screen.getByRole('dialog', { name: /more about bobby timmons/i }),
    ).toBeInTheDocument()
    await userEvent.setup().click(
      screen.getByRole('button', { name: /close — more about/i }),
    )
    // Popped back to the hash-less detail entry: sheet gone, still on detail.
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.queryByText('OFF THE DETAIL PAGE')).toBeNull()
    expect(
      screen.getByRole('heading', { level: 1, name: /bobby timmons/i }),
    ).toBeInTheDocument()
  })
})

describe('DetailView — desktop graph panel (lazy, ≥1024px only)', () => {
  function stubDesktop(matches: boolean) {
    vi.stubGlobal('matchMedia', (q: string) => ({
      // The hook queries (min-width: 1024px); reduced-motion stays false.
      matches: q.includes('min-width') ? matches : false,
      media: q,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    }))
  }
  afterEach(() => vi.unstubAllGlobals())

  it('does NOT mount the graph (nor its heavy chunk) on mobile', () => {
    stubDesktop(false)
    setup(MODERATE)
    expect(
      screen.queryByRole('complementary', { name: /collaboration graph/i }),
    ).toBeNull()
  })

  it('mounts the lazy GraphView in a complementary region on desktop', async () => {
    stubDesktop(true)
    setup(RICH)
    const aside = screen.getByRole('complementary', {
      name: /collaboration graph for miles davis/i,
    })
    expect(aside).toBeInTheDocument()
    // The lazy graph chunk + fixture graph resolve into the real app region.
    await waitFor(() =>
      expect(within(aside).getByRole('application')).toHaveAttribute(
        'aria-label',
        expect.stringContaining('Miles Davis'),
      ),
    )
  })
})
