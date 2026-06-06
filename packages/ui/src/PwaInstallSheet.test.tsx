// PwaInstallSheet — per-platform content branches, focus-trap on open,
// prompt CTA wiring.

import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { PwaInstallSheet } from './PwaInstallSheet'
import { __resetPwaInstallForTests } from './usePwaInstall'

const IOS_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
const ANDROID_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
const DESKTOP_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

function setNavigator(userAgent: string): void {
  Object.defineProperty(window.navigator, 'userAgent', {
    value: userAgent,
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

function setStandaloneDisplayMode(matches: boolean): void {
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

function dispatchBeforeInstallPrompt(prompt = vi.fn(async () => undefined)) {
  const e = new Event('beforeinstallprompt') as Event & {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
    platforms: ReadonlyArray<string>
  }
  e.prompt = prompt
  e.userChoice = Promise.resolve({ outcome: 'accepted' as const })
  ;(e as { platforms: ReadonlyArray<string> }).platforms = ['web']
  act(() => {
    window.dispatchEvent(e)
  })
  return prompt
}

const PROPS = {
  appName: 'Chords',
  appIconHref: '/icons/icon-192.png',
  appAccent: '#8a72a8' as `#${string}`,
  onClose: vi.fn(),
}

beforeEach(() => {
  __resetPwaInstallForTests()
  setStandaloneDisplayMode(false)
  PROPS.onClose = vi.fn()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('PwaInstallSheet — platform-specific copy', () => {
  it('iOS shows the 3-step Share → Add to Home Screen → Add flow', () => {
    setNavigator(IOS_UA)
    render(<PwaInstallSheet {...PROPS} />)
    expect(
      screen.getByRole('heading', { level: 2, name: /install chords on your iphone/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Share/)).toBeInTheDocument()
    expect(screen.getByText(/Add to Home Screen/)).toBeInTheDocument()
    expect(screen.getByText(/Confirm by tapping/)).toBeInTheDocument()
  })

  it('Android with beforeinstallprompt shows the native Install CTA', () => {
    setNavigator(ANDROID_UA)
    dispatchBeforeInstallPrompt()
    render(<PwaInstallSheet {...PROPS} />)
    expect(
      screen.getByRole('button', { name: /^install chords$/i }),
    ).toBeInTheDocument()
  })

  it('Android without beforeinstallprompt shows the menu instructions', () => {
    setNavigator(ANDROID_UA)
    render(<PwaInstallSheet {...PROPS} />)
    expect(
      screen.getByRole('heading', { level: 2, name: /install chords on your android/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Install app/)).toBeInTheDocument()
  })

  it('desktop with beforeinstallprompt shows the Install CTA', () => {
    setNavigator(DESKTOP_UA)
    dispatchBeforeInstallPrompt()
    render(<PwaInstallSheet {...PROPS} />)
    expect(
      screen.getByRole('button', { name: /^install chords$/i }),
    ).toBeInTheDocument()
  })

  it('desktop without prompt shows the address-bar fallback copy', () => {
    setNavigator(DESKTOP_UA)
    render(<PwaInstallSheet {...PROPS} />)
    expect(
      screen.getByText(/address bar/i),
    ).toBeInTheDocument()
  })
})

describe('PwaInstallSheet — App Store offer (iOS + available app)', () => {
  const METRO = {
    ...PROPS,
    appName: 'Metronome',
    appStoreKey: 'metronome' as const, // available: true
  }

  it('iOS + available app → shows the App Store badge instead of PWA steps', () => {
    setNavigator(IOS_UA)
    render(<PwaInstallSheet {...METRO} />)
    const link = screen.getByRole('link', {
      name: /download metronome on the app store/i,
    })
    expect(link).toHaveAttribute(
      'href',
      'https://apps.apple.com/app/id6774656363',
    )
    // Same-tab → Universal Link hand-off to the App Store app.
    expect(link).not.toHaveAttribute('target')
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /get metronome on the app store/i,
      }),
    ).toBeInTheDocument()
    // The PWA "Add to Home Screen" instructions are replaced, not shown.
    expect(screen.queryByText(/Add to Home Screen/)).toBeNull()
  })

  it('iOS + NOT-yet-available app (chords) → keeps the PWA instructions', () => {
    setNavigator(IOS_UA)
    render(<PwaInstallSheet {...PROPS} appStoreKey="chords" />)
    expect(screen.getByText(/Add to Home Screen/)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /app store/i })).toBeNull()
  })

  it('iOS + no appStoreKey (e.g. musicians) → keeps the PWA instructions', () => {
    setNavigator(IOS_UA)
    render(<PwaInstallSheet {...PROPS} />)
    expect(screen.getByText(/Add to Home Screen/)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /app store/i })).toBeNull()
  })

  it('desktop + available app → PWA flow (the App Store link is iOS-only)', () => {
    setNavigator(DESKTOP_UA)
    render(<PwaInstallSheet {...METRO} />)
    expect(screen.queryByRole('link', { name: /app store/i })).toBeNull()
    expect(screen.getByText(/address bar/i)).toBeInTheDocument()
  })
})

describe('PwaInstallSheet — interaction', () => {
  it('clicking the backdrop calls onClose', async () => {
    setNavigator(DESKTOP_UA)
    const user = userEvent.setup()
    render(<PwaInstallSheet {...PROPS} />)
    await user.click(screen.getByTestId('pwa-install-backdrop'))
    expect(PROPS.onClose).toHaveBeenCalled()
  })

  it('calls requestInstall and then closes when the user clicks Install', async () => {
    setNavigator(ANDROID_UA)
    const prompt = dispatchBeforeInstallPrompt()
    const user = userEvent.setup()
    render(<PwaInstallSheet {...PROPS} />)
    await user.click(screen.getByRole('button', { name: /^install chords$/i }))
    expect(prompt).toHaveBeenCalledOnce()
    expect(PROPS.onClose).toHaveBeenCalled()
  })

  it('renders the app icon at the top of the sheet', () => {
    setNavigator(DESKTOP_UA)
    render(<PwaInstallSheet {...PROPS} />)
    const img = screen.getByRole('presentation', { hidden: true })
    // alt="" → an empty-alt <img> is "presentational" per ARIA.
    expect(img).toHaveAttribute('src', '/icons/icon-192.png')
  })

  it('uses the app accent color on the primary CTA', () => {
    setNavigator(ANDROID_UA)
    dispatchBeforeInstallPrompt()
    render(<PwaInstallSheet {...PROPS} />)
    const cta = screen.getByRole('button', { name: /^install chords$/i })
    expect(cta).toHaveStyle({ backgroundColor: '#8a72a8' })
  })
})
