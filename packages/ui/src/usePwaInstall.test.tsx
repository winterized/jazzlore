// usePwaInstall — platform detection + beforeinstallprompt capture +
// requestInstall integration.

import { act, render, renderHook, screen } from '@testing-library/react'
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

function setCapacitor(isNativePlatform: (() => boolean) | undefined): void {
  Object.defineProperty(window, 'Capacitor', {
    value: isNativePlatform === undefined ? {} : { isNativePlatform },
    configurable: true,
  })
}

function clearCapacitor(): void {
  if (Object.prototype.hasOwnProperty.call(window, 'Capacitor')) {
    Reflect.deleteProperty(window, 'Capacitor')
  }
}

beforeEach(() => {
  __resetPwaInstallForTests()
  setStandaloneDisplayMode(false)
  clearCapacitor()
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
  clearCapacitor()
})

describe('usePwaInstall — platform detection', () => {
  it.each<{ ua: string; touch?: number; expected: PwaInstallPlatform }>([
    { ua: IOS_UA, expected: 'ios' },
    { ua: IPAD_UA, touch: 5, expected: 'ios' },
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

describe('usePwaInstall — native app detection', () => {
  it('returns isNativeApp=true inside the Capacitor native shell', () => {
    setNavigator({ userAgent: IOS_UA })
    setCapacitor(() => true)
    const { result } = renderHook(() => usePwaInstall())
    expect(result.current.isNativeApp).toBe(true)
  })

  it('returns isNativeApp=false on a regular browser tab (no Capacitor)', () => {
    setNavigator({ userAgent: DESKTOP_UA })
    const { result } = renderHook(() => usePwaInstall())
    expect(result.current.isNativeApp).toBe(false)
  })

  it('returns isNativeApp=false when isNativePlatform() reports false', () => {
    setNavigator({ userAgent: ANDROID_UA })
    setCapacitor(() => false)
    const { result } = renderHook(() => usePwaInstall())
    expect(result.current.isNativeApp).toBe(false)
  })

  it('returns isNativeApp=false when Capacitor lacks isNativePlatform', () => {
    setNavigator({ userAgent: IOS_UA })
    setCapacitor(undefined)
    const { result } = renderHook(() => usePwaInstall())
    expect(result.current.isNativeApp).toBe(false)
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
    render(
      <>
        <Probe tag="a" />
        <Probe tag="b" />
      </>,
    )
    expect(screen.getByTestId('a').textContent).toBe('desktop-no-prompt')
    expect(screen.getByTestId('b').textContent).toBe('desktop-no-prompt')

    dispatchBeforeInstallPrompt()

    expect(screen.getByTestId('a').textContent).toBe('desktop-prompt')
    expect(screen.getByTestId('b').textContent).toBe('desktop-prompt')
  })
})
