import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import HomePage from './pages/HomePage'
import MusicianPage from './pages/MusicianPage'
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

export default function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  )
}
