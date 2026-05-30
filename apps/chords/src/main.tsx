import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { hideNativeSplashAfterMount } from '@jazzlore/ui'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Dismiss the iOS launch splash once mounted (no-op in the browser/PWA).
hideNativeSplashAfterMount()
