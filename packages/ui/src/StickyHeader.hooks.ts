/**
 * Shared hooks for StickyHeader and its sub-components.
 *
 * Extracted so both StickyHeader.tsx and StickyHeader.chipRow.tsx can import
 * the same implementation without duplication (DRY).
 */

import { useEffect, useState } from 'react'

function getReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Returns `true` when the user has requested reduced motion.
 * Subscribes to `MediaQueryList` changes for SSR-safe reactivity.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(getReducedMotion)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduced
}
