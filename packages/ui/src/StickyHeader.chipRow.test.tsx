/**
 * Behavior tests for the real scroll-spy ChipRow component.
 *
 * Pattern mirrors StickyHeader.test.tsx — behavior assertions, not snapshots.
 * DOM targets for scroll-spy are created as real <div> elements with stubbed
 * getBoundingClientRect so we can drive resolveActiveChip through the component.
 */

import { render, screen, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import ChipRow from './StickyHeader.chipRow'
import type { ChipGroup } from './StickyHeader'

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const CHIP_GROUPS: ChipGroup[] = [
  {
    label: 'TRIADS',
    chips: [
      { id: 'triads-maj', label: 'Cmaj' },
      { id: 'triads-m', label: 'Cm' },
    ],
  },
  {
    label: 'SIXTHS',
    chips: [{ id: 'sixths-6', label: 'C6' }],
  },
]

const SCALES_CHIP_GROUPS: ChipGroup[] = [
  {
    // Empty label → scales app pattern (no category label rendered)
    label: '',
    chips: [
      { id: 'major-modes', label: 'Modes of major' },
      { id: 'mel-min', label: 'Melodic minor' },
    ],
  },
]

function renderChipRow(overrides: Partial<Parameters<typeof ChipRow>[0]> = {}) {
  return render(
    <ChipRow
      chipGroups={CHIP_GROUPS}
      navLabel="Chord categories"
      headerHeight={80}
      {...overrides}
    />,
  )
}

// ─── Rendering ─────────────────────────────────────────────────────────────────

describe('ChipRow — rendering', () => {
  it('renders all chip labels', () => {
    renderChipRow()
    expect(screen.getByText('Cmaj')).toBeInTheDocument()
    expect(screen.getByText('Cm')).toBeInTheDocument()
    expect(screen.getByText('C6')).toBeInTheDocument()
  })

  it('renders group category labels when non-empty', () => {
    renderChipRow()
    expect(screen.getByText('TRIADS')).toBeInTheDocument()
    expect(screen.getByText('SIXTHS')).toBeInTheDocument()
  })

  it('omits group category labels when the group label is empty (scales pattern)', () => {
    renderChipRow({ chipGroups: SCALES_CHIP_GROUPS })
    expect(screen.queryByText('TRIADS')).not.toBeInTheDocument()
    // Chips still render
    expect(screen.getByText('Modes of major')).toBeInTheDocument()
    expect(screen.getByText('Melodic minor')).toBeInTheDocument()
  })

  it('renders group labels and chips for both groups without divider redundancy', () => {
    // 2 groups → 2 labels and 3 chips total.
    // If this renders correctly (labels + chips all present), the structure is valid.
    renderChipRow()
    expect(screen.getByText('TRIADS')).toBeInTheDocument()
    expect(screen.getByText('SIXTHS')).toBeInTheDocument()
    expect(screen.getAllByRole('button').filter((b) => b.hasAttribute('data-chip-id'))).toHaveLength(3)
  })

  it('renders chips as <button> elements', () => {
    renderChipRow()
    const buttons = screen.getAllByRole('button')
    // Cmaj + Cm + C6 = 3 chip buttons
    const chipButtons = buttons.filter((b) => b.hasAttribute('data-chip-id'))
    expect(chipButtons).toHaveLength(3)
  })

  it('wraps the row in a <nav> with the provided aria-label', () => {
    renderChipRow({ navLabel: 'Scale categories' })
    expect(screen.getByRole('navigation', { name: 'Scale categories' })).toBeInTheDocument()
  })

  it('renders all chips for a single-group chip set (no groups to divide)', () => {
    renderChipRow({ chipGroups: SCALES_CHIP_GROUPS })
    // Both chips present with no crash — single group means no inter-group divider.
    expect(screen.getByText('Modes of major')).toBeInTheDocument()
    expect(screen.getByText('Melodic minor')).toBeInTheDocument()
  })
})

// ─── aria-current ──────────────────────────────────────────────────────────────

describe('ChipRow — aria-current', () => {
  it('first chip has aria-current="true" on initial render (no scroll)', () => {
    renderChipRow()
    const first = screen.getByRole('button', { name: 'Cmaj' })
    expect(first).toHaveAttribute('aria-current', 'true')
  })

  it('inactive chips do NOT have aria-current attribute (not even "false")', () => {
    renderChipRow()
    const inactive = screen.getByRole('button', { name: 'Cm' })
    // Must be absent — not "false"
    expect(inactive).not.toHaveAttribute('aria-current')
  })

  it('only one chip has aria-current="true" at a time', () => {
    renderChipRow()
    const all = screen.getAllByRole('button').filter((b) => b.hasAttribute('data-chip-id'))
    const active = all.filter((b) => b.getAttribute('aria-current') === 'true')
    expect(active).toHaveLength(1)
  })
})

// ─── Scroll-spy ────────────────────────────────────────────────────────────────

describe('ChipRow — scroll-spy', () => {
  // Create real anchor elements in the document for the scroll-spy to find.
  let anchorMaj: HTMLDivElement
  let anchorM: HTMLDivElement
  let anchor6: HTMLDivElement

  beforeEach(() => {
    anchorMaj = document.createElement('div')
    anchorMaj.id = 'triads-maj'
    anchorM = document.createElement('div')
    anchorM.id = 'triads-m'
    anchor6 = document.createElement('div')
    anchor6.id = 'sixths-6'
    document.body.append(anchorMaj, anchorM, anchor6)
  })

  afterEach(() => {
    anchorMaj.remove()
    anchorM.remove()
    anchor6.remove()
  })

  it('updates active chip when a scroll event fires and a section top is ≤ threshold', () => {
    renderChipRow({ headerHeight: 80 })

    // Stub getBoundingClientRect so sixths-6 is at top=70 (≤ threshold 80).
    vi.spyOn(anchorMaj, 'getBoundingClientRect').mockReturnValue({
      top: -200,
      bottom: -174,
      left: 0,
      right: 100,
      width: 100,
      height: 26,
      x: 0,
      y: -200,
      toJSON: () => ({}),
    })
    vi.spyOn(anchorM, 'getBoundingClientRect').mockReturnValue({
      top: -100,
      bottom: -74,
      left: 0,
      right: 100,
      width: 100,
      height: 26,
      x: 0,
      y: -100,
      toJSON: () => ({}),
    })
    vi.spyOn(anchor6, 'getBoundingClientRect').mockReturnValue({
      top: 70,
      bottom: 96,
      left: 0,
      right: 100,
      width: 100,
      height: 26,
      x: 0,
      y: 70,
      toJSON: () => ({}),
    })

    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })

    // sixths-6 (top=70 ≤ 80) is the last crossing → C6 chip should be active.
    const c6 = screen.getByRole('button', { name: 'C6' })
    expect(c6).toHaveAttribute('aria-current', 'true')

    // Others must not have it.
    expect(screen.getByRole('button', { name: 'Cmaj' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('button', { name: 'Cm' })).not.toHaveAttribute('aria-current')
  })

  it('a chip click locks the spy briefly so the click-initiated scroll cannot override it', () => {
    vi.useFakeTimers()
    try {
      renderChipRow({ headerHeight: 80 })

      // Rects positioned so a scroll WOULD resolve sixths-6 (C6) active.
      vi.spyOn(anchorMaj, 'getBoundingClientRect').mockReturnValue({
        top: -200, bottom: -174, left: 0, right: 100, width: 100, height: 26,
        x: 0, y: -200, toJSON: () => ({}),
      })
      vi.spyOn(anchorM, 'getBoundingClientRect').mockReturnValue({
        top: -100, bottom: -74, left: 0, right: 100, width: 100, height: 26,
        x: 0, y: -100, toJSON: () => ({}),
      })
      vi.spyOn(anchor6, 'getBoundingClientRect').mockReturnValue({
        top: 70, bottom: 96, left: 0, right: 100, width: 100, height: 26,
        x: 0, y: 70, toJSON: () => ({}),
      })

      const cmaj = screen.getByRole('button', { name: 'Cmaj' })
      const c6 = screen.getByRole('button', { name: 'C6' })

      // Click Cmaj → optimistic active + spy lock engaged.
      // fireEvent (not userEvent) is deliberate: userEvent with fake timers advances
      // the click-settle timer internally, which would disarm the lock and defeat this test.
      fireEvent.click(cmaj)
      expect(cmaj).toHaveAttribute('aria-current', 'true')

      // A scroll during the lock window must NOT move active to C6.
      act(() => {
        window.dispatchEvent(new Event('scroll'))
      })
      expect(cmaj).toHaveAttribute('aria-current', 'true')
      expect(c6).not.toHaveAttribute('aria-current')

      // After the settle window expires, normal scroll-spy resumes.
      act(() => {
        vi.advanceTimersByTime(900)
        window.dispatchEvent(new Event('scroll'))
      })
      expect(c6).toHaveAttribute('aria-current', 'true')
      expect(cmaj).not.toHaveAttribute('aria-current')
    } finally {
      vi.useRealTimers()
    }
  })

  it('missing target ids do not crash (gracefully filtered out)', () => {
    // Render with a chip id that has no DOM anchor.
    const groups: ChipGroup[] = [
      { label: 'TEST', chips: [{ id: 'nonexistent-id', label: 'Ghost' }] },
    ]
    // Should not throw during mount or scroll.
    expect(() => {
      renderChipRow({ chipGroups: groups })
      act(() => {
        window.dispatchEvent(new Event('scroll'))
      })
    }).not.toThrow()
  })

  it('removes the scroll listener on unmount', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const removeSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = renderChipRow()

    const addedScrollListeners = addSpy.mock.calls.filter(([event]) => event === 'scroll')
    // ChipRow is rendered standalone here, so it owns every scroll listener.
    expect(addedScrollListeners.length).toBeGreaterThanOrEqual(1)

    unmount()

    const removedScrollListeners = removeSpy.mock.calls.filter(([event]) => event === 'scroll')
    // Exact parity (not ≥1): every scroll listener ChipRow added must be
    // removed — a future leak (add 2, remove 1) would slip past a ≥1 check.
    expect(removedScrollListeners.length).toBe(addedScrollListeners.length)

    addSpy.mockRestore()
    removeSpy.mockRestore()
  })
})

