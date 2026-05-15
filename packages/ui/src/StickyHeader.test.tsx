import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import type { ComponentType, ReactNode } from 'react'
import StickyHeader, { type ChipGroup } from './StickyHeader'
import type { RootOption } from './RootPicker'

// ─── Shared fixtures ───────────────────────────────────────────────────────────

const ROOT_OPTIONS: readonly RootOption[] = [
  { value: 'C', label: 'C' },
  { value: 'Db', label: 'D♭' },
]

const CHIP_GROUPS: ChipGroup[] = [
  {
    label: 'TRIADS',
    chips: [
      { id: 'maj', label: 'Cmaj' },
      { id: 'm', label: 'Cm' },
    ],
  },
  {
    label: 'SIXTHS',
    chips: [{ id: '6', label: 'C6' }],
  },
]

/**
 * A custom LinkComponent that renders a distinct element so tests can assert
 * the injected component is what gets rendered — not a bare <a> emitted by
 * the header itself.
 */
const CustomLink: ComponentType<{ href: string; className?: string; children: ReactNode }> = ({
  href,
  children,
  className,
}) => (
  <a href={href} data-testid="custom-link" className={className}>
    {children}
  </a>
)

const PlainLink: ComponentType<{ href: string; className?: string; children: ReactNode }> = ({
  href,
  children,
  className,
}) => (
  <a href={href} className={className}>
    {children}
  </a>
)

function renderHeader(overrides: Partial<Parameters<typeof StickyHeader>[0]> = {}) {
  return render(
    <StickyHeader
      title="C chords"
      LinkComponent={PlainLink}
      utilLink={{ label: 'My collection', href: '/collection' }}
      theme="dark"
      onThemeToggle={() => {}}
      rootOptions={ROOT_OPTIONS}
      selectedRoot="C"
      onRootChange={() => {}}
      chipGroups={CHIP_GROUPS}
      {...overrides}
    />,
  )
}

// ─── Rendering ─────────────────────────────────────────────────────────────────

describe('StickyHeader — rendering', () => {
  it('renders the title in an <h1>', () => {
    renderHeader({ title: 'C chords' })
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveTextContent('C chords')
  })

  it('renders chip group labels', () => {
    renderHeader()
    expect(screen.getByText('TRIADS')).toBeInTheDocument()
    expect(screen.getByText('SIXTHS')).toBeInTheDocument()
  })

  it('renders chip labels from chipGroups', () => {
    renderHeader()
    expect(screen.getByText('Cmaj')).toBeInTheDocument()
    expect(screen.getByText('Cm')).toBeInTheDocument()
    expect(screen.getByText('C6')).toBeInTheDocument()
  })

  it('renders the util link label', () => {
    renderHeader({ utilLink: { label: 'My collection', href: '/collection' } })
    expect(screen.getByText('My collection')).toBeInTheDocument()
  })

  it('renders the selected root as an active radio button in the inline picker', () => {
    renderHeader({ selectedRoot: 'C' })
    const radio = screen.getByRole('radio', { name: 'C' })
    expect(radio).toHaveAttribute('aria-checked', 'true')
  })
})

// ─── LinkComponent injection ──────────────────────────────────────────────────

describe('StickyHeader — util pill uses injected LinkComponent', () => {
  it('renders the custom LinkComponent for the util link', () => {
    renderHeader({ LinkComponent: CustomLink })
    // The injected component uses data-testid="custom-link"
    expect(screen.getByTestId('custom-link')).toBeInTheDocument()
  })

  it('does NOT render a bare <a> element produced by the header itself', () => {
    renderHeader({ LinkComponent: CustomLink })
    // All rendered <a> elements visible in the accessibility tree must carry
    // data-testid="custom-link" — i.e., they all came from the CustomLink injection.
    const links = screen.getAllByRole('link')
    for (const link of links) {
      expect(link).toHaveAttribute('data-testid', 'custom-link')
    }
  })

  it('passes the href and label to the LinkComponent', () => {
    renderHeader({
      LinkComponent: CustomLink,
      utilLink: { label: 'My scales', href: '/scales' },
    })
    const link = screen.getByTestId('custom-link')
    expect(link).toHaveAttribute('href', '/scales')
    expect(link).toHaveTextContent('My scales')
  })

  // Design-match regression (Phase 9): the handoff's mobile Row-1-right is
  // ONLY the compact root pill + theme toggle — the util pill is desktop-only
  // (README mobile anatomy table; mobile mockups 05–08 carry no util pill).
  // The pill is always mounted (a11y/SSR-stable) but CSS-gated to ≥640px,
  // same `hidden`/`sm:` pattern as the dual root pickers. jsdom can't evaluate
  // the media query, so assert the class contract instead — this fails loudly
  // if the desktop-only gating is ever dropped and the pill leaks onto mobile.
  it('gates the util pill to desktop only (hidden below the sm breakpoint)', () => {
    renderHeader({
      LinkComponent: CustomLink,
      utilLink: { label: 'My scales', href: '/scales' },
    })
    const link = screen.getByTestId('custom-link')
    expect(link.className).toContain('hidden')
    expect(link.className).toContain('sm:inline-flex')
  })
})

