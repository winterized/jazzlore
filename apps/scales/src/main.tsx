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

// Dismiss the iOS launch splash once mounted (no-op in the browser/PWA).
hideNativeSplashAfterMount()
