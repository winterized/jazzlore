// isNativeApp — detection of the Capacitor native shell via window.Capacitor.

import { afterEach, describe, expect, it } from 'vitest'
import { isNativeApp } from './isNativeApp'

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

afterEach(clearCapacitor)

describe('isNativeApp', () => {
  it('returns true inside the Capacitor native shell', () => {
    setCapacitor(() => true)
    expect(isNativeApp()).toBe(true)
  })

  it('returns false on a regular browser tab (no Capacitor)', () => {
    clearCapacitor()
    expect(isNativeApp()).toBe(false)
  })

  it('returns false when isNativePlatform() reports false', () => {
    setCapacitor(() => false)
    expect(isNativeApp()).toBe(false)
  })

  it('returns false when Capacitor exists but lacks isNativePlatform', () => {
    setCapacitor(undefined)
    expect(isNativeApp()).toBe(false)
  })
})
