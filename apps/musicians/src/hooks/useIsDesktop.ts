// useIsDesktop — true at the design's desktop breakpoint (≥1024px, the same
// `min-width: 1024px` the components.css `.desk-detail` split-pane uses).
//
// Why a hook and not a CSS-hidden dual-variant: the desktop graph lazy-loads
// d3-force (a heavy chunk against the ≤100 KB gz initial-JS budget). It must
// not even be requested on phones, so the panel is *conditionally mounted*,
// not rendered-then-hidden. Mirrors the proven guarded-matchMedia shape of
// useReducedMotion (jsdom has no matchMedia — every access is guarded so
// unit tests default to mobile unless they stub a desktop match).

import { useEffect, useState } from 'react'

const DESKTOP_QUERY = '(min-width: 1024px)'

function getIsDesktop(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia(DESKTOP_QUERY).matches
}

/** `true` at ≥1024px; reactive to viewport changes. Defaults to `false`
 * (mobile-first) when matchMedia is unavailable (jsdom / SSR). */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(getIsDesktop)
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    ) {
      return
    }
    const mq = window.matchMedia(DESKTOP_QUERY)
    const handler = (e: MediaQueryListEvent): void => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isDesktop
}
