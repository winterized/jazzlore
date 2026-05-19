// App-local reduced-motion hook. Mirrors the proven implementation in
// `@jazzlore/ui` `StickyHeader.hooks.ts` (not exported from the package's
// public index, so it cannot be imported; the design system is purely
// presentational and we must not deep-import its internals). jsdom has no
// `matchMedia` (project tooling quirk) — every access is guarded so unit
// tests can mock `window.matchMedia` or omit it entirely.

import { useEffect, useState } from 'react'

function getReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** `true` when the user has requested reduced motion; reactive to changes. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(getReducedMotion)
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    ) {
      return
    }
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent): void => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduced
}
