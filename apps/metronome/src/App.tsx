import MetronomePage from './pages/MetronomePage'

// Single-screen app — no router. The metronome is a single page, no settings
// or sub-routes. Cloudflare's `not_found_handling: "single-page-application"`
// still routes every URL to this index.html.
export default function App() {
  return <MetronomePage />
}
