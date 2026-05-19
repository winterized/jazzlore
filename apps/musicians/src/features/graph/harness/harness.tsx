// Visual-baseline harness entry (Phase E). Mounts ONLY GraphView with the
// seed-pinned Miles-like fixture; theme via ?theme=. Reduced-motion is forced
// so the capture is the deterministic settled layout (no in-flight tween) —
// the SEEDED reference, tolerance-compared, NOT an MD5 gate (landmine 6).
//
// Not part of the app build/route surface (App.tsx/pages are Phase D's).

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import GraphView from '../GraphView'
import { MILES_LIKE } from '../fixtures'
import { GRAPH_CSS } from '../graphView.css'

const params = new URLSearchParams(window.location.search)
const theme = params.get('theme') === 'light' ? 'light' : 'dark'
document.documentElement.setAttribute('data-theme', theme)

// The frozen token layer (src/index.css) is the real theme source in the app;
// the harness imports the app stylesheet so the seeded reference uses the
// exact production tokens/fonts.
import '../../../index.css'

// Belt-and-braces: also inline the component CSS (it is component-scoped via a
// <style> in GraphView too, but inlining keeps the harness deterministic if
// Tailwind's @source scan hasn't picked the feature dir up yet).
const style = document.createElement('style')
style.textContent = GRAPH_CSS
document.head.appendChild(style)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div style={{ width: '100%', height: '100%' }}>
      <GraphView data={MILES_LIKE} focusId={MILES_LIKE.nodes[0]!.id} />
    </div>
  </StrictMode>,
)
