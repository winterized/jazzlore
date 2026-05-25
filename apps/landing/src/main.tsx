import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { applyTheme, resolveInitialTheme } from '@jazzlore/music-core'

// Apply theme before render so the first paint matches the user's preference.
// Same pattern as metronome / scales / chords / musicians — the unscoped
// html[data-theme] base-layer bg rule then matches immediately, before the
// React root mounts the .landing class.
applyTheme(resolveInitialTheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
