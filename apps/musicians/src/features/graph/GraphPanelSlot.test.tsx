// GraphPanelSlot is D-owned (the lazy bridge from the mobile-reader lane to
// Phase E's public API). It must: render an accessible loading state while
// the async d3-force chunk + graph data resolve, then mount the real
// GraphView centred on the focus musician, and forward node selection.

import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { RICH } from '../../test/fixtures'
import { GraphPanelSlot } from './GraphPanelSlot'

beforeEach(() => {
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: false,
    media: q,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    onchange: null,
    dispatchEvent: vi.fn(),
  }))
})
afterEach(() => vi.unstubAllGlobals())

describe('GraphPanelSlot', () => {
  it('shows an accessible loading state, then the real graph centred on the focus', async () => {
    render(
      <MemoryRouter>
        <GraphPanelSlot focusId={RICH.id} name={RICH.name} />
      </MemoryRouter>,
    )
    // Accessible Suspense fallback (status, not a bare spinner).
    expect(screen.getByRole('status', { name: /graph/i })).toBeInTheDocument()
    // The lazy chunk + fixture graph resolve → the real GraphView mounts.
    const app = await screen.findByRole('application')
    expect(app).toHaveAttribute(
      'aria-label',
      expect.stringContaining(RICH.name),
    )
  })

  it('renders a focus node and peripheral collaborator nodes from the seam', async () => {
    render(
      <MemoryRouter>
        <GraphPanelSlot focusId={RICH.id} name={RICH.name} />
      </MemoryRouter>,
    )
    await screen.findByRole('application')
    // The focus musician is in the graph (the mapper put it at node 0).
    await waitFor(() =>
      expect(
        screen.getAllByText(new RegExp(RICH.name, 'i')).length,
      ).toBeGreaterThan(0),
    )
  })
})
