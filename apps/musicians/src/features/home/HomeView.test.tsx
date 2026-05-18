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

  it('renders a theme toggle', () => {
    setup()
    expect(
      screen.getByRole('button', { name: /toggle theme/i }),
    ).toBeInTheDocument()
  })
})
