// Dual screen-wake strategy: the Wake Lock API + NoSleep.js, both engaged
// SYNCHRONOUSLY in the user gesture (no `await` before either is kicked
// off). Released together on stop. A visibilitychange listener
// re-acquires when the page returns to foreground (iOS auto-releases on
// background).
//
// Rationale (from the original spec):
//   Wake Lock alone is unreliable on Safari iOS — sometimes granted,
//   sometimes silently ignored. Shipping NoSleep.js alongside it
//   (~3 KB gz, bundled) makes screen-awake behavior robust across iOS
//   versions. Both engaged on Start.
//
// CLAUDE.md item 9 + iOS-audio gotcha: the wakeLock.request() and
// noSleep.enable() calls MUST happen synchronously in the gesture
// handler, before any `await`. NoSleep's video.play() requires the
// gesture to still be "active" — sitting behind an await invalidates it.

import { useCallback, useEffect, useRef } from 'react'
import NoSleep from 'nosleep.js'

interface WakeLockSentinelLike {
  released: boolean
  release: () => Promise<void>
  addEventListener?: (type: 'release', cb: () => void) => void
}

interface WakeLockApi {
  request(type: 'screen'): Promise<WakeLockSentinelLike>
}

interface UseWakeLockHandle {
  /** Engage both wake-lock layers SYNCHRONOUSLY. Returns nothing — both
   *  layers are kicked off as fire-and-forget; the API-side promise is
   *  handled internally. */
  requestSync(): void
  /** Release both layers. Idempotent. */
  release(): void
}

export function useWakeLock(): UseWakeLockHandle {
  // NoSleep instance — module-singleton would be cleaner but it needs the
  // window object so we lazily create per-component. Ref so it persists
  // across renders.
  const noSleepRef = useRef<NoSleep | null>(null)
  const sentinelRef = useRef<WakeLockSentinelLike | null>(null)
  const activeRef = useRef(false)

  // Lazy-instantiate NoSleep on first request — keeps SSR/jsdom safe.
  const ensureNoSleep = (): NoSleep | null => {
    if (typeof window === 'undefined') return null
    if (!noSleepRef.current) noSleepRef.current = new NoSleep()
    return noSleepRef.current
  }

  // Wake Lock API access — guarded for the (rare) browsers that don't
  // expose navigator.wakeLock at all (older Safari < 16.4).
  const getWakeLockApi = (): WakeLockApi | null => {
    if (typeof navigator === 'undefined') return null
    const wl = (navigator as unknown as { wakeLock?: WakeLockApi }).wakeLock
    return wl ?? null
  }

  const requestSync = useCallback((): void => {
    activeRef.current = true

    // 1. Wake Lock API — fire the promise but DON'T await it.
    const wl = getWakeLockApi()
    if (wl) {
      wl.request('screen')
        .then((sentinel) => {
          sentinelRef.current = sentinel
        })
        .catch(() => {
          // Permission denied or unsupported context — silent. NoSleep
          // covers us.
        })
    }

    // 2. NoSleep — enable() returns a Promise too but the side effect
    // (video.play()) fires synchronously inside the call. Same fire-
    // and-forget pattern.
    const noSleep = ensureNoSleep()
    if (noSleep) {
      noSleep.enable().catch(() => {
        // play() can reject if the gesture has already lapsed. Best-effort.
      })
    }
  }, [])

  const release = useCallback((): void => {
    activeRef.current = false

    const sentinel = sentinelRef.current
    if (sentinel && !sentinel.released) {
      sentinel.release().catch(() => {})
    }
    sentinelRef.current = null

    const noSleep = noSleepRef.current
    if (noSleep) noSleep.disable()
  }, [])

  // Re-acquire on visibilitychange (iOS auto-releases when the page
  // backgrounds; reacquire so the screen stays awake on return).
  useEffect(() => {
    if (typeof document === 'undefined') return
    const onVisibility = (): void => {
      if (document.visibilityState !== 'visible') return
      if (!activeRef.current) return
      // We can't re-acquire synchronously here because there's no user
      // gesture in flight on visibilitychange — but the Wake Lock API
      // accepts non-gesture requests from a previously-permitted origin
      // and NoSleep's video.play() also tends to succeed because the
      // first enable() established the permission.
      const wl = getWakeLockApi()
      if (wl) {
        wl.request('screen')
          .then((sentinel) => {
            sentinelRef.current = sentinel
          })
          .catch(() => {})
      }
      const noSleep = noSleepRef.current
      if (noSleep)
        noSleep.enable().catch(() => {
          // NoSleep can fail to re-enable without a fresh gesture — the
          // user may have to tap to keep the screen awake. Acceptable.
        })
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  // Release on unmount as a safety net (the caller should also explicitly
  // call release() on stop).
  useEffect(() => {
    return () => release()
  }, [release])

  return { requestSync, release }
}
