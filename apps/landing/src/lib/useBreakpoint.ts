import { useEffect, useState } from 'react'

/* Compound: BOTH wide AND tall qualify as "desktop". Landscape phone
   (e.g. 844×390) matches the width arm but fails the height arm — it
   stays "mobile" and gets the landscape-phone CSS lane (4-across).
   Otherwise the desktop 720+stack layout would collapse the right
   column at landscape phone width AND have no vertical room for the
   3-tile stack anyway. */
const QUERY = '(min-width: 768px) and (min-height: 600px)'

export type Breakpoint = 'desktop' | 'mobile'

/** matchMedia-backed breakpoint observer.
 *  - SSR / jsdom (no matchMedia OR test polyfill returning matches:false):
 *    defaults to 'mobile'. Unit tests asserting one variant should render
 *    the tile with an explicit `variant` prop instead of relying on this.
 *  - Browser: updates reactively on viewport resize / orientation change.
 */
export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(() => readInitial())

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia(QUERY)
    const onChange = () => setBp(mq.matches ? 'desktop' : 'mobile')
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return bp
}

function readInitial(): Breakpoint {
  if (typeof window === 'undefined' || !window.matchMedia) return 'mobile'
  return window.matchMedia(QUERY).matches ? 'desktop' : 'mobile'
}
