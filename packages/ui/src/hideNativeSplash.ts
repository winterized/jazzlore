// hideNativeSplash — dismiss the Capacitor launch splash once the app has
// mounted and painted, inside the native shell only.
//
// On iOS the splash plugin is configured with launchAutoHide:false, so the
// native launch screen stays up until JS calls SplashScreen.hide(). We reach
// that through the runtime-injected `window.Capacitor` global — with NO
// dependency on `@capacitor/*` (mirrors isNativeApp). In the browser/PWA this is
// a no-op: isNativeApp() is false, and even if it weren't, the optional chain
// short-circuits to undefined.
//
// The splash is held for a minimum visible time (floored on performance.now(),
// i.e. total ms since the web view began loading) so it doesn't flash by on a
// warm launch where the cached web view mounts in milliseconds — while a slow
// cold launch that already exceeded the floor hides as soon as ready. We wait
// for a committed paint (double requestAnimationFrame) before arming the timer
// so the splash is never lifted off an unpainted view.

import { isNativeApp } from './isNativeApp'

/** Just the bit of the SplashScreen plugin we call. */
interface SplashScreenPlugin {
  hide: () => Promise<void>
}

/**
 * Hide the native launch splash after the app mounts. No-op outside the
 * Capacitor native shell. Call once, right after `createRoot().render(...)`.
 *
 * @param minVisibleMs minimum time the splash stays visible (default 800ms),
 *   measured from web-view load start; the splash hides at the later of this
 *   floor and first paint.
 */
export function hideNativeSplashAfterMount(minVisibleMs = 800): void {
  if (typeof window === 'undefined' || !isNativeApp()) return
  const hide = (): void => {
    void (
      window as Window & {
        Capacitor?: { Plugins?: { SplashScreen?: SplashScreenPlugin } }
      }
    ).Capacitor?.Plugins?.SplashScreen?.hide()
  }
  requestAnimationFrame(() =>
    requestAnimationFrame(() =>
      window.setTimeout(hide, Math.max(0, minVisibleMs - performance.now())),
    ),
  )
}
