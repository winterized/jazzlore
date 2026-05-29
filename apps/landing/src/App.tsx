import { routeFor } from './lib/route'
import { LandingPage } from './pages/LandingPage'
import { PrivacyPage } from './pages/PrivacyPage'

export default function App() {
  // No client router (see lib/route.ts) — pick the view from the entry path.
  return routeFor(window.location.pathname) === 'privacy' ? (
    <PrivacyPage />
  ) : (
    <LandingPage />
  )
}
