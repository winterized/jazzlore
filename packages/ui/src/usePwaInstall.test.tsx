// usePwaInstall — platform detection + beforeinstallprompt capture +
// requestInstall integration.

import { act, render, renderHook } from '@testing-library/react'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import {
  __resetPwaInstallForTests,
  usePwaInstall,
  type PwaInstallPlatform,
} from './usePwaInstall'

const IOS_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
const IOS_CHROME_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0.6367.111 Mobile/15E148 Safari/604.1'
const IOS_FIREFOX_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/124.0 Mobile/15E148 Safari/605.1.15'
const IOS_EDGE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 EdgiOS/124.0.2478.51 Mobile/15E148 Safari/604.1'
const IOS_DUCKDUCKGO_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 DuckDuckGo/7 Safari/605.1.15'
const IOS_YANDEX_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 YaBrowser/24.4 YaApp_iOS/24.4 YaApp_iOS_Browser/24.4 Safari/605.1.15'
const IPAD_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15'
const ANDROID_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
const DESKTOP_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

function setNavigator(overrides: {
  userAgent: string
  maxTouchPoints?: number
  platform?: string
  standalone?: boolean
}): void {
  Object.defineProperty(window.navigator, 'userAgent', {
    value: overrides.userAgent,
    configurable: true,
  })
  Object.defineProperty(window.navigator, 'maxTouchPoints', {
    value: overrides.maxTouchPoints ?? 0,
    configurable: true,
  })
  Object.defineProperty(window.navigator, 'platform', {
    value: overrides.platform ?? 'MacIntel',
    configurable: true,
  })
  if (overrides.standalone !== undefined) {
    Object.defineProperty(window.navigator, 'standalone', {
      value: overrides.standalone,
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

function dispatchBeforeInstallPrompt(
  prompt = vi.fn(async () => undefined),
  userChoice = Promise.resolve({ outcome: 'accepted' as const }),
): { prompt: ReturnType<typeof vi.fn> } {
  const e = new Event('beforeinstallprompt') as Event & {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
    platforms: ReadonlyArray<string>
  }
  e.prompt = prompt
  e.userChoice = userChoice
  ;(e as { platforms: ReadonlyArray<string> }).platforms = ['web']
  act(() => {
    window.dispatchEvent(e)
  })
  return { prompt }
}

beforeEach(() => {
  __resetPwaInstallForTests()
  setStandaloneDisplayMode(false)
  // navigator.standalone is set as a configurable property by individual
  // tests — clear it between cases so a prior test leaves no leak.
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

describe('usePwaInstall — platform detection', () => {
  it.each<{ ua: string; touch?: number; expected: PwaInstallPlatform }>([
    { ua: IOS_UA, expected: 'ios' },
    { ua: IPAD_UA, touch: 5, expected: 'ios' },
    { ua: IOS_CHROME_UA, expected: 'ios-non-safari' },
    { ua: IOS_FIREFOX_UA, expected: 'ios-non-safari' },
    { ua: IOS_EDGE_UA, expected: 'ios-non-safari' },
    { ua: IOS_DUCKDUCKGO_UA, expected: 'ios-non-safari' },
    { ua: IOS_YANDEX_UA, expected: 'ios-non-safari' },
    { ua: ANDROID_UA, expected: 'android-no-prompt' },
    { ua: DESKTOP_UA, expected: 'desktop-no-prompt' },
  ])('reports platform "$expected" for UA $ua', ({ ua, touch, expected }) => {
    setNavigator({ userAgent: ua, maxTouchPoints: touch })
    const { result } = renderHook(() => usePwaInstall())
    expect(result.current.platform).toBe(expected)
  })
})

describe('usePwaInstall — beforeinstallprompt capture', () => {
  it('flips Android from no-prompt to prompt when the event fires', () => {
    setNavigator({ userAgent: ANDROID_UA })
    const { result } = renderHook(() => usePwaInstall())
    expect(result.current.platform).toBe('android-no-prompt')
    expect(result.current.requestInstall).toBeNull()

    dispatchBeforeInstallPrompt()

    expect(result.current.platform).toBe('android-prompt')
    expect(result.current.requestInstall).not.toBeNull()
  })

  it('flips desktop from no-prompt to prompt when the event fires', () => {
    setNavigator({ userAgent: DESKTOP_UA })
    const { result } = renderHook(() => usePwaInstall())
    expect(result.current.platform).toBe('desktop-no-prompt')

    dispatchBeforeInstallPrompt()

    expect(result.current.platform).toBe('desktop-prompt')
  })

  it('iOS stays "ios" even if beforeinstallprompt somehow fires', () => {
    setNavigator({ userAgent: IOS_UA })
    const { result } = renderHook(() => usePwaInstall())
    dispatchBeforeInstallPrompt()
    expect(result.current.platform).toBe('ios')
  })
})

describe('usePwaInstall — standalone detection', () => {
  it('returns isStandalone=true when matchMedia(display-mode: standalone) matches', () => {
    setNavigator({ userAgent: DESKTOP_UA })
    setStandaloneDisplayMode(true)
    const { result } = renderHook(() => usePwaInstall())
    expect(result.current.isStandalone).toBe(true)
  })

  it('returns isStandalone=true when navigator.standalone === true (iOS Safari)', () => {
    setNavigator({ userAgent: IOS_UA, standalone: true })
    const { result } = renderHook(() => usePwaInstall())
    expect(result.current.isStandalone).toBe(true)
  })

  it('returns isStandalone=false on a regular browser tab', () => {
    setNavigator({ userAgent: DESKTOP_UA })
    const { result } = renderHook(() => usePwaInstall())
    expect(result.current.isStandalone).toBe(false)
  })
})

describe('usePwaInstall — requestInstall', () => {
  it('calls prompt() then awaits userChoice, then clears the event', async () => {
    setNavigator({ userAgent: ANDROID_UA })
    const { result } = renderHook(() => usePwaInstall())
    const { prompt } = dispatchBeforeInstallPrompt()
    expect(result.current.requestInstall).not.toBeNull()

    await act(async () => {
      await result.current.requestInstall!()
    })

    expect(prompt).toHaveBeenCalledOnce()
    // After resolution the event is consumed; requestInstall becomes null
    // again (a fresh prompt would fire a new event from the browser).
    expect(result.current.requestInstall).toBeNull()
    expect(result.current.platform).toBe('android-no-prompt')
  })

  it('renders multiple subscribers and notifies all of them on the same event', () => {
    setNavigator({ userAgent: DESKTOP_UA })
    // Two independent renders subscribe to the same module-scope event.
    function Probe({ tag }: { tag: string }) {
      const state = usePwaInstall()
      return <div data-testid={tag}>{state.platform}</div>
    }
    const { getByTestId } = render(
      <>
        <Probe tag="a" />
        <Probe tag="b" />
      </>,
    )
    expect(getByTestId('a').textContent).toBe('desktop-no-prompt')
    expect(getByTestId('b').textContent).toBe('desktop-no-prompt')

    dispatchBeforeInstallPrompt()

    expect(getByTestId('a').textContent).toBe('desktop-prompt')
    expect(getByTestId('b').textContent).toBe('desktop-prompt')
  })
})
