// useSheetTransition — enter + exit transition state for a mobile sheet/drawer.
//
// `open` is false on first paint, then flips true on the next frame so the
// sheet's CSS transition runs the slide-in. `requestClose` flips `open` back to
// false (slide-OUT) and only calls the real `onClose` after the exit duration —
// so the sheet animates out instead of vanishing the instant it's dismissed.
// Without this, a sheet that's conditionally mounted unmounts synchronously on
// dismiss and the exit transition never gets a chance to play.
//
// Honors `prefers-reduced-motion` (closes immediately — no dead time waiting
// for a transition that the CSS has snapped to 0). Re-entrant-safe: a second
// `requestClose` (e.g. backdrop tap after a swipe) is ignored, and a pending
// timer is cleared if the sheet unmounts for another reason first.

import { useCallback, useEffect, useRef, useState } from 'react'

export function useSheetTransition(
  onClose: () => void,
  /** Exit duration in ms — match the sheet's slide-out CSS transition. */
  exitMs = 280,
): { open: boolean; requestClose: () => void } {
  const [open, setOpen] = useState(false)
  const closingRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(true))
    return () => {
      cancelAnimationFrame(id)
      if (timerRef.current !== null) clearTimeout(timerRef.current)
    }
  }, [])

  const requestClose = useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true
    setOpen(false) // drives the slide-out
    const reduce =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      onClose()
      return
    }
    timerRef.current = setTimeout(onClose, exitMs)
  }, [onClose, exitMs])

  return { open, requestClose }
}
