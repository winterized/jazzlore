// StickyHeader — PWA install button slot.
//
// The install button is gated on all three install-* props being provided
// (apps that don't ship a PWA simply don't pass them). When provided, the
// button mounts next to the theme toggle.

import { render, screen } from '@testing-library/react'
import type { ComponentType, ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import StickyHeader, { type ChipGroup } from './StickyHeader'
import type { RootOption } from './RootPicker'
import { __resetPwaInstallForTests } from './usePwaInstall'

const ROOT_OPTIONS: readonly RootOption[] = [{ value: 'C', label: 'C' }]
const CHIPS: ChipGroup[] = [
  { label: 'TRIADS', chips: [{ id: 'maj', label: 'Cmaj' }] },
]

const PlainLink: ComponentType<{
  href: string
  className?: string
  children: ReactNode
}> = ({ href, children, className }) => (
  <a href={href} className={className}>
    {children}
  </a>
)

const DESKTOP_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

function setNavigator(): void {
  Object.defineProperty(window.navigator, 'userAgent', {
    value: DESKTOP_UA,
    configurable: true,
  })
  Object.defineProperty(window.navigator, 'maxTouchPoints', {
    value: 0,
    configurable: true,
  })
  Object.defineProperty(window.navigator, 'platform', {
    value: 'MacIntel',
    configurable: true,
  })
}

beforeEach(() => {
  __resetPwaInstallForTests()
  setNavigator()
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

afterEach(() => {
  vi.unstubAllGlobals()
})

function baseProps() {
  return {
    title: 'Scales',
    LinkComponent: PlainLink,
    utilLink: { label: 'My collection', href: '/collection' },
    theme: 'dark' as const,
    onThemeToggle: () => {},
    rootOptions: ROOT_OPTIONS,
    selectedRoot: 'C',
    onRootChange: () => {},
    chipGroups: CHIPS,
  }
}

describe('StickyHeader — PWA install slot', () => {
  it('does NOT render an install button when no install props are passed', () => {
    render(<StickyHeader {...baseProps()} />)
    expect(
      screen.queryByRole('button', { name: /install/i }),
    ).not.toBeInTheDocument()
  })

  it('renders the install button when all three install-* props are passed', () => {
    render(
      <StickyHeader
        {...baseProps()}
        installAppName="Scales"
        installAppIconHref="/icons/icon-192.png"
        installAppAccent="#6f8caa"
      />,
    )
    expect(
      screen.getByRole('button', { name: /install scales/i }),
    ).toBeInTheDocument()
  })

  it('omits the install button if only some of the install props are passed', () => {
    render(
      <StickyHeader
        {...baseProps()}
        installAppName="Scales"
        // missing installAppIconHref + installAppAccent
      />,
    )
    expect(
      screen.queryByRole('button', { name: /install/i }),
    ).not.toBeInTheDocument()
  })
})
