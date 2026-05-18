// useMosaicScrollPulse — mosaic tile → matching ConnRow scroll + pulse.
//
// Landmine 7 / design "Implementation gotchas": the pulse fires on
// scroll-LAND, NOT on tap — applying it on tap clips the highlight under the
// sticky header. So: tap → smooth-scroll the row to centre → an
// IntersectionObserver watches that row → the pulse class is applied when it
// intersects (lands) → cleared 1.4s later (one pulse iteration, matching the
// CSS `mu3-pulse 1.4s`).
//
// Reduced motion (design "Motion specs": pulse single-frame, scroll instant):
// no smooth scroll, no IntersectionObserver — scroll `behavior:'auto'` and
// pulse immediately (a single frame).
//
// jsdom has neither IntersectionObserver nor matchMedia (project tooling
// quirk) — every access is guarded; the unit test installs controllable
// mocks. The signature is unchanged from the D3 baseline (DetailView
// untouched).

import { useCallback, useEffect, useRef, type RefObject } from 'react'

const PULSE_MS = 1400

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useMosaicScrollPulse(
  railRef: RefObject<HTMLDivElement | null>,
  setPulseId: (id: string | null) => void,
): (id: string) => void {
  // Track the live IO + pulse-clear timer so a rapid second tap cleans up
  // the first (no leaked observer, no stale pulse).
  const ioRef = useRef<IntersectionObserver | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cleanup = useCallback((): void => {
    ioRef.current?.disconnect()
    ioRef.current = null
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => cleanup, [cleanup])

  return useCallback(
    (id: string) => {
      cleanup()
      const root = railRef.current
      const row = root?.querySelector<HTMLElement>(
        `[data-collab-id="${CSS.escape(id)}"]`,
      )
      const reduced = prefersReducedMotion()

      const firePulse = (): void => {
        setPulseId(id)
        timerRef.current = setTimeout(() => {
          setPulseId(null)
          timerRef.current = null
        }, PULSE_MS)
      }

      if (!row) {
        // Row not mounted (shouldn't happen for a real collaborator) — still
        // flag the pulse so the contract holds.
        firePulse()
        return
      }

      if (reduced) {
        row.scrollIntoView({ block: 'center', behavior: 'auto' })
        firePulse()
        return
      }

      row.scrollIntoView({ block: 'center', behavior: 'smooth' })

      if (typeof IntersectionObserver !== 'function') {
        // No IO (very old engine) — degrade to immediate pulse.
        firePulse()
        return
      }

      const io = new IntersectionObserver(
        (entries) => {
          const landed = entries.some((e) => e.isIntersecting)
          if (!landed) return
          firePulse()
          io.disconnect()
          ioRef.current = null
        },
        { threshold: 0.6 },
      )
      io.observe(row)
      ioRef.current = io
    },
    [railRef, setPulseId, cleanup],
  )
}
