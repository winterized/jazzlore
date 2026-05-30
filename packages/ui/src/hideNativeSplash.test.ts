// hideNativeSplashAfterMount — hides the Capacitor splash in the native shell,
// no-op in the browser.

import { afterEach, describe, expect, it, vi } from 'vitest'
import { hideNativeSplashAfterMount } from './hideNativeSplash'

function setCapacitor(native: boolean, hide = vi.fn(() => Promise.resolve())) {
  Object.defineProperty(window, 'Capacitor', {
    value: { isNativePlatform: () => native, Plugins: { SplashScreen: { hide } } },
    configurable: true,
  })
  return hide
}

afterEach(() => {
  if (Object.prototype.hasOwnProperty.call(window, 'Capacitor')) {
    Reflect.deleteProperty(window, 'Capacitor')
  }
  vi.useRealTimers()
})

describe('hideNativeSplashAfterMount', () => {
  it('calls SplashScreen.hide() in the native shell, after the hold (not synchronously)', () => {
    vi.useFakeTimers()
    const hide = setCapacitor(true)
    hideNativeSplashAfterMount(800)
    expect(hide).not.toHaveBeenCalled() // waits for paint + min-hold
    vi.runAllTimers()
    expect(hide).toHaveBeenCalledTimes(1)
  })

  it('is a no-op in a regular browser (not native)', () => {
    vi.useFakeTimers()
    const hide = setCapacitor(false)
    hideNativeSplashAfterMount(800)
    vi.runAllTimers()
    expect(hide).not.toHaveBeenCalled()
  })

  it('does not throw when the SplashScreen plugin is absent', () => {
    vi.useFakeTimers()
    Object.defineProperty(window, 'Capacitor', {
      value: { isNativePlatform: () => true },
      configurable: true,
    })
    expect(() => {
      hideNativeSplashAfterMount(800)
      vi.runAllTimers()
    }).not.toThrow()
  })
})
