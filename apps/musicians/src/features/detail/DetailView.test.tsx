import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MODERATE, RICH, SPARSE } from '../../test/fixtures'
import { fixtureSource, type DataSource } from '../../hooks/useMusicianData'
import { DetailView } from './DetailView'

function setup(detail = MODERATE, opts: { duplicate?: boolean } = {}) {
  return render(
    <MemoryRouter>
      <DetailView
        detail={detail}
        duplicate={opts.duplicate ?? false}
        source={fixtureSource}
      />
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

  it('tier 3 — no track + no artist URL → disambiguated search URL (`<name> jazz`)', () => {
    // MODERATE's id is `wikidata:Q379938` (a non-curated fictional fixture
    // id for unit purposes), and its `links` has no spotify/apple artist
    // URLs. So both services land in tier 3 — the disambiguated search.
    // The `jazz` suffix is the namesake guard for common-name sidemen
    // (Paul Chambers, George Lewis, Sam Jones). The anchor's accessible
    // name comes from its aria-label.
    setup()
    const listen = screen.getByRole('region', {
      name: /listen to bobby timmons/i,
    })
    const spotify = within(listen).getByRole('link', {
      name: /listen to bobby timmons on spotify/i,
    })
    const apple = within(listen).getByRole('link', {
      name: /listen to bobby timmons on apple music/i,
    })
    expect(spotify).toHaveAttribute(
      'href',
      'https://open.spotify.com/search/Bobby%20Timmons%20jazz',
    )
    expect(apple).toHaveAttribute(
      'href',
      'https://music.apple.com/search?term=Bobby%20Timmons%20jazz',
    )
    // No editorial track-title caption when not tier 1.
    expect(document.querySelector('.listen-track')).toBeNull()
  })

  it('tier 2 — artist URL on links → deep-link to artist page (no caption)', () => {
    // Non-tier-1 fixture id; the musician has artist-page URLs on its
    // `links` (populator-supplied via MB URL relationships in real data).
    // Per-service tier resolution: Spotify has an artist URL → tier 2;
    // Apple has none → tier 3 with the `jazz` disambiguator. Aria-labels
    // stay generic at tier 2/3 — never imply a specific track.
    const tier2 = {
      ...MODERATE,
      links: {
        ...MODERATE.links,
        spotifyArtistUrl: 'https://open.spotify.com/artist/0M1UOBJZ9tcKJbrbnVlHZG',
      },
    }
    setup(tier2)
    const listen = screen.getByRole('region', {
      name: /listen to bobby timmons/i,
    })
    const spotify = within(listen).getByRole('link', {
      name: /listen to bobby timmons on spotify/i,
    })
    const apple = within(listen).getByRole('link', {
      name: /listen to bobby timmons on apple music/i,
    })
    expect(spotify).toHaveAttribute(
      'href',
      'https://open.spotify.com/artist/0M1UOBJZ9tcKJbrbnVlHZG',
    )
    // Apple has no artist URL on this fixture → drops to tier 3.
    expect(apple).toHaveAttribute(
      'href',
      'https://music.apple.com/search?term=Bobby%20Timmons%20jazz',
    )
    expect(document.querySelector('.listen-track')).toBeNull()
  })

  it('tier 1 — LISTEN_EXTRAS hit (John Lewis @ wikidata:Q353943) → track deep-link', () => {
    // John Lewis is the canonical tier-1 LISTEN_EXTRAS case — a hand-picked
    // track URL but NOT one of the 12 home-grid curated picks. Verifies
    // that the resolver merges CURATED + LISTEN_EXTRAS into one tier-1 map.
    const { container } = setup({
      ...MODERATE,
      id: 'wikidata:Q353943',
      name: 'John Lewis',
    })
    const listen = screen.getByRole('region', { name: /listen to john lewis/i })
    const spotify = within(listen).getByRole('link', {
      name: /listen to the bad and the beautiful on spotify/i,
    })
    expect(spotify).toHaveAttribute(
      'href',
      'https://open.spotify.com/track/4THfJ8Tx9uuFoTjPupXrqE',
    )
    const trackCaption = container.querySelector('.listen-track')
    expect(trackCaption?.textContent).toContain('The Bad and the Beautiful')
  })

  it('tier 1 — curated musician (Bobby Timmons @ wikidata:Q132341) → Listen buttons deep-link to the signature track', () => {
    // Override only the id — name/bio stay from the MODERATE fixture so
    // the rest of the page renders identically; the curated-12 lookup is
    // by id, and Bobby's canonical curated id is wikidata:Q132341 with a
    // hand-picked listen block (his own "Moanin'" on his Riverside debut,
    // not the Blakey/Messengers version).
    const { container } = setup({ ...MODERATE, id: 'wikidata:Q132341' })
    const listen = screen.getByRole('region', {
      name: /listen to bobby timmons/i,
    })
    const spotify = within(listen).getByRole('link', {
      name: /listen to moanin' on spotify/i,
    })
    const apple = within(listen).getByRole('link', {
      name: /listen to moanin' on apple music/i,
    })
    expect(spotify).toHaveAttribute(
      'href',
      'https://open.spotify.com/track/5U66z6J7VpEA9XV9BpePwh',
    )
    expect(apple).toHaveAttribute(
      'href',
      'https://music.apple.com/us/song/moanin/898527528',
    )
    // Editorial provenance line: track title (italic) · source record.
    // Query by class — "Moanin'" also appears in the records strip
    // (Bobby played on the Blakey/Messengers album of the same name),
    // so a bare getByText would match two elements.
    const trackCaption = container.querySelector('.listen-track')
    expect(trackCaption).not.toBeNull()
    expect(trackCaption?.textContent).toContain("Moanin'")
    expect(trackCaption?.textContent).toContain(
      'This Here Is Bobby Timmons (1960)',
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

describe('DetailView — collaborator portraits via byIds', () => {
  it('mosaic and ConnRow render <img> once byIds resolves with portrait data', async () => {
    // Build a source that returns portrait data for the first collaborator.
    const firstCollab = RICH.collaborators[0]!
    const portraitUrl = 'https://example.test/collab-portrait.jpg'

    const sourceWithPortraits: DataSource = {
      ...fixtureSource,
      byIds: async () => ({
        items: [
          {
            id: firstCollab.id,
            name: firstCollab.name,
            photo: true,
            portrait: {
              url: portraitUrl,
              license: 'CC BY-SA 3.0',
              attribution: 'Test Photographer',
            },
            primaryInstrument: firstCollab.instrument,
          },
        ],
      }),
    }

    render(
      <MemoryRouter>
        <DetailView detail={RICH} source={sourceWithPortraits} />
      </MemoryRouter>,
    )

    // After byIds resolves, the mosaic tile and the ConnRow for the first
    // collaborator should both render an <img> with the portrait URL.
    await waitFor(() => {
      // At least one <img> with the portrait URL must appear (mosaic or rail).
      const imgs = screen.getAllByRole('img')
      const portraitImgs = imgs.filter(
        (img) => img.getAttribute('src') === portraitUrl,
      )
      expect(portraitImgs.length).toBeGreaterThan(0)
    })
  })

  it('caps the byIds request at 16 ids (must stay ≤ BY_IDS_CAP=20 in the worker)', async () => {
    // Regression guard for PR #54: the initial implementation sliced 24
    // collaborator ids and sent them to /api/musicians/by-ids, which the
    // worker rejects with HTTP 400 'too-many-ids' (BY_IDS_CAP=20). The
    // detail page rendered ZERO portraits on prod for any musician with
    // >20 collaborators. Fix: cap at 16 (max of MosaicV4 TILE_CAP=14 +
    // CollaboratorRail HEADLINER_CAP=16). RICH fixture has 21 collabs.
    let captured: string[] | null = null
    const recordingSource: DataSource = {
      ...fixtureSource,
      byIds: async (ids) => {
        captured = ids
        return { items: [] }
      },
    }

    render(
      <MemoryRouter>
        <DetailView detail={RICH} source={recordingSource} />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(captured).not.toBeNull()
    })
    expect(captured!.length).toBeLessThanOrEqual(16)
    expect(captured!.length).toBe(Math.min(RICH.collaborators.length, 16))
    // No duplicates either.
    expect(new Set(captured!).size).toBe(captured!.length)
  })

  it('keeps monogram fallback (no collab portrait imgs) when byIds rejects', async () => {
    // Use SPARSE (Antoine — photo:false, no portrait) so the identity hero
    // emits zero <img> elements. If byIds fails, collaborator tiles also
    // emit zero <img> elements → total remains 0.
    const failingSource: DataSource = {
      ...fixtureSource,
      byIds: async () => {
        throw new Error('byIds failed')
      },
    }

    render(
      <MemoryRouter>
        <DetailView detail={SPARSE} source={failingSource} />
      </MemoryRouter>,
    )

    // Give the failure a tick to settle, then confirm the page renders fine.
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: /antoine herv/i }),
      ).toBeInTheDocument()
    })

    // SPARSE has no portrait (photo:false) and byIds failed → zero <img>.
    expect(screen.queryAllByRole('img')).toHaveLength(0)
  })
})
