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

  it('primary Apple Music surface is the official "Listen on Apple Music" badge', () => {
    // Phase 2 (brand compliance): the custom outlined "Apple Music" button is
    // replaced by Apple's fixed badge artwork, embedded verbatim as an <img>.
    // The badge wording is decorative (alt="") so the anchor's tiered
    // aria-label remains the single, honest accessible name — no double-read.
    setup()
    const listen = screen.getByRole('region', { name: /listen to bobby timmons/i })
    const apple = within(listen).getByRole('link', {
      name: /listen to bobby timmons on apple music/i,
    })
    const badge = apple.querySelector('img')
    expect(badge).not.toBeNull()
    expect(badge).toHaveAttribute(
      'src',
      expect.stringContaining('US-UK_Apple_Music_Listen_on_Badge'),
    )
    // Decorative: empty alt + aria-hidden so the badge text isn't announced
    // on top of the anchor's aria-label.
    expect(badge).toHaveAttribute('alt', '')
    expect(badge).toHaveAttribute('aria-hidden', 'true')
    // The old custom-button text is gone.
    expect(within(apple).queryByText(/^Apple Music$/)).toBeNull()
  })

  it('renders the Apple Music badge BEFORE the Spotify button per Identity Guidelines §1.3', () => {
    // .listen is a flex row, so DOM order = visual left→right. Apple Music must
    // lead when shown alongside another music service. Pin the order so a
    // future edit can't silently re-swap them.
    setup()
    const listen = screen.getByRole('region', { name: /listen to bobby timmons/i })
    const apple = within(listen).getByRole('link', {
      name: /on apple music/i,
    })
    const spotify = within(listen).getByRole('link', { name: /on spotify/i })
    expect(
      apple.compareDocumentPosition(spotify) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('primary Spotify button keeps its amber styling but uses the official mark', () => {
    // Phase 2 (brand compliance): the hand-drawn SpotifyIcon is replaced by
    // the official Spotify mark, rendered as a CSS-masked span (.spfy-mark)
    // so it inherits the button's text colour. The amber .btn styling + the
    // "Listen on Spotify" text are deliberately unchanged.
    setup()
    const listen = screen.getByRole('region', { name: /listen to bobby timmons/i })
    const spotify = within(listen).getByRole('link', {
      name: /listen to bobby timmons on spotify/i,
    })
    expect(spotify).toHaveClass('btn')
    expect(spotify).not.toHaveClass('alt')
    expect(spotify).toHaveTextContent(/Listen on Spotify/)
    expect(spotify.querySelector('.spfy-mark')).not.toBeNull()
    // The decorative mark must not carry an accessible name (anchor owns it).
    expect(spotify.querySelector('.spfy-mark')).toHaveAttribute('aria-hidden', 'true')
  })

  it('tier 3 — no track + no artist URL → plain-name search URL', () => {
    // MODERATE's id is `wikidata:Q379938` (a non-curated fictional fixture
    // id for unit purposes), and its `links` has no spotify/apple artist
    // URLs. So both services land in tier 3 — the plain-name search.
    // Apple Music's strict multi-term matching zeroes out catalogs that
    // don't tag the qualifier (on-device 2026-05-27); the namesake hazard
    // on common-name sidemen is accepted as a trade-off.
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
      'https://open.spotify.com/search/Bobby%20Timmons',
    )
    expect(apple).toHaveAttribute(
      'href',
      'https://music.apple.com/search?term=Bobby%20Timmons',
    )
    // No editorial track-title caption when not tier 1.
    expect(document.querySelector('.listen-track')).toBeNull()
  })

  it('tier 2 — artist URL on links → deep-link to artist page (no caption)', () => {
    // Non-tier-1 fixture id; the musician has artist-page URLs on its
    // `links` (populator-supplied via MB URL relationships in real data).
    // Per-service tier resolution: Spotify has an artist URL → tier 2;
    // Apple has none → tier 3 with the plain-name search. Aria-labels
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
    // Apple has no artist URL on this fixture → drops to tier 3 (plain name).
    expect(apple).toHaveAttribute(
      'href',
      'https://music.apple.com/search?term=Bobby%20Timmons',
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

  it('renders the Apple/Spotify trademark attribution in the footer', () => {
    // Phase 4 (brand compliance): the streaming marks (Listen on Apple Music
    // badge + per-collaborator icons) live on this page, so the trademark
    // acknowledgement sits in the page footer near them — quiet fine print.
    setup()
    expect(
      screen.getByText(
        /Apple and Apple Music are trademarks of Apple Inc\., registered in the U\.S\. and other countries\. Spotify is a trademark of Spotify AB\./i,
      ),
    ).toBeInTheDocument()
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

// ── Tail-photo enrichment (issue #85) ─────────────────────────────────
//
// Each test below mocks `IntersectionObserver` with a manually-driven
// fake (the deferred-trigger pattern, precedent useMosaicScrollPulse) so
// we can simulate the user "arriving at chunk N" by firing the right
// sentinel on demand. The `byIds` method is replaced with a `vi.fn()`
// so we can assert exact call shapes.

import {
  HEADLINER_CAP,
} from './CollaboratorRail'
import {
  BY_IDS_CAP,
  TAIL_CHUNK_SIZE,
} from './useTailPortraits'
import type { Collaborator, MusicianDetail } from '../../lib/types'

// One-line invariant guard — encodes the cap-vs-chunk relationship at
// the test level (see useTailPortraits.ts). If a future change drops
// BY_IDS_CAP below TAIL_CHUNK_SIZE, this fails fast.
describe('useTailPortraits — cap-vs-chunk invariant', () => {
  it('TAIL_CHUNK_SIZE stays at or below BY_IDS_CAP', () => {
    expect(TAIL_CHUNK_SIZE).toBeLessThanOrEqual(BY_IDS_CAP)
  })
})

interface SentinelEntry {
  target: HTMLElement
  isIntersecting: boolean
}

type IOCallback = (entries: SentinelEntry[]) => void

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = []
  observed: HTMLElement[] = []
  disconnected = false
  callback: IOCallback
  constructor(callback: IOCallback) {
    this.callback = callback
    FakeIntersectionObserver.instances.push(this)
  }
  observe(el: HTMLElement): void {
    this.observed.push(el)
  }
  unobserve(el: HTMLElement): void {
    this.observed = this.observed.filter((o) => o !== el)
  }
  disconnect(): void {
    this.disconnected = true
  }
  takeRecords(): SentinelEntry[] {
    return []
  }
  /** Test helper — fire the callback with a single "now visible" entry
   * for the observed element whose `data-chunk-sentinel` matches. */
  trigger(chunkIdx: number): void {
    const target = this.observed.find(
      (el) => el.dataset.chunkSentinel === String(chunkIdx),
    )
    if (!target) return
    this.callback([{ target, isIntersecting: true }])
  }
  /** Force-fire even if the target has been unobserved — used by the
   * pre-await dedup test to prove the dedup is at the handler level
   * (not just at the observer level). */
  triggerRaw(target: HTMLElement): void {
    this.callback([{ target, isIntersecting: true }])
  }
}

function installFakeIO(): typeof FakeIntersectionObserver {
  FakeIntersectionObserver.instances = []
  // @ts-expect-error — assigning a partial fake for unit-test use.
  globalThis.IntersectionObserver = FakeIntersectionObserver
  return FakeIntersectionObserver
}

function liveFakeIO(): FakeIntersectionObserver | undefined {
  // The most recent non-disconnected instance is the rail's observer
  // (the earlier ones may have been disconnected by component cleanup).
  return [...FakeIntersectionObserver.instances]
    .reverse()
    .find((io) => !io.disconnected)
}

function makeCollab(i: number): Collaborator {
  return {
    id: `wikidata:Q-mock-${i}`,
    name: `Mock Collab ${i}`,
    sharedRecordCount: 1,
    photo: true,
  }
}

function makeDetail(collabCount: number): MusicianDetail {
  return {
    ...MODERATE,
    collaborators: Array.from({ length: collabCount }, (_, i) => makeCollab(i)),
  }
}

function makeMockSource(
  byIdsImpl?: (
    ids: string[],
  ) => Promise<{ items: { id: string; name: string; photo: boolean; portrait: { url?: string } }[] }>,
): DataSource {
  const impl =
    byIdsImpl ??
    (async (ids: string[]) => ({
      items: ids.map((id) => ({
        id,
        name: 'X',
        photo: true,
        portrait: { url: `https://x/${id}.jpg` },
      })),
    }))
  return {
    ...fixtureSource,
    byIds: vi.fn(impl),
  } as DataSource
}

function setupRail(detail: MusicianDetail, source: DataSource) {
  return render(
    <MemoryRouter>
      <DetailView detail={detail} source={source} />
    </MemoryRouter>,
  )
}

async function clickExpand(): Promise<void> {
  const cta = screen.getByRole('button', {
    name: /Show all \d+ collaborators/,
  })
  await userEvent.setup().click(cta)
}

describe('DetailView — tail-photo enrichment (issue #85)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    FakeIntersectionObserver.instances = []
  })

  it('initial mount fires exactly one byIds for the top-16 ids', () => {
    installFakeIO()
    const source = makeMockSource()
    const detail = makeDetail(HEADLINER_CAP + 3 * TAIL_CHUNK_SIZE)
    setupRail(detail, source)
    const calls = (source.byIds as ReturnType<typeof vi.fn>).mock.calls
    expect(calls).toHaveLength(1)
    expect(calls[0]?.[0]).toEqual(
      detail.collaborators.slice(0, HEADLINER_CAP).map((c) => c.id),
    )
  })

  it('expand fires the prefetch PAIR — chunks 0 AND 1 — immediately', async () => {
    installFakeIO()
    const source = makeMockSource()
    const detail = makeDetail(HEADLINER_CAP + 3 * TAIL_CHUNK_SIZE)
    setupRail(detail, source)
    await clickExpand()
    const mock = source.byIds as ReturnType<typeof vi.fn>
    // 1 top-16 + 2 prefetched chunks = 3 calls
    expect(mock).toHaveBeenCalledTimes(3)
    const tailIds = detail.collaborators.slice(HEADLINER_CAP).map((c) => c.id)
    const chunk0Ids = tailIds.slice(0, TAIL_CHUNK_SIZE)
    const chunk1Ids = tailIds.slice(TAIL_CHUNK_SIZE, 2 * TAIL_CHUNK_SIZE)
    const argSlices = mock.mock.calls.slice(1).map((c) => c[0] as string[])
    // Order between chunk 0 and chunk 1 isn't guaranteed — assert by set.
    expect(argSlices).toContainEqual(chunk0Ids)
    expect(argSlices).toContainEqual(chunk1Ids)
  })

  it('sentinel for chunk N → prefetch chunk N+1 (one ahead of scroll)', async () => {
    installFakeIO()
    const source = makeMockSource()
    const detail = makeDetail(HEADLINER_CAP + 4 * TAIL_CHUNK_SIZE)
    setupRail(detail, source)
    await clickExpand()
    const mock = source.byIds as ReturnType<typeof vi.fn>
    // Drain previous calls (top-16 + chunks 0 + 1)
    expect(mock).toHaveBeenCalledTimes(3)
    // User scrolls into chunk 1 → expect a prefetch of chunk 2.
    const io = liveFakeIO()
    expect(io).toBeDefined()
    io?.trigger(1)
    const tailIds = detail.collaborators.slice(HEADLINER_CAP).map((c) => c.id)
    const chunk2Ids = tailIds.slice(2 * TAIL_CHUNK_SIZE, 3 * TAIL_CHUNK_SIZE)
    expect(mock).toHaveBeenCalledTimes(4)
    expect(mock.mock.calls[3]?.[0]).toEqual(chunk2Ids)
  })

  it('in-flight dedup: triggering the same sentinel twice fires byIds ONCE', async () => {
    installFakeIO()
    // Deferred promise — never resolves during the test, so the chunk
    // stays "in-flight". The pre-await mark in requestedChunks must
    // prevent a second fire.
    // A promise that never resolves — keeps the byIds call "in-flight"
    // for the duration of the test so we can observe the dedup behavior.
    const deferred = new Promise<{ items: [] }>(() => {})
    const source = makeMockSource(() => deferred as Promise<never>)
    const detail = makeDetail(HEADLINER_CAP + 4 * TAIL_CHUNK_SIZE)
    setupRail(detail, source)
    await clickExpand()
    const mock = source.byIds as ReturnType<typeof vi.fn>
    // After expand: 3 calls (top-16 + chunk 0 + chunk 1).
    expect(mock).toHaveBeenCalledTimes(3)
    const io = liveFakeIO()
    expect(io).toBeDefined()
    // Capture the chunk-1 sentinel BEFORE the first trigger (the
    // observer.unobserve in the handler will remove it from
    // `io.observed` after the first fire — but the in-flight dedup
    // must independently catch the second hand-fed trigger via
    // `triggerRaw`, which proves the dedup is at the handler level,
    // not just at the observer level).
    const chunk1Sentinel = io?.observed.find(
      (el) => el.dataset.chunkSentinel === '1',
    )
    expect(chunk1Sentinel).toBeDefined()
    io?.trigger(1) // → asks for chunk 2 (1st time)
    // Yield a microtask between triggers — this proves the dedup is
    // truly pre-await (not just same-microtask-cycle synchronicity).
    // Without the pre-await mark in `requestedChunks`, the second
    // trigger would fire a duplicate byIds for chunk 2 because the
    // promise's `.then` hasn't run yet (no resolution).
    await Promise.resolve()
    // Use `triggerRaw` to bypass the observed-list check (the chunk-1
    // sentinel was unobserved by the first fire) — this isolates the
    // pre-await dedup as the thing that prevents the double-call.
    if (chunk1Sentinel) io?.triggerRaw(chunk1Sentinel)
    // Still only 4 calls — the second trigger of the same sentinel did
    // NOT double-fire because chunk 2 was already in `requestedChunks`.
    expect(mock).toHaveBeenCalledTimes(4)
  })

  it('sentinel is one-shot: unobserved after firing', async () => {
    installFakeIO()
    const source = makeMockSource()
    const detail = makeDetail(HEADLINER_CAP + 3 * TAIL_CHUNK_SIZE)
    setupRail(detail, source)
    await clickExpand()
    const io = liveFakeIO()
    expect(io).toBeDefined()
    // Pre-fire: chunk-1 sentinel is in the observed list.
    expect(
      io?.observed.find((el) => el.dataset.chunkSentinel === '1'),
    ).toBeDefined()
    io?.trigger(1)
    // Post-fire: chunk-1 sentinel has been unobserved (the observer
    // callback called `io.unobserve(target)`). A scroll-back into
    // chunk 1 would NOT re-fire the callback, which keeps the
    // callback flood low for long tails.
    expect(
      io?.observed.find((el) => el.dataset.chunkSentinel === '1'),
    ).toBeUndefined()
  })

  it('last-chunk guard: requesting a chunk past the tail end is a no-op', async () => {
    installFakeIO()
    const source = makeMockSource()
    // Tail = 1 chunk exactly (16 rows). Only chunk index 0 exists.
    const detail = makeDetail(HEADLINER_CAP + TAIL_CHUNK_SIZE)
    setupRail(detail, source)
    await clickExpand()
    const mock = source.byIds as ReturnType<typeof vi.fn>
    // onExpand fires requestChunk(0) → 1 byIds call.
    // onExpand ALSO fires requestChunk(1) — but chunk 1's start
    // (16) >= tailLength (16) → last-chunk guard returns early
    // without calling byIds. So total is exactly top-16 + chunk 0.
    expect(mock).toHaveBeenCalledTimes(2)
    // With a 1-chunk tail, no chunk-1 sentinel exists (chunk-0
    // sentinels are skipped by design; chunk 1 is past the end),
    // so no IO is set up at all.
    expect(liveFakeIO()).toBeUndefined()
  })

  it('does NOT block expand on the fetch — DOM expands synchronously', async () => {
    installFakeIO()
    // A promise that never resolves — keeps the byIds call "in-flight"
    // for the duration of the test so we can observe the dedup behavior.
    const deferred = new Promise<{ items: [] }>(() => {})
    const source = makeMockSource(() => deferred as Promise<never>)
    const detail = makeDetail(HEADLINER_CAP + 2 * TAIL_CHUNK_SIZE)
    setupRail(detail, source)
    // Before expand: tail rows are not present.
    expect(screen.queryByText(/Mock Collab 16/)).toBeNull()
    await clickExpand()
    // After expand: tail rows are present even though no byIds promise
    // has resolved (they're all stuck on the deferred Promise above).
    // This is the "instant expand" guarantee.
    expect(screen.getByText(/Mock Collab 16/)).toBeInTheDocument()
    expect(screen.getByText(/Mock Collab 31/)).toBeInTheDocument()
  })
})