// ─── Click behavior ────────────────────────────────────────────────────────────

describe('ChipRow — click behavior', () => {
  let anchorEl: HTMLDivElement

  beforeEach(() => {
    anchorEl = document.createElement('div')
    anchorEl.id = 'triads-maj'
    document.body.appendChild(anchorEl)
  })

  afterEach(() => {
    anchorEl.remove()
  })

  it('calls onChipActivate with the chip id when a chip is clicked', async () => {
    const onChipActivate = vi.fn()
    renderChipRow({ onChipActivate })
    await userEvent.click(screen.getByRole('button', { name: 'Cmaj' }))
    expect(onChipActivate).toHaveBeenCalledWith('triads-maj')
  })

  it('optimistically marks the clicked chip active (no spy jitter during smooth scroll)', async () => {
    renderChipRow()
    // The first chip (Cmaj) is active by default. Click a DIFFERENT chip (Cm,
    // whose anchor isn't in the DOM here — scrollIntoView is guarded). It must
    // become aria-current="true" immediately, not after the scroll settles
    // (guards the click→smooth-scroll→spy bounce).
    const cm = screen.getByRole('button', { name: 'Cm' })
    expect(cm).not.toHaveAttribute('aria-current', 'true')
    await userEvent.click(cm)
    expect(cm).toHaveAttribute('aria-current', 'true')
  })

  it('calls scrollIntoView on the target element when a chip is clicked', async () => {
    const scrollIntoViewMock = vi.fn()
    anchorEl.scrollIntoView = scrollIntoViewMock

    renderChipRow()
    await userEvent.click(screen.getByRole('button', { name: 'Cmaj' }))

    expect(scrollIntoViewMock).toHaveBeenCalledOnce()
    expect(scrollIntoViewMock).toHaveBeenCalledWith(
      expect.objectContaining({ block: 'start' }),
    )
  })

  it('does not crash when clicking a chip with no DOM anchor', async () => {
    // The chip id has no anchor in the DOM.
    const groups: ChipGroup[] = [
      { label: 'TEST', chips: [{ id: 'missing-anchor', label: 'Ghost' }] },
    ]
    renderChipRow({ chipGroups: groups })
    // Should not throw.
    await expect(userEvent.click(screen.getByRole('button', { name: 'Ghost' }))).resolves
      .toBeUndefined()
  })
})

// ─── Reduced motion ────────────────────────────────────────────────────────────

describe('ChipRow — prefers-reduced-motion', () => {
  let anchorEl: HTMLDivElement

  beforeEach(() => {
    anchorEl = document.createElement('div')
    anchorEl.id = 'triads-maj'
    document.body.appendChild(anchorEl)
  })

  afterEach(() => {
    anchorEl.remove()
    vi.unstubAllGlobals()
  })

  it('calls scrollIntoView with behavior:"instant" when reduced motion is requested', async () => {
    const mql = {
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    }
    vi.stubGlobal('matchMedia', vi.fn(() => mql as unknown as MediaQueryList))

    const scrollIntoViewMock = vi.fn()
    anchorEl.scrollIntoView = scrollIntoViewMock

    renderChipRow()
    await userEvent.click(screen.getByRole('button', { name: 'Cmaj' }))

    expect(scrollIntoViewMock).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'instant' }),
    )
  })
})
