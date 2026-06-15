import { describe, expect, it } from 'vitest'
import {
  APP_STORE_LINKS,
  chooseInstallAffordance,
  type PwaInstallPlatform,
} from './index'

const base = {
  isNativeApp: false,
  isStandalone: false,
  available: true,
} as const

describe('chooseInstallAffordance', () => {
  it('iOS browser + available app → App Store badge', () => {
    expect(
      chooseInstallAffordance({ ...base, platform: 'ios', available: true }),
    ).toBe('app-store')
  })

  it('iOS browser + NOT-yet-available app → PWA install (current behavior)', () => {
    expect(
      chooseInstallAffordance({ ...base, platform: 'ios', available: false }),
    ).toBe('pwa')
  })

  it.each<PwaInstallPlatform>([
    'android-prompt',
    'android-no-prompt',
    'desktop-prompt',
    'desktop-no-prompt',
  ])('non-iOS browser (%s) → PWA install even when available', (platform) => {
    expect(chooseInstallAffordance({ ...base, platform, available: true })).toBe(
      'pwa',
    )
  })

  it('native shell → nothing (even on iOS, even when available)', () => {
    expect(
      chooseInstallAffordance({
        ...base,
        platform: 'ios',
        isNativeApp: true,
        available: true,
      }),
    ).toBe('none')
  })

  it('installed PWA (standalone) → nothing', () => {
    expect(
      chooseInstallAffordance({
        ...base,
        platform: 'ios',
        isStandalone: true,
        available: true,
      }),
    ).toBe('none')
  })
})

describe('APP_STORE_LINKS config', () => {
  it('metronome, chords + scales are all live on the App Store', () => {
    expect(APP_STORE_LINKS.metronome.available).toBe(true)
    expect(APP_STORE_LINKS.chords.available).toBe(true)
    expect(APP_STORE_LINKS.scales.available).toBe(true)
  })

  it('every url is a canonical apps.apple.com listing', () => {
    for (const link of Object.values(APP_STORE_LINKS)) {
      expect(link.url).toMatch(/^https:\/\/apps\.apple\.com\/app\/id\d+$/)
    }
  })
})
