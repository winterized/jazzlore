import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { CURATED } from '../../test/fixtures'
import { HomeView } from './HomeView'

function setup() {
  return render(
    <MemoryRouter>
      <HomeView curated={CURATED} />
    </MemoryRouter>,
  )
}

describe('HomeView', () => {
  it('renders the hero invitation headline', () => {
    setup()
    expect(
      screen.getByRole('heading', { level: 1, name: /step into a musician/i }),
    ).toBeInTheDocument()
  })

  it('renders a visible search input with a ≥16px font and iOS-safe attrs', () => {
    setup()
    const input = screen.getByRole('searchbox', { name: /search a musician/i })
    expect(input).toBeVisible()
    expect(input).toHaveClass('search-input')
    expect(input).toHaveAttribute('autocorrect', 'off')
    expect(input).toHaveAttribute('autocapitalize', 'off')
    expect(input).toHaveAttribute('spellcheck', 'false')
    expect(input).toHaveAttribute('inputmode', 'search')
  })

  it('renders the "Start a journey" row with three journeys', () => {
    setup()
    expect(screen.getByText(/start a journey/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /random jump/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /era walk/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /label walk/i })).toBeInTheDocument()
  })

  it('renders the curated 12 grid as links to each musician detail', () => {
    setup()
    const grid = screen.getByRole('list', { name: /twelve to begin with/i })
    const cards = within(grid).getAllByRole('listitem')
    expect(cards).toHaveLength(CURATED.length)
    const first = CURATED[0]!
    const link = within(grid).getByRole('link', { name: new RegExp(first.name, 'i') })
    expect(link).toHaveAttribute(
      'href',
      `/musicians/${encodeURIComponent(first.id)}`,
    )
    expect(within(grid).getByText(first.hook)).toBeInTheDocument()
  })

  it('shows the curated count label', () => {
    setup()
    expect(screen.getByText(/curated · 12/i)).toBeInTheDocument()
  })

  // ── Phase H — hero portrait photos on the curated cards ───────────────
  it('renders the real duotone portrait for a curated card that has one', () => {
    setup()
    // CURATED[0] = the rich (Miles-like) pick — its portrait has a url.
    const miles = CURATED[0]!
    expect(miles.portrait.url).toBeTruthy()
    const img = screen.getByRole('img', { name: new RegExp(miles.name, 'i') })
    expect(img).toHaveAttribute('src', miles.portrait.url!)
  })

  it('shows the LEGAL attribution caption for a CC-licensed portrait', () => {
    setup()
    // CURATED[0]'s portrait carries license + attribution → the credit
    // MUST render (legal requirement; the FROZEN attributionCaption owns
    // the format "Photo: <attr> · <lic>").
    expect(screen.getByText(/^Photo:.*Tom Palumbo/)).toBeInTheDocument()
  })

  it('renders the monogram + NO caption for a curated card with no portrait', () => {
    setup()
    // CURATED[2] = John Coltrane, portrait:{} photo:false → graceful
    // monogram, and no legal caption (nothing to attribute).
    const trane = CURATED[2]!
    expect(trane.portrait.url).toBeFalsy()
    expect(
      screen.queryByRole('img', { name: new RegExp(trane.name, 'i') }),
    ).toBeNull()
    // No "Photo: …" caption is emitted for an un-credited / monogram card.
    const credits = screen
      .getAllByText(/^Photo:/)
      .map((n) => n.textContent ?? '')
    expect(credits.some((t) => /Tom Palumbo/.test(t))).toBe(true)
    expect(credits.length).toBeLessThan(CURATED.length)
  })

  it('renders the overflow menu trigger (theme toggle moved inside the menu — Group C item 7)', () => {
    setup()
    // Header now renders the "···" overflow menu, not the bare theme
    // toggle (which is one of its menu items, reachable after the menu
    // opens — see OverflowMenu.test.tsx for the menu behaviour).
    expect(
      screen.getByRole('button', { name: /more options/i }),
    ).toBeInTheDocument()
    // The theme toggle is mounted only once the menu opens; while closed
    // it must NOT be in the DOM (the popover is hidden, not present).
    expect(
      screen.queryByRole('button', { name: /toggle theme/i }),
    ).toBeNull()
  })
})
