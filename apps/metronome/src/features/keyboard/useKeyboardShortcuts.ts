import { useEffect } from 'react'
import type { Action } from '../state/metronomeReducer'

interface ShortcutHandlers {
  /** Toggle Start/Stop. The PAGE's caller is where primeAudio() +
   *  wakeLock.request() happen synchronously (PR 2). The hook just
   *  forwards the gesture. */
  onToggleStartStop: () => void
  /** Tap-tempo handler. Same callback as the TAP button's onClick. */
  onTap: () => void
  /** Reducer dispatch — for non-Start/Stop actions (NUDGE_BPM,
   *  CLASSIC_STEP, SET_BEATS). */
  dispatch: (action: Action) => void
}

/** Window-level keyboard shortcuts per the design handoff:
 *    space   → start / stop
 *    T       → tap tempo
 *    ←  →    → ±1 BPM (repeat-on-hold)
 *    ⇧+← →  → ±10 BPM (repeat-on-hold)
 *    [  ]    → previous/next classic tempo
 *    1..7    → set beats per bar (2..7; 1 ignored — spec is 2..7)
 *
 *  Shortcuts no-op when focus is in an <input>/<textarea> (so typing in the
 *  BPM-edit field doesn't trap arrow keys). The shortcuts fire on `keydown`
 *  so repeat-on-hold is native to the browser's key-repeat behavior. */
export function useKeyboardShortcuts({
  onToggleStartStop,
  onTap,
  dispatch,
}: ShortcutHandlers): void {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      // Don't intercept typing in form fields.
      const target = e.target as HTMLElement | null
      if (target) {
        const tag = target.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) return
      }

      // Space = toggle start/stop. Ignore the auto-repeat for space (we only
      // want a single toggle per press; the browser would otherwise fire
      // every ~30 ms while held).
      if (e.code === 'Space') {
        if (e.repeat) {
          e.preventDefault()
          return
        }
        e.preventDefault()
        onToggleStartStop()
        return
      }

      // T = tap. Auto-repeat is intentionally allowed — holding T spams TAP,
      // and the tap-averager's reset logic handles "too fast" gracefully.
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault()
        onTap()
        return
      }

      // Arrow keys = nudge. Shift modifier = ±10. Native key-repeat does the
      // repeat-on-hold.
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        dispatch({ type: 'NUDGE_BPM', delta: e.shiftKey ? -10 : -1 })
        return
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        dispatch({ type: 'NUDGE_BPM', delta: e.shiftKey ? 10 : 1 })
        return
      }

      // [ / ] = classic-tempo jump.
      if (e.key === '[') {
        e.preventDefault()
        dispatch({ type: 'CLASSIC_STEP', dir: 'prev' })
        return
      }
      if (e.key === ']') {
        e.preventDefault()
        dispatch({ type: 'CLASSIC_STEP', dir: 'next' })
        return
      }

      // 2..7 = set beats. 1 and 8+ ignored per the spec.
      if (e.key >= '2' && e.key <= '7') {
        e.preventDefault()
        dispatch({ type: 'SET_BEATS', beats: Number.parseInt(e.key, 10) })
        return
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onToggleStartStop, onTap, dispatch])
}
