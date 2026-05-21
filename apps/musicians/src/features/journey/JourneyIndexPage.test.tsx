// JourneyIndexPage — component tests. variant=era renders 7 chips,
// variant=label renders 6 chips; each chip links to the correct sub-route.

import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { JourneyIndexPage } from './JourneyIndexPage'
import { ERA_DATA } from './data/eras'
import { LABEL_DATA } from './data/labels'

function setup(variant: 'era' | 'label') {
  return render(
    <MemoryRouter initialEntries={[`/musicians/journey/${variant}`]}>
      <JourneyIndexPage variant={variant} />
    </MemoryRouter>,
  )
}

/** Pulls the href set off all links inside `list`. Used to assert presence
 *  of a route without depending on the link's accessible name (which is
 *  the concatenation of icon + name + subtitle and can legitimately
 *  collide when one era's subtitle mentions another era by name —
 *  e.g. Cool's subtitle "Bebop slowed, softened..."). */
function hrefsIn(list: HTMLElement): string[] {
  return within(list)
    .getAllByRole('link')
    .map((l) => l.getAttribute('href') ?? '')
}

describe('JourneyIndexPage — variant=era', () => {
  it('renders the era hero + a chip per era linking to /journey/era/:slug', () => {
    setup('era')
    expect(
      screen.getByRole('heading', { level: 1, name: /step through/i }),
    ).toBeInTheDocument()

    const list = screen.getByRole('list', { name: /jazz eras/i })
    expect(within(list).getAllByRole('listitem')).toHaveLength(7)

    const hrefs = hrefsIn(list)
    for (const entry of Object.values(ERA_DATA)) {
      expect(hrefs).toContain(`/musicians/journey/era/${entry.slug}`)
    }
  })

  it('renders a back-to-home affordance', () => {
    setup('era')
    expect(
      screen.getByRole('link', { name: /back to home/i }),
    ).toHaveAttribute('href', '/musicians')
  })
})

describe('JourneyIndexPage — variant=label', () => {
  it('renders the label hero + a chip per label linking to /journey/label/:slug', () => {
    setup('label')
    expect(
      screen.getByRole('heading', { level: 1, name: /follow a label/i }),
    ).toBeInTheDocument()

    const list = screen.getByRole('list', { name: /jazz labels/i })
    expect(within(list).getAllByRole('listitem')).toHaveLength(6)

    const hrefs = hrefsIn(list)
    for (const entry of Object.values(LABEL_DATA)) {
      expect(hrefs).toContain(`/musicians/journey/label/${entry.slug}`)
    }
  })
})
