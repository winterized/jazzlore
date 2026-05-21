// JourneyDetailPage — component tests. Known slug renders hero + curated
// grid. Unknown slug redirects to the variant's index page. With a
// mocked data source, portraits + figcaption attribution render via
// the same Duo3 path the home page uses.

import { describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { JourneyDetailPage } from './JourneyDetailPage'
import { ERA_DATA } from './data/eras'
import { LABEL_DATA } from './data/labels'
import { fixtureSource, type DataSource } from '../../hooks/useMusicianData'
import type { MusicianDetail } from '../../lib/types'

function setup(variant: 'era' | 'label', slug: string) {
  return render(
    <MemoryRouter initialEntries={[`/musicians/journey/${variant}/${slug}`]}>
      <Routes>
        <Route
          path={`/musicians/journey/${variant}`}
          element={<div data-testid="index-stub">{variant} index</div>}
        />
        <Route
          path={`/musicians/journey/${variant}/:slug`}
          element={<JourneyDetailPage variant={variant} />}
        />
      </Routes>
    </MemoryRouter>,
  )
}

/** Same rationale as JourneyIndexPage.test.tsx's helper: musician card
 *  accessible names are name + hook (and hooks legitimately mention other
 *  musicians by name — e.g. McCoy Tyner's hook references Coltrane). Look
 *  up by href, which is unique per card. */
function cardHrefsIn(list: HTMLElement): string[] {
  return within(list)
    .getAllByRole('link')
    .map((l) => l.getAttribute('href') ?? '')
}

describe('JourneyDetailPage — known era slug', () => {
  it('renders bebop hero + the 10 curated musician cards', () => {
    setup('era', 'bebop')
    const bebop = ERA_DATA['bebop']!
    expect(
      screen.getByRole('heading', { level: 1, name: new RegExp(bebop.h1, 'i') }),
    ).toBeInTheDocument()

    const grid = screen.getByRole('list', {
      name: new RegExp(`${bebop.musicians.length} to dig into`, 'i'),
    })
    expect(within(grid).getAllByRole('listitem')).toHaveLength(
      bebop.musicians.length,
    )

    const hrefs = cardHrefsIn(grid)
    for (const m of bebop.musicians) {
      expect(hrefs).toContain(`/musicians/${encodeURIComponent(m.id)}`)
    }
  })
})

describe('JourneyDetailPage — known label slug', () => {
  it('renders blue-note hero + the curated grid', () => {
    setup('label', 'blue-note')
    const blueNote = LABEL_DATA['blue-note']!
    expect(
      screen.getByRole('heading', { level: 1, name: new RegExp(blueNote.h1, 'i') }),
    ).toBeInTheDocument()
    const grid = screen.getByRole('list', {
      name: new RegExp(`${blueNote.musicians.length} to dig into`, 'i'),
    })
    expect(within(grid).getAllByRole('listitem')).toHaveLength(
      blueNote.musicians.length,
    )

    const hrefs = cardHrefsIn(grid)
    for (const m of blueNote.musicians) {
      expect(hrefs).toContain(`/musicians/${encodeURIComponent(m.id)}`)
    }
  })
})

describe('JourneyDetailPage — portrait loading via the data-source seam', () => {
  it('renders a portrait <img> for each musician once the source resolves', async () => {
    // A minimal MusicianDetail stub for a given id+name+portrait URL — the
    // frozen MusicianDetail has many other fields, but Duo3 only reads
    // `photo` (bool) + `portrait.url` and the caption only reads
    // `portrait.license/attribution`. Mark the rest with `as MusicianDetail`
    // to keep the stub focused.
    const stub = (id: string, name: string, url: string): MusicianDetail =>
      ({
        id,
        name,
        photo: true,
        portrait: {
          url,
          license: 'Public domain',
          attribution: 'William P. Gottlieb',
        },
      }) as MusicianDetail

    const bebop = ERA_DATA['bebop']!
    const detailsByid = new Map<string, MusicianDetail>(
      bebop.musicians.map((m, i) => [
        m.id,
        stub(m.id, m.name, `https://example.test/portrait-${i}.jpg`),
      ]),
    )

    const mockedSource: DataSource = {
      ...fixtureSource,
      detail: async (id) => {
        const d = detailsByid.get(id)
        if (!d) throw new Error(`no stub for ${id}`)
        return d
      },
    }

    render(
      <MemoryRouter initialEntries={[`/musicians/journey/era/bebop`]}>
        <Routes>
          <Route
            path="/musicians/journey/era/:slug"
            element={<JourneyDetailPage variant="era" source={mockedSource} />}
          />
        </Routes>
      </MemoryRouter>,
    )

    // After the parallel fetch resolves, each card has an <img> with the
    // expected stub URL and a "Photo: William P. Gottlieb · Public domain"
    // figcaption.
    await waitFor(() => {
      const imgs = screen.getAllByRole('img')
      expect(imgs.length).toBeGreaterThan(0)
    })
    const imgs = screen.getAllByRole('img')
    expect(imgs).toHaveLength(bebop.musicians.length)
    // At least one figcaption renders the attribution string.
    expect(
      screen.getAllByText(/Photo:.*Gottlieb.*Public domain/i).length,
    ).toBeGreaterThan(0)
  })

  it('falls back to monogram (no <img>) when a per-musician fetch fails', async () => {
    const failingSource: DataSource = {
      ...fixtureSource,
      detail: async () => {
        throw new Error('simulated BFF failure')
      },
    }

    render(
      <MemoryRouter initialEntries={[`/musicians/journey/era/bebop`]}>
        <Routes>
          <Route
            path="/musicians/journey/era/:slug"
            element={<JourneyDetailPage variant="era" source={failingSource} />}
          />
        </Routes>
      </MemoryRouter>,
    )

    // Give the failing promise a tick to settle.
    await waitFor(() => {
      // The hero h1 is the synchronous proof that the page mounted.
      expect(
        screen.getByRole('heading', { level: 1, name: /Bebop/i }),
      ).toBeInTheDocument()
    })

    // No portraits — every card stayed on the monogram. The home-card-credit
    // figcaption is rendered but empty (no caption when no attribution).
    expect(screen.queryAllByRole('img')).toHaveLength(0)
  })
})

describe('JourneyDetailPage — unknown slug', () => {
  it('era variant redirects to /musicians/journey/era', () => {
    setup('era', 'this-era-does-not-exist')
    expect(screen.getByTestId('index-stub')).toHaveTextContent('era index')
  })

  it('label variant redirects to /musicians/journey/label', () => {
    setup('label', 'fake-label')
    expect(screen.getByTestId('index-stub')).toHaveTextContent('label index')
  })
})
