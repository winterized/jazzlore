// InstallOrAppStoreButton — the header install slot's decision wiring:
//   iOS browser + live app  → App Store badge (a link to apps.apple.com)
//   iOS browser + unshipped  → PWA install button
//   non-iOS browser          → PWA install button
//   native shell / standalone → nothing
//
// Mirrors PwaInstallButton.test.tsx's navigator/Capacitor/standalone stubbing.

import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InstallOrAppStoreButton } from './InstallOrAppStoreButton'
import { __resetPwaInstallForTests } from './usePwaInstall'

const DESKTOP_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'

function setUA(userAgent: string): void {
  Object.defineProperty(window.navigator, 'userAgent', {
    value: userAgent,
    configurable: true,
  })
  Object.defineProperty(window.navigator, 'maxTouchPoints', {
    value: 0,
    configurable: true,
  })
  Object.defineProperty(window.navigator, 'platform', {
    value: /iPhone/.test(userAgent) ? 'iPhone' : 'MacIntel',
    configurable: true,
  })
}

function setStandalone(matches: boolean): void {
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: q.includes('display-mode: standalone') ? matches : false,
    media: q,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    onchange: null,
    dispatchEvent: vi.fn(),
  }))
}

const METRONOME = {
  appStoreKey: 'metronome' as const, // available: true
  appName: 'Metronome',
  appIconHref: '/icons/icon-192.png',
  appAccent: '#a06b6b' as `#${string}`,
}
const CHORDS = { ...METRONOME, appStoreKey: 'chords' as const, appName: 'Chords' } // available: false

beforeEach(() => {
  __resetPwaInstallForTests()
  setStandalone(false)
  if (Object.prototype.hasOwnProperty.call(window, 'Capacitor')) {
    Reflect.deleteProperty(window, 'Capacitor')
  }
  if (Object.prototype.hasOwnProperty.call(window.navigator, 'standalone')) {
    Object.defineProperty(window.navigator, 'standalone', {
      value: undefined,
      configurable: true,
    })
  }
})
afterEach(() => {
  vi.unstubAllGlobals()
  if (Object.prototype.hasOwnProperty.call(window, 'Capacitor')) {
    Reflect.deleteProperty(window, 'Capacitor')
  }
})

describe('InstallOrAppStoreButton', () => {
  it('iOS browser + live app → App Store badge link to the listing', () => {
    setUA(IPHONE_UA)
    render(<InstallOrAppStoreButton {...METRONOME} />)
    const link = screen.getByRole('link', {
      name: /download metronome on the app store/i,
    })
    expect(link).toHaveAttribute('href', 'https://apps.apple.com/app/id6774656363')
    // Same-tab (Universal Link hand-off) — no new-tab target.
    expect(link).not.toHaveAttribute('target')
    expect(screen.queryByRole('button', { name: /install/i })).toBeNull()
  })

  it('iOS browser + NOT-yet-shipped app → PWA install button', () => {
    setUA(IPHONE_UA)
    render(<InstallOrAppStoreButton {...CHORDS} />)
    expect(
      screen.getByRole('button', { name: /install chords/i }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /app store/i })).toBeNull()
  })

  it('non-iOS browser (desktop) → PWA install button even for a live app', () => {
    setUA(DESKTOP_UA)
    render(<InstallOrAppStoreButton {...METRONOME} />)
    expect(
      screen.getByRole('button', { name: /install metronome/i }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /app store/i })).toBeNull()
  })

  it('native shell → renders nothing', () => {
    setUA(IPHONE_UA)
    Object.defineProperty(window, 'Capacitor', {
      value: { isNativePlatform: () => true },
      configurable: true,
    })
    const { container } = render(<InstallOrAppStoreButton {...METRONOME} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('installed PWA (standalone) → renders nothing', () => {
    setUA(IPHONE_UA)
    setStandalone(true)
    const { container } = render(<InstallOrAppStoreButton {...METRONOME} />)
    expect(container).toBeEmptyDOMElement()
  })
})
