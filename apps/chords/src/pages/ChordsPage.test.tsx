import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Navigate, Route, Routes, useLocation } from 'react-router'
import { describe, expect, it } from 'vitest'
import ChordsPage from './ChordsPage'

/** Probe to capture the current URL during tests. */
const LocationProbe = () => {
  const loc = useLocation()
  return <div data-testid="loc">{loc.pathname}</div>
}

/**
 * Renders ChordsPage inside a MemoryRouter with routing set up to
 * mirror the real App.tsx routes (valid + invalid + redirect).
 */
const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/chords/:root"
          element={
            <>
              <ChordsPage />
              <LocationProbe />
            </>
          }
        />
        <Route path="*" element={<Navigate to="/chords/C" replace />} />
      </Routes>
    </MemoryRouter>,
  )

describe('ChordsPage — chord list', () => {
  it('renders 27 chord rows for /chords/C', () => {
    renderAt('/chords/C')
    // ChordRow renders as <article data-testid="chord-row" ...>
    const rows = screen.getAllByTestId('chord-row')
    expect(rows).toHaveLength(27)
  })

  it('the first chord row primary symbol is "C" (C major triad)', () => {
    renderAt('/chords/C')
    const rows = screen.getAllByTestId('chord-row')
    const firstRow = rows[0]!
    // ChordSymbolDisplay primary uses data-testid="chord-primary"
    const primary = within(firstRow).getByTestId('chord-primary')
    expect(primary).toHaveTextContent('C')
  })

  it('renders F♯ chord symbols for /chords/F-sharp', () => {
    renderAt('/chords/F-sharp')
    const rows = screen.getAllByTestId('chord-row')
    expect(rows).toHaveLength(27)
    const firstRow = rows[0]!
    const primary = within(firstRow).getByTestId('chord-primary')
    // Major triad on root F♯ is just "F♯"
    expect(primary).toHaveTextContent('F♯')
  })
})

describe('ChordsPage — RootPicker', () => {
  it('shows the current root highlighted in the RootPicker', () => {
    renderAt('/chords/D-flat')
    expect(screen.getByRole('radio', { name: 'D♭' })).toHaveAttribute('aria-checked', 'true')
  })

  it('navigates to the new root URL when a root button is clicked', async () => {
    renderAt('/chords/C')
    await userEvent.click(screen.getByRole('radio', { name: 'F♯' }))
    expect(screen.getByTestId('loc').textContent).toBe('/chords/F-sharp')
  })

  it('the RootPicker has 12 options (one per default root)', () => {
    renderAt('/chords/C')
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(12)
  })
})

describe('ChordsPage — invalid slug redirect', () => {
  it('redirects /chords/invalid to /chords/C', () => {
    // The Navigate fallback in the Routes above handles this.
    // After redirect, the location probe shows /chords/C.
    renderAt('/chords/invalid')
    expect(screen.getByTestId('loc').textContent).toBe('/chords/C')
  })
})

describe('ChordsPage — navigation links', () => {
  it('has a "My chord collection" link pointing to /collection/chords', () => {
    // Mobile-icon + desktop-text variants are both mounted (jsdom can't
    // evaluate the responsive CSS gating) — every variant must route there.
    renderAt('/chords/C')
    const links = screen.getAllByRole('link', { name: /my chord collection/i })
    expect(links.length).toBeGreaterThan(0)
    for (const l of links) expect(l).toHaveAttribute('href', '/collection/chords')
  })
})

describe('ChordsPage — RootOption[] builder', () => {
  it('ambiguous roots (e.g. Db) have an alternate spelling in the picker', () => {
    renderAt('/chords/C')
    // Db option should exist; InlineRootPicker badge label is "Show C♯ spelling"
    const flipButton = screen.getByRole('button', { name: /show C♯ spelling/i })
    expect(flipButton).toBeInTheDocument()
  })

  it('non-ambiguous roots (e.g. E) do not have an alternate spelling', () => {
    renderAt('/chords/C')
    // There should be no flip button for E (non-ambiguous root)
    const eFlip = screen.queryByRole('button', { name: /show.*E.*spelling/i })
    expect(eFlip).toBeNull()
  })
})
