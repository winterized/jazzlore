import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GraphView from './GraphView'
import { ANTOINE_LIKE, BOBBY_LIKE, MILES_LIKE } from './fixtures'

/** jsdom has no matchMedia. Stub it; default = reduced-motion OFF so the
 * snap-vs-animate branch is explicitly controlled per test. */
function stubReducedMotion(matches: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(
      () =>
        ({
          matches,
          media: '(prefers-reduced-motion: reduce)',
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
          onchange: null,
          dispatchEvent: vi.fn(),
        }) as unknown as MediaQueryList,
    ),
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('GraphView — accessibility & structure', () => {
  it('exposes the graph as a labelled application region', () => {
    stubReducedMotion(false)
    render(<GraphView data={BOBBY_LIKE} focusId={BOBBY_LIKE.nodes[0]!.id} />)
    const app = screen.getByRole('application')
    expect(app).toHaveAttribute(
      'aria-label',
      expect.stringContaining('Bobby Timmons'),
    )
  })

  it('renders every node as a focusable button with an accessible name', () => {
    stubReducedMotion(false)
    render(<GraphView data={BOBBY_LIKE} focusId={BOBBY_LIKE.nodes[0]!.id} />)
    // Fixture instrument cycle starts at 'trumpet' (INSTRUMENTS[i % len]).
    const nodes = screen.getAllByRole('button', {
      name: /Collaborator 1, /,
    })
    expect(nodes.length).toBeGreaterThan(0)
    const node = nodes[0]!
    expect(node).toHaveAttribute('tabindex', '0')
    // "<name>, <instrument>" verbatim accessible name.
    expect(node).toHaveAccessibleName('Collaborator 1, trumpet')
  })

  it('labels every control button (keyboard-operable, aria-labelled)', () => {
    stubReducedMotion(false)
    render(<GraphView data={BOBBY_LIKE} focusId={BOBBY_LIKE.nodes[0]!.id} />)
    const controls = screen.getByRole('group', { name: 'Graph controls' })
    for (const label of [
      'Zoom out',
      'Zoom in',
      'Refit graph',
      'Toggle layout density',
    ]) {
      expect(
        within(controls).getByRole('button', { name: label }),
      ).toBeInTheDocument()
    }
  })

  it('announces the focus musician in a live region', () => {
    stubReducedMotion(false)
    render(<GraphView data={MILES_LIKE} focusId={MILES_LIKE.nodes[0]!.id} />)
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('Graph centred on Miles Davis.')
  })
})

describe('GraphView — selection re-centres', () => {
  it('clicking a node recomputes the layout around it + calls onSelectNode', async () => {
    stubReducedMotion(true) // snap path → deterministic, no rAF
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(
      <GraphView
        data={MILES_LIKE}
        focusId={MILES_LIKE.nodes[0]!.id}
        onSelectNode={onSelect}
      />,
    )

    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('Miles Davis')

    const collab = screen.getAllByRole('button', {
      name: 'Collaborator 1, trumpet',
    })[0]!
    await user.click(collab)

    expect(onSelect).toHaveBeenCalledWith(`${MILES_LIKE.nodes[0]!.id}::collab-0`)
    // Focus moved → the title/live region now names the collaborator and the
    // re-centred node is the pressed one (positions recomputed for new seed).
    expect(status).toHaveTextContent('Collaborator 1')
    const recentred = screen.getAllByRole('button', {
      name: 'Collaborator 1, trumpet',
    })[0]!
    expect(recentred).toHaveAttribute('aria-pressed', 'true')
  })

  it('Enter and Space on a focused node select it (keyboard select)', async () => {
    stubReducedMotion(true)
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(
      <GraphView
        data={BOBBY_LIKE}
        focusId={BOBBY_LIKE.nodes[0]!.id}
        onSelectNode={onSelect}
      />,
    )
    const collab = screen.getAllByRole('button', {
      name: 'Collaborator 2, tenor saxophone',
    })[0]!
    collab.focus()
    await user.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalledWith(`${BOBBY_LIKE.nodes[0]!.id}::collab-1`)
  })

  it('toggling layout density keeps it operable and pressed-state tracked', async () => {
    stubReducedMotion(true)
    const user = userEvent.setup()
    render(<GraphView data={BOBBY_LIKE} focusId={BOBBY_LIKE.nodes[0]!.id} />)
    const toggle = screen.getByRole('button', {
      name: 'Toggle layout density',
    })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
  })

  it('renders the sparse (2-node) graph without error', () => {
    stubReducedMotion(true)
    render(
      <GraphView data={ANTOINE_LIKE} focusId={ANTOINE_LIKE.nodes[0]!.id} />,
    )
    expect(
      screen.getAllByRole('button', { name: /Antoine Hervé/ }).length,
    ).toBeGreaterThan(0)
  })
})
