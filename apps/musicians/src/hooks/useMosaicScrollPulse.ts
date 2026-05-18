// useMosaicScrollPulse — mosaic tile → matching ConnRow scroll + pulse.
//
// D3 baseline: tap → find the row by `data-collab-id`, scroll it to centre,
// set the pulse. D4 refines *when* the pulse fires (on scroll-LAND via
// IntersectionObserver, not on tap — landmine 7 "pulse fires on scroll-LAND,
// not tap; else it clips under the sticky header") and honours
// reduced-motion (single frame, instant scroll). The signature is stable so
// D4 swaps the body without touching DetailView.

import { useCallback, type RefObject } from 'react'

export function useMosaicScrollPulse(
  railRef: RefObject<HTMLDivElement | null>,
  setPulseId: (id: string | null) => void,
): (id: string) => void {
  return useCallback(
    (id: string) => {
      const root = railRef.current
      const row = root?.querySelector<HTMLElement>(
        `[data-collab-id="${CSS.escape(id)}"]`,
      )
      if (!row) {
        setPulseId(id)
        return
      }
      row.scrollIntoView({ block: 'center', behavior: 'smooth' })
      setPulseId(id)
    },
    [railRef, setPulseId],
  )
}