// ─── Theme button ──────────────────────────────────────────────────────────────

describe('StickyHeader — theme button', () => {
  it('shows ☀︎ when theme is dark', () => {
    renderHeader({ theme: 'dark' })
    expect(screen.getByText('☀︎')).toBeInTheDocument()
  })

  it('shows ☾ when theme is light', () => {
    renderHeader({ theme: 'light' })
    expect(screen.getByText('☾')).toBeInTheDocument()
  })

  it('aria-pressed is true when theme is dark', () => {
    renderHeader({ theme: 'dark' })
    const btn = screen.getByRole('button', { name: /toggle theme/i })
    expect(btn).toHaveAttribute('aria-pressed', 'true')
  })

  it('aria-pressed is false when theme is light', () => {
    renderHeader({ theme: 'light' })
    const btn = screen.getByRole('button', { name: /toggle theme/i })
    expect(btn).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onThemeToggle when the button is clicked', async () => {
    const onThemeToggle = vi.fn()
    renderHeader({ onThemeToggle })
    await userEvent.click(screen.getByRole('button', { name: /toggle theme/i }))
    expect(onThemeToggle).toHaveBeenCalledOnce()
  })
})

// ─── Scroll-reactive data-scrolled attribute ───────────────────────────────────

describe('StickyHeader — scroll-reactive title', () => {
  beforeEach(() => {
    // Reset scrollY before each test
    Object.defineProperty(window, 'scrollY', { writable: true, configurable: true, value: 0 })
  })

  afterEach(() => {
    Object.defineProperty(window, 'scrollY', { writable: true, configurable: true, value: 0 })
  })

  it('data-scrolled is "false" on initial render (scrollY = 0)', () => {
    renderHeader()
    expect(screen.getByRole('banner')).toHaveAttribute('data-scrolled', 'false')
  })

  it('data-scrolled flips to "true" when scrollY crosses 24', () => {
    renderHeader()

    act(() => {
      Object.defineProperty(window, 'scrollY', { writable: true, configurable: true, value: 25 })
      window.dispatchEvent(new Event('scroll'))
    })

    expect(screen.getByRole('banner')).toHaveAttribute('data-scrolled', 'true')
  })

  it('data-scrolled returns to "false" when scrollY drops back to 0', () => {
    renderHeader()

    act(() => {
      Object.defineProperty(window, 'scrollY', { writable: true, configurable: true, value: 25 })
      window.dispatchEvent(new Event('scroll'))
    })
    expect(screen.getByRole('banner')).toHaveAttribute('data-scrolled', 'true')

    act(() => {
      Object.defineProperty(window, 'scrollY', { writable: true, configurable: true, value: 0 })
      window.dispatchEvent(new Event('scroll'))
    })
    expect(screen.getByRole('banner')).toHaveAttribute('data-scrolled', 'false')
  })

  it('data-scrolled does not flip when scrollY is exactly 24 (boundary)', () => {
    renderHeader()

    act(() => {
      Object.defineProperty(window, 'scrollY', { writable: true, configurable: true, value: 24 })
      window.dispatchEvent(new Event('scroll'))
    })

    expect(screen.getByRole('banner')).toHaveAttribute('data-scrolled', 'false')
  })
})

// ─── Scroll listener cleanup ───────────────────────────────────────────────────

describe('StickyHeader — scroll listener cleanup', () => {
  it('removes the scroll listener on unmount', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const removeSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = renderHeader()

    // At least one scroll listener is registered (StickyHeader and ChipRow
    // each register their own — so there may be more than 1).
    const addedScrollListeners = addSpy.mock.calls.filter(([event]) => event === 'scroll')
    expect(addedScrollListeners.length).toBeGreaterThanOrEqual(1)

    unmount()

    // Every added listener must be removed — add:remove counts are equal,
    // proving no listener leaks regardless of how many sub-components add one.
    const removedScrollListeners = removeSpy.mock.calls.filter(([event]) => event === 'scroll')
    expect(removedScrollListeners).toHaveLength(addedScrollListeners.length)

    addSpy.mockRestore()
    removeSpy.mockRestore()
  })
})

// ─── Chip activation ──────────────────────────────────────────────────────────

describe('StickyHeader — chip activation', () => {
  it('calls onChipActivate with the chip id when a chip is clicked', async () => {
    const onChipActivate = vi.fn()
    renderHeader({ onChipActivate })
    await userEvent.click(screen.getByText('Cmaj'))
    expect(onChipActivate).toHaveBeenCalledWith('maj')
  })
})

// ─── Reduced motion ────────────────────────────────────────────────────────────

describe('StickyHeader — prefers-reduced-motion', () => {
  it('strips the title transition when reduced motion is requested', () => {
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
    // jsdom doesn't define window.matchMedia, so stub it as a global.
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => mql as unknown as MediaQueryList),
    )

    renderHeader()
    const title = screen.getByRole('heading', { level: 1 })
    // With reduced motion, the font-size/opacity transition class is omitted.
    expect(title.className).not.toMatch(/transition-/)

    vi.unstubAllGlobals()
  })
})
