import type { ReactNode } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router'
import HomePage from './pages/HomePage'
import MusicianPage from './pages/MusicianPage'
import { OfflineBanner } from './components/OfflineBanner'
import { DeepLinkHandler } from './components/DeepLinkHandler'
import { ErrorBoundary } from './components/ErrorBoundary'
import { WakingState } from './features/status/WakingState'
import { RandomJumpPage } from './features/journey/RandomJumpPage'
import { JourneyIndexPage } from './features/journey/JourneyIndexPage'
import { JourneyDetailPage } from './features/journey/JourneyDetailPage'

/** Dev/test-only preview of the calm cold-Aura screen. The fixture data
 * source always resolves (it can't surface a real 503), so the waking view
 * has no organic route — this harness lets the axe + visual-baseline pass
 * audit it on a live page. Gated by `import.meta.env.DEV`: Vite statically
 * replaces it with `false` for production and tree-shakes the branch, so the
 * route never ships. */
const WAKING_FALLBACK = [
  { id: 'wikidata:Q93341', name: 'Miles Davis' },
  { id: 'wikidata:Q7346', name: 'John Coltrane' },
  { id: 'wikidata:Q379938', name: 'Bobby Timmons' },
  { id: 'wikidata:Q133069', name: 'Bill Evans' },
  { id: 'wikidata:Q160058', name: 'Thelonious Monk' },
]

/** App-wide render safety net, mounted inside the Router so it can recover on
 * navigation: `resetKey={pathname}` clears a caught error when the user moves
 * to another route, so one bad page (e.g. a BFF contract violation) never
 * strands the whole session. */
function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const location = useLocation()
  return <ErrorBoundary resetKey={location.pathname}>{children}</ErrorBoundary>
}

export default function App() {
  return (
    <BrowserRouter>
      {/* Global offline banner — overlays the top of every route while the
          browser is offline; self-hides when online. */}
      <OfflineBanner />
      {/* Native-only: routes widget taps (jazzlore-musicians://) to the right
          musician page. Renders nothing; no-op in the browser/PWA. */}
      <DeepLinkHandler />
      <RoutedErrorBoundary>
        <Routes>
        <Route path="/" element={<Navigate to="/musicians" replace />} />
        <Route path="/musicians" element={<HomePage />} />
        <Route path="/musicians/journey/random" element={<RandomJumpPage />} />
        <Route
          path="/musicians/journey/era"
          element={<JourneyIndexPage variant="era" />}
        />
        <Route
          path="/musicians/journey/era/:slug"
          element={<JourneyDetailPage variant="era" />}
        />
        <Route
          path="/musicians/journey/label"
          element={<JourneyIndexPage variant="label" />}
        />
        <Route
          path="/musicians/journey/label/:slug"
          element={<JourneyDetailPage variant="label" />}
        />
        <Route path="/musicians/:id" element={<MusicianPage />} />
        {import.meta.env.DEV && (
          <Route
            path="/musicians/__preview/waking"
            element={
              <WakingState
                variant="waking"
                retryAfter={8}
                fallback={WAKING_FALLBACK}
                onRetry={() => {}}
              />
            }
          />
        )}
        <Route path="*" element={<Navigate to="/musicians" replace />} />
        </Routes>
      </RoutedErrorBoundary>
    </BrowserRouter>
  )
}
