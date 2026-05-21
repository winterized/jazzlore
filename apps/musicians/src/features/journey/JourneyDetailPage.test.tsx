// JourneyDetailPage — component tests. Known slug renders hero + curated
// grid. Unknown slug redirects to the variant's index page.

import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { JourneyDetailPage } from './JourneyDetailPage'
import { ERA_DATA } from './data/eras'
import { LABEL_DATA } from './data/labels'

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
