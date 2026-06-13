// useSheetDrag — interactive swipe-to-dismiss for a mobile bottom sheet. Unlike
// useSwipeDownDismiss (which only measures start→end and dismisses on release),
// this makes the sheet FOLLOW the finger: the panel translates down as you drag,
// then either dismisses (if dragged past the threshold) or springs back.
//
// The panel is moved by writing `transform` straight onto the element via
// `sheetRef` — no React re-render per touch frame, so the drag stays at 60fps.
// During the drag the CSS transition is disabled (instant follow); on release it
// is restored so the dismiss / spring-back tweens. `ignoreClosest` skips the
// gesture when it begins inside the scrollable body (scrolling a long list must
// not drag the sheet). Background scroll is already blocked by useBodyScrollLock
// while a sheet is open, so this handler doesn't need to preventDefault (which a
// passive React touch listener couldn't do anyway).
//
// Dismiss continues the motion: the panel tweens the rest of the way off-screen
// (inline transform) while `onDismiss` — the useSheetTransition `requestClose` —
// fades the backdrop and defers the unmount, so the close looks continuous from
// wherever the finger let go.

import { useRef, type RefObject, type TouchEvent } from 'react'

export type SheetDragHandlers = {
  onTouchStart: (e: TouchEvent) => void
  onTouchMove: (e: TouchEvent) => void
  onTouchEnd: (e: TouchEvent) => void
}

export type SheetDragOptions = {
  /** Called to dismiss — pass the useSheetTransition `requestClose`. */
  onDismiss: () => void
  /** Max distance (px) that forces dismiss; shorter sheets dismiss sooner
   * (capped at 30% of the panel height). Default 100. */
  thresholdPx?: number
  /** CSS selector; a drag that BEGINS inside a match is ignored (scroll-gate). */
  ignoreClosest?: string
}

export function useSheetDrag(
  sheetRef: RefObject<HTMLElement | null>,
  { onDismiss, thresholdPx = 100, ignoreClosest }: SheetDragOptions,
): SheetDragHandlers {
  const startY = useRef<number | null>(null)
  const dy = useRef(0)

  const onTouchStart = (e: TouchEvent): void => {
    if (ignoreClosest !== undefined) {
      const target = e.target as HTMLElement
      if (target.closest(ignoreClosest)) {
        startY.current = null
        return
      }
    }
    startY.current = e.touches[0]?.clientY ?? null
    dy.current = 0
    const el = sheetRef.current
    if (el) el.style.transition = 'none' // follow the finger instantly
  }

  const onTouchMove = (e: TouchEvent): void => {
    if (startY.current === null) return
    const y = e.touches[0]?.clientY ?? startY.current
    dy.current = Math.max(0, y - startY.current) // downward only
    const el = sheetRef.current
    if (el) {
      el.style.transform = dy.current > 0 ? `translateY(${dy.current}px)` : ''
    }
  }

  const onTouchEnd = (): void => {
    const start = startY.current
    startY.current = null
    const el = sheetRef.current
    if (start === null || !el) return

    const distance = dy.current
    const limit = Math.min(thresholdPx, el.offsetHeight * 0.3)
    if (distance >= limit && distance >= 40) {
      // Continue the motion off-screen, then let requestClose fade the backdrop
      // and unmount.
      el.style.transition = 'transform 0.22s ease-out'
      el.style.transform = 'translateY(110%)'
      onDismiss()
    } else {
      // Spring back to the open position, then hand control back to the CSS
      // `.open` class (clear the inline overrides).
      el.style.transition = 'transform 0.2s ease-out'
      el.style.transform = 'translateY(0)'
      window.setTimeout(() => {
        const node = sheetRef.current
        if (node) {
          node.style.transition = ''
          node.style.transform = ''
        }
      }, 200)
    }
  }

  return { onTouchStart, onTouchMove, onTouchEnd }
}
