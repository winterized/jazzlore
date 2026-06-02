import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { applyTheme, resolveInitialTheme } from '@jazzlore/music-core'
import { hideNativeSplashAfterMount } from '@jazzlore/ui'

// Apply theme before rendering so the first paint matches user preference.
applyTheme(resolveInitialTheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Dismiss the Capacitor launch splash once mounted. No-op in the browser/PWA
// (gated on isNativeApp inside the helper).
hideNativeSplashAfterMount()
