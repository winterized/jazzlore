// useBodyScrollLock — lock background scroll while a modal/sheet is open, so
// touching the backdrop or flinging the sheet never scrolls (or scroll-chains
// into) the page behind it. Used by the musicians bottom sheets.
//
// Approach — event-level prevention, NOT `position: fixed` on <body> and NOT
// `overflow: hidden` on the root:
//   - `position: fixed` shifts the document by the scroll offset, which yanks
//     the page's `position: sticky` header (`.mu3 .hdr`) out of place (a
//     visible jump).
//   - `overflow: hidden` on <html>/<body> is unreliable — it does not stop
//     programmatic or, in several engines, wheel/inertial scrolling.
// Instead we cancel the scroll gestures themselves: a non-passive `wheel` +
// `touchmove` listener that `preventDefault()`s everywhere EXCEPT inside the
// sheet's own scrollable body (`allowScrollSelector`). This blocks the real
// user gestures (desktop wheel/trackpad, iOS touch drag + momentum) with zero
// layout change, so the sticky header stays put. Pair with
// `overscroll-behavior: contain` on the sheet body so a scroll that reaches
// the list's edge doesn't chain out.
//
// Listeners are per-instance; if two sheets ever stack, each prevents
// independently and removes its own listeners on unmount.

import { useEffect } from 'react'

/**
 * @param active  Lock while true (typically: the sheet is mounted/open).
 * @param allowScrollSelector  CSS selector for the one element allowed to
 *   scroll under the lock (the sheet's scrollable body). Gestures that begin
 *   outside a match are cancelled. Default `.more-body`.
 */
export function useBodyScrollLock(
  active: boolean,
  allowScrollSelector = '.more-body',
): void {
  useEffect(() => {
    if (!active) return

    const prevent = (e: Event): void => {
      const target = e.target as HTMLElement | null
      const scroller = target?.closest(allowScrollSelector) as HTMLElement | null
      // Leave the sheet's own body free ONLY when it can actually scroll.
      // When its content fits (e.g. a short bio), it is NOT a scroll container,
      // so an allowed gesture would chain straight to the page behind — exactly
      // the bug that let the detail page scroll under the "More about" sheet.
      // In that case fall through and cancel. (A scrollable body keeps its
      // freedom; `overscroll-behavior: contain` on it stops the edge-chain.)
      if (scroller && scroller.scrollHeight > scroller.clientHeight) return
      e.preventDefault()
    }

    // Non-passive so preventDefault() is honored (wheel/touchmove default to
    // passive in modern engines).
    const opts: AddEventListenerOptions = { passive: false }
    document.addEventListener('wheel', prevent, opts)
    document.addEventListener('touchmove', prevent, opts)

    return () => {
      document.removeEventListener('wheel', prevent)
      document.removeEventListener('touchmove', prevent)
    }
  }, [active, allowScrollSelector])
}
