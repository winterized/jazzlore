// useSwipeDownDismiss — the swipe-down-to-dismiss gesture shared by the
// mobile sheets in the design system. Returns the `onTouchStart`/`onTouchEnd`
// handlers to spread onto the sheet element; the gesture dismisses (calls
// `onClose`) when the touch travels down by at least `thresholdPx`.
//
// `ignoreClosest` is an optional CSS selector: when a touch *begins* inside an
// element matching it, the gesture is skipped. A scrollable sheet body (e.g.
// SharedRecordsSheet's `.records-body`) passes its selector so scrolling a
// long list past the threshold doesn't accidentally dismiss — iOS does not
// consume touch events before they bubble to this handler. A non-scrolling
// sheet (MoreAboutSheet) omits it, keeping the gate off. Extracted from the
// two musicians sheets (issue #115) with both behaviours preserved exactly.

import { useRef, type TouchEvent } from 'react'

export type SwipeDownDismissHandlers = {
  onTouchStart: (e: TouchEvent) => void
  onTouchEnd: (e: TouchEvent) => void
}

export type SwipeDownDismissOptions = {
  /** Minimum downward travel (px) before the gesture dismisses. Default 80. */
  thresholdPx?: number
  /** CSS selector; touches starting inside a match are ignored (scroll-gate). */
  ignoreClosest?: string
}

export function useSwipeDownDismiss(
  onClose: () => void,
  options: SwipeDownDismissOptions = {},
): SwipeDownDismissHandlers {
  const { thresholdPx = 80, ignoreClosest } = options
  const touchStartY = useRef<number | null>(null)

  const onTouchStart = (e: TouchEvent): void => {
    if (ignoreClosest !== undefined) {
      const target = e.target as HTMLElement
      if (target.closest(ignoreClosest)) {
        touchStartY.current = null
        return
      }
    }
    touchStartY.current = e.touches[0]?.clientY ?? null
  }

  const onTouchEnd = (e: TouchEvent): void => {
    const start = touchStartY.current
    const end = e.changedTouches[0]?.clientY ?? null
    touchStartY.current = null
    if (start !== null && end !== null && end - start >= thresholdPx) {
      onClose()
    }
  }

  return { onTouchStart, onTouchEnd }
}
