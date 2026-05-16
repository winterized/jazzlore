import { useEffect, useState } from 'react'

/**
 * SSR-safe media-query subscription. Returns the current match and re-renders
 * only when the query result flips (e.g. crossing a breakpoint) — not on every
 * resize tick. Used by ChordRow to pick the abcjs `staffwidth` for the
 * header-row mini-score (narrow) vs the desktop side-by-side score.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() =>
    // SSR + jsdom (no window.matchMedia) → false; the consumer's default branch
    // must be sensible (here: the original 320 staffwidth).
    typeof window === 'undefined' || typeof window.matchMedia !== 'function'
      ? false
      : window.matchMedia(query).matches,
  )
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mql = window.matchMedia(query)
    const onChange = (): void => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])
  return matches
}
