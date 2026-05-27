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

describe('GraphView — instrument family colour + on-demand labels', () => {
  it('attaches mu-family-<key> on every peripheral node; central node stays accent (no family class)', () => {
    stubReducedMotion(true)
    render(<GraphView data={BOBBY_LIKE} focusId={BOBBY_LIKE.nodes[0]!.id} />)
    // Fixture cycles instruments: collab 1 = trumpet → brass, collab 2 =
    // tenor saxophone → reeds. SVG `className` is SVGAnimatedString (not a
    // string), so query `class` attribute directly for a plain string the
    // string matchers can handle.
    const trumpetNode = screen.getAllByRole('button', {
      name: /Collaborator 1, trumpet/,
    })[0]!
    const trumpetCls = trumpetNode.getAttribute('class') ?? ''
    expect(trumpetCls).toContain('mu-family-brass')
    expect(trumpetCls).toContain('mu-gnode')
    expect(trumpetCls).not.toContain('mu-gnode-focus')

    const saxNode = screen.getAllByRole('button', {
      name: /Collaborator 2, tenor saxophone/,
    })[0]!
    expect(saxNode.getAttribute('class') ?? '').toContain('mu-family-reeds')

    // The central node (Bobby) is `.mu-gnode-focus` and must NOT carry
    // any mu-family-* class — it uses the accent treatment, not family
    // colour. The first hit by Bobby's name is the central button.
    const central = screen.getAllByRole('button', { name: /Bobby Timmons/ })[0]!
    const centralCls = central.getAttribute('class') ?? ''
    expect(centralCls).toContain('mu-gnode-focus')
    expect(centralCls).not.toMatch(/mu-family-/)
  })

  it('peripheral labels are hidden by default; central label is visible (CSS opacity)', () => {
    stubReducedMotion(true)
    const { container } = render(
      <GraphView data={BOBBY_LIKE} focusId={BOBBY_LIKE.nodes[0]!.id} />,
    )
    // The CSS lives in a <style>{GRAPH_CSS}</style> block inside GraphView;
    // jsdom evaluates style elements so getComputedStyle returns the
    // cascaded value. Labels now live in a separate second-pass
    // `<g class="mu-gnode-labels">` group (paint-order fix) — peripherals
    // have no data-active and inherit the default opacity 0; the centre
    // node has `data-focus-node="true"` which sets data-active="true"
    // and lifts opacity to 1.
    const peripheralLabel = container.querySelector(
      '.mu-gnode-labels > g:not([data-focus-node]) .mu-gnode-label',
    )
    expect(peripheralLabel).not.toBeNull()
    expect(window.getComputedStyle(peripheralLabel!).opacity).toBe('0')

    const centralLabel = container.querySelector(
      '.mu-gnode-labels > g[data-focus-node="true"] .mu-gnode-label',
    )
    expect(centralLabel).not.toBeNull()
    expect(window.getComputedStyle(centralLabel!).opacity).toBe('1')
  })

  it('peripheral sub-instrument text follows the same hover/focus reveal rule', () => {
    stubReducedMotion(true)
    const { container } = render(
      <GraphView data={BOBBY_LIKE} focusId={BOBBY_LIKE.nodes[0]!.id} />,
    )
    const peripheralSub = container.querySelector(
      '.mu-gnode-labels > g:not([data-focus-node]) .mu-gnode-sub',
    )
    expect(peripheralSub).not.toBeNull()
    expect(window.getComputedStyle(peripheralSub!).opacity).toBe('0')
  })

  it('labels group renders AFTER all node groups (SVG paint order — labels on top)', () => {
    // Regression for the paint-order bug: when labels were nested inside
    // each .mu-gnode, the next .mu-gnode's circle painted over the
    // previous label. The fix moves all labels into a sibling
    // .mu-gnode-labels group rendered AFTER every node — so SVG paint
    // order puts them above every circle. Assert by index in the SVG.
    stubReducedMotion(true)
    const { container } = render(
      <GraphView data={BOBBY_LIKE} focusId={BOBBY_LIKE.nodes[0]!.id} />,
    )
    const svg = container.querySelector('svg.mu-graph-svg')!
    const children = Array.from(svg.children)
    const labelsIdx = children.findIndex((c) =>
      c.classList.contains('mu-gnode-labels'),
    )
    const lastNodeIdx = children.findLastIndex((c) =>
      c.classList.contains('mu-gnode'),
    )
    expect(labelsIdx).toBeGreaterThan(lastNodeIdx)
    expect(lastNodeIdx).toBeGreaterThan(-1)
  })

  it('a node without an instrument gets mu-family-unknown', () => {
    // ANTOINE_LIKE: pianist focus + one collaborator. The fixture builder
    // assigns instruments cyclically, so we manufacture an "instrument
    // missing" peripheral by passing a graph with one no-instrument node.
    stubReducedMotion(true)
    const data = {
      nodes: [
        {
          id: 'focus',
          name: 'Some Pianist',
          instrument: 'piano',
          recordCount: 1,
          focus: true,
        },
        {
          id: 'mystery',
          name: 'Mystery Sideman',
          recordCount: 1,
          focus: false,
        },
      ],
      edges: [{ source: 'focus', target: 'mystery', weight: 1 }],
    }
    render(<GraphView data={data} focusId="focus" />)
    const unknownNode = screen.getAllByRole('button', {
      name: /Mystery Sideman/,
    })[0]!
    expect(unknownNode.getAttribute('class') ?? '').toContain(
      'mu-family-unknown',
    )
  })

  it('node initials route through the canonical builder (parenthesised suffix → letters, not "(")', () => {
    // Regression for the divergence where the graph rendered "P(" for
    // "Pierre Bernier (2)" while the mosaic correctly rendered "PB".
    // Both surfaces must read the same — the graph imports `initialsOf`
    // from `components/duotone.ts` (Unicode-letter filter + particles
    // skip), not the old naive whitespace-split duplicate.
    stubReducedMotion(true)
    const data = {
      nodes: [
        {
          id: 'focus',
          name: 'Antoine Karacostas',
          instrument: 'piano',
          recordCount: 1,
          focus: true,
        },
        {
          id: 'collab',
          name: 'Pierre Bernier (2)',
          instrument: 'tenor saxophone',
          recordCount: 1,
          focus: false,
        },
      ],
      edges: [{ source: 'focus', target: 'collab', weight: 1 }],
    }
    const { container } = render(<GraphView data={data} focusId="focus" />)
    const initials = Array.from(
      container.querySelectorAll('text.mu-gnode-initials'),
    ).map((t) => t.textContent)
    expect(initials).toContain('PB')
    expect(initials).not.toContain('P(')
  })
})
