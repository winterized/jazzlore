// PwaInstallButton — hidden when standalone, opens the sheet on click,
// passes app props through.

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
import { PwaInstallButton } from './PwaInstallButton'
import { __resetPwaInstallForTests } from './usePwaInstall'

const DESKTOP_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

function setNavigator(userAgent: string, standalone?: boolean): void {
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
  if (standalone !== undefined) {
    Object.defineProperty(window.navigator, 'standalone', {
      value: standalone,
      configurable: true,
    })
  }
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

const PROPS = {
  appName: 'Scales',
  appIconHref: '/icons/icon-192.png',
  appAccent: '#6f8caa' as `#${string}`,
}

beforeEach(() => {
  __resetPwaInstallForTests()
  setStandaloneDisplayMode(false)
  if (Object.prototype.hasOwnProperty.call(window.navigator, 'standalone')) {
    Object.defineProperty(window.navigator, 'standalone', {
      value: undefined,
      configurable: true,
    })
  }
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('PwaInstallButton', () => {
  it('renders the button with a descriptive aria-label', () => {
    setNavigator(DESKTOP_UA)
    render(<PwaInstallButton {...PROPS} />)
    const btn = screen.getByRole('button', { name: /install scales/i })
    expect(btn).toBeInTheDocument()
    expect(btn).toHaveAttribute('aria-haspopup', 'dialog')
    expect(btn).toHaveAttribute('aria-expanded', 'false')
  })

  it('is hidden when the app is running in standalone mode', () => {
    setNavigator(DESKTOP_UA)
    setStandaloneDisplayMode(true)
    const { container } = render(<PwaInstallButton {...PROPS} />)
    // No button mounted at all — keeps the header from having a redundant
    // install affordance in an already-installed PWA.
    expect(container).toBeEmptyDOMElement()
  })

  it.each<{ ua: string; browser: string }>([
    {
      ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0.6367.111 Mobile/15E148 Safari/604.1',
      browser: 'Chrome',
    },
    {
      ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/124.0 Mobile/15E148 Safari/605.1.15',
      browser: 'Firefox',
    },
    {
      ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 EdgiOS/124.0 Mobile/15E148 Safari/604.1',
      browser: 'Edge',
    },
  ])(
    'is hidden in iOS $browser (install requires Safari; non-Safari iOS browsers also cannot see Safari-installed PWAs)',
    ({ ua }) => {
      setNavigator(ua)
      const { container } = render(<PwaInstallButton {...PROPS} />)
      expect(container).toBeEmptyDOMElement()
    },
  )

  it('opens the install sheet on click and flips aria-expanded', async () => {
    setNavigator(DESKTOP_UA)
    const user = userEvent.setup()
    render(<PwaInstallButton {...PROPS} />)
    const btn = screen.getByRole('button', { name: /install scales/i })
    await user.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: /install scales/i }),
    ).toBeInTheDocument()
  })

  it('closes the sheet when the close button is clicked', async () => {
    setNavigator(DESKTOP_UA)
    const user = userEvent.setup()
    render(<PwaInstallButton {...PROPS} />)
    await user.click(screen.getByRole('button', { name: /install scales/i }))
    await user.click(
      screen.getByRole('button', { name: /close install instructions/i }),
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes the sheet on Escape', async () => {
    setNavigator(DESKTOP_UA)
    const user = userEvent.setup()
    render(<PwaInstallButton {...PROPS} />)
    await user.click(screen.getByRole('button', { name: /install scales/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      )
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
