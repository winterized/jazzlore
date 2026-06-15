// appStoreLinks — per-app App Store availability + the rule that decides which
// install affordance a header slot shows.
//
// On an iOS browser the native App Store app is a strictly better experience
// than the buried iOS "Add to Home Screen" PWA flow, so when the native app is
// live we swap the PWA install button for Apple's official "Download on the App
// Store" badge. Everywhere else (Android, desktop, not-yet-shipped apps) the PWA
// button stays. Inside the native shell or an installed PWA, neither shows.
//
// Pure data + a pure function — no React, no DOM — so the decision is unit-
// testable and the component layer just renders the verdict.

import type { PwaInstallPlatform } from './usePwaInstall'

export type AppStoreKey = 'metronome' | 'chords' | 'scales'

export interface AppStoreLink {
  /** Canonical App Store listing URL. Bare `/app/id<ID>` form reliably hands
   * off to the App Store app via Universal Link without a fragile name slug. */
  url: string
  /** True once the app has cleared App Review and the listing is live. Flip
   * this to surface the badge — no other edit needed. */
  available: boolean
}

export const APP_STORE_LINKS: Record<AppStoreKey, AppStoreLink> = {
  metronome: { url: 'https://apps.apple.com/app/id6774656363', available: true },
  chords: { url: 'https://apps.apple.com/app/id6776941235', available: true },
  scales: { url: 'https://apps.apple.com/app/id6776942064', available: true },
}

export type InstallAffordance = 'app-store' | 'pwa' | 'none'

/** Decide which install affordance a header slot should render. Pure: feed it
 * the `usePwaInstall()` signals plus this app's App-Store availability.
 *
 *  - native shell or installed PWA → `'none'` (an install prompt is pointless)
 *  - iOS browser AND the app is live on the App Store → `'app-store'`
 *  - everything else (Android, desktop, iOS-but-not-yet-shipped) → `'pwa'`
 */
export function chooseInstallAffordance(opts: {
  platform: PwaInstallPlatform
  isNativeApp: boolean
  isStandalone: boolean
  available: boolean
}): InstallAffordance {
  if (opts.isNativeApp || opts.isStandalone) return 'none'
  if (opts.platform === 'ios' && opts.available) return 'app-store'
  return 'pwa'
}
