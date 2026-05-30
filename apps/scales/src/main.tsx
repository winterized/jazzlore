import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { applyTheme, resolveInitialTheme } from '@jazzlore/music-core'
import { isNativeApp } from '@jazzlore/ui'

// Apply theme before rendering so the first paint matches user preference.
applyTheme(resolveInitialTheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// In the Capacitor native shell, dismiss the launch splash. No-op in the
// browser/PWA — the SplashScreen plugin is only injected on the native bridge,
// so this never imports a Capacitor dependency. We hold the splash for a
// deliberate minimum (so it doesn't flash by on a warm launch where the cached
// web view mounts instantly) but no longer than needed: performance.now() is ms
// since the web view began loading, so this floors the *total* splash time —
// a slow cold launch that already took longer just hides immediately.
if (isNativeApp()) {
  const MIN_SPLASH_MS = 800
  const hideSplash = () =>
    void (
      window as Window & {
        Capacitor?: { Plugins?: { SplashScreen?: { hide: () => Promise<void> } } }
      }
    ).Capacitor?.Plugins?.SplashScreen?.hide()
  window.setTimeout(hideSplash, Math.max(0, MIN_SPLASH_MS - performance.now()))
}
