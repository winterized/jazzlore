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

  it('renders the "Start a journey" row with three journey links pointing at the journey routes', () => {
    setup()
    expect(screen.getByText(/start a journey/i)).toBeInTheDocument()
    // The 3 journeys are now <Link> (anchors), not buttons — they navigate
    // to the per-journey routes added in this PR.
    expect(
      screen.getByRole('link', { name: /random jump/i }),
    ).toHaveAttribute('href', '/musicians/journey/random')
    expect(
      screen.getByRole('link', { name: /era walk/i }),
    ).toHaveAttribute('href', '/musicians/journey/era')
    expect(
      screen.getByRole('link', { name: /label walk/i }),
    ).toHaveAttribute('href', '/musicians/journey/label')
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

  it('renders the theme toggle directly in the header (no overflow menu)', () => {
    setup()
    // User feedback overrode the Group C item 7 design: the theme toggle
    // was buried behind a "···" overflow trigger that obscured it
    // visually. Header now renders <ThemeToggleButton /> directly in the
    // top-right slot. The overflow menu is gone.
    expect(
      screen.getByRole('button', { name: /toggle theme/i }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /more options/i }),
    ).toBeNull()
  })
})
