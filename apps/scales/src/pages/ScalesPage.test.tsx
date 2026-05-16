import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { describe, expect, it } from 'vitest'
import ScalesPage from './ScalesPage'

const LocationProbe = () => {
  const loc = useLocation()
  return <div data-testid="loc">{loc.pathname}</div>
}

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/scales/:root" element={<><ScalesPage /><LocationProbe /></>} />
      </Routes>
    </MemoryRouter>,
  )

describe('ScalesPage routing', () => {
  it('renders the root picker with current root highlighted', () => {
    renderAt('/scales/D-flat')
    // StickyHeader renders an inline picker (desktop) and a compact button
    // (mobile), both hidden by CSS but present in the DOM. The inline picker
    // uses radio semantics for the root buttons.
    const dFlatRadios = screen.getAllByRole('radio', { name: 'D♭' })
    expect(dFlatRadios[0]!).toHaveAttribute('aria-checked', 'true')
  })

  it('navigates to the new root URL when a root is clicked', async () => {
    renderAt('/scales/C')
    // getAllByRole because StickyHeader mounts both pickers (CSS-gated).
    const fSharpRadios = screen.getAllByRole('radio', { name: 'F♯' })
    await userEvent.click(fSharpRadios[0]!)
    expect(screen.getByTestId('loc').textContent).toBe('/scales/F-sharp')
  })

  it('exposes a "My scales" link to the collection page', () => {
    // Without this entry point the saved-scales / print flow is unreachable
    // from the UI even though the route exists. Two variants are mounted
    // (mobile icon + desktop text); jsdom can't evaluate the CSS gating so
    // both are present — assert every variant points at the collection route.
    renderAt('/scales/C')
    const links = screen.getAllByRole('link', { name: /my scales/i })
    expect(links.length).toBeGreaterThan(0)
    for (const l of links) expect(l).toHaveAttribute('href', '/collection/scales')
  })

  it('renders the page title in the sticky header', () => {
    renderAt('/scales/C')
    expect(screen.getByRole('heading', { name: /C scales/i })).toBeInTheDocument()
  })

  it('renders the Scale categories chip navigation', () => {
    renderAt('/scales/C')
    expect(screen.getByRole('navigation', { name: 'Scale categories' })).toBeInTheDocument()
  })
})
