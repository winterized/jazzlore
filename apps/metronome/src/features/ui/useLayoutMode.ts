import { useEffect, useState } from 'react'

/** Desktop breakpoint at 1024 px. Matches the handoff design (the 3-col grid
 *  with side rails kicks in here; below this the page renders flat with the
 *  mobile kbd footer). */
export const DESKTOP_BREAKPOINT_PX = 1024

const QUERY = `(min-width: ${DESKTOP_BREAKPOINT_PX}px)`

/** Initial value computed at module load to avoid a first-paint FOUC on
 *  desktop (otherwise React initial state would be 'mobile' and the layout
 *  would flip after the first useEffect tick).
 *
 *  jsdom doesn't implement matchMedia, so the hook guards via `typeof
 *  window !== 'undefined' && window.matchMedia` (per [[project-tooling-quirks]]
 *  in workspace memory). In jsdom we deterministically return 'mobile'. */
function initialLayoutMode(): 'mobile' | 'desktop' {
  if (typeof window === 'undefined' || !window.matchMedia) return 'mobile'
  return window.matchMedia(QUERY).matches ? 'desktop' : 'mobile'
}

/** Track viewport layout mode. Subscribes to a matchMedia change listener
 *  so a window resize live-updates the layout. */
export function useLayoutMode(): 'mobile' | 'desktop' {
  const [mode, setMode] = useState<'mobile' | 'desktop'>(initialLayoutMode)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mql = window.matchMedia(QUERY)
    const handler = (e: MediaQueryListEvent): void => {
      setMode(e.matches ? 'desktop' : 'mobile')
    }
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return mode
}
