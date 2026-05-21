import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import type { Action } from '../features/state/metronomeReducer'
import { primeAudio } from '@jazzlore/music-core'
import { useTheme } from '../lib/useTheme'
import {
  metronomeReducer,
  makeInitialState,
} from '../features/state/metronomeReducer'
import {
  loadState,
  makeDebouncedSave,
  type PersistedState,
} from '../features/state/persistence'
import { useKeyboardShortcuts } from '../features/keyboard/useKeyboardShortcuts'
import { useLayoutMode } from '../features/ui/useLayoutMode'
import { useWakeLock } from '../features/wakeLock/useWakeLock'
import { isWkwebview } from '../features/wakeLock/detectWkwebview'
import { createMetronomeEngine, type EngineHandle } from '../features/audio/engine'
import { playTapClick } from '../features/audio/tapClick'
import { Header } from '../features/ui/Header'
import { BpmHero } from '../features/ui/BpmHero'
import { TempoSlider } from '../features/ui/TempoSlider'
import { NudgeRow } from '../features/ui/NudgeRow'
import { TapButton } from '../features/ui/TapButton'
import { MeterPicker } from '../features/ui/MeterPicker'
import { PatternEditor, type PatternRow } from '../features/ui/PatternEditor'
import { ModeCards } from '../features/ui/ModeCards'
import { StartStopButton } from '../features/ui/StartStopButton'
import { KbdFooter } from '../features/ui/KbdFooter'
import { DesktopLeftRail, DesktopRightRail } from '../features/ui/DesktopSideRails'
import { WkwebviewBanner } from '../features/ui/WkwebviewBanner'

/** Lazy initializer for the reducer's first state — hydrate from
 *  localStorage on mount (per the plan, the four jazzlore:metronome:* keys).
 *  Out-of-range or malformed values fall back to v1 defaults independently
 *  per slice — see features/state/persistence.ts. */
function initState() {
  const initial = makeInitialState()
  const persisted = loadState()
  return {
    ...initial,
    bpm: persisted.bpm,
    beats: persisted.beats,
    pattern: persisted.pattern,
    mode: persisted.mode,
  }
}

const TAP_DISARM_MS = 2000

export default function MetronomePage() {
  const { theme, toggle: toggleTheme } = useTheme()
  const layout = useLayoutMode()
  const wakeLock = useWakeLock()
  const [state, dispatch] = useReducer(metronomeReducer, undefined, initState)

  // The audio engine — created lazily on first start. Lives in a ref so it
  // survives re-renders without React knowing about it.
  const engineRef = useRef<EngineHandle | null>(null)

  // WKWebView detection runs once at mount via the lazy useState
  // initializer. `isWkwebview()` is SSR-guarded (returns false when
  // navigator is undefined), so it's safe to call during render.
  const [showWkwebviewBanner] = useState<boolean>(() => isWkwebview())

  // Debounced persistence: any of the four persisted slices changes →
  // schedule a write 200 ms later. The closure is stable across renders so
  // the debounce timer survives.
  const saveRef = useRef<((s: PersistedState) => void) | null>(null)
  if (saveRef.current === null) saveRef.current = makeDebouncedSave(200)
  useEffect(() => {
    saveRef.current?.({
      bpm: state.bpm,
      beats: state.beats,
      pattern: [...state.pattern],
      mode: state.mode,
    })
  }, [state.bpm, state.beats, state.pattern, state.mode])

  // Push live state changes into the running engine. The engine reads bpm
  // and pattern fresh on each scheduler tick so the next beat picks up the
  // new values; no rebuild needed.
  useEffect(() => {
    engineRef.current?.setBpm(state.bpm)
  }, [state.bpm])
  useEffect(() => {
    engineRef.current?.setPattern(state.pattern, state.mode)
  }, [state.pattern, state.mode])

  // TAP timeout: 2 s after the latest tap, dispatch TAP_DISARM. Each TAP
  // restarts the timer. The reducer trims to a 6-tap window so memory is
  // bounded.
  useEffect(() => {
    if (!state.tapArmed) return
    const handle = setTimeout(
      () => dispatch({ type: 'TAP_DISARM' }),
      TAP_DISARM_MS,
    )
    return () => clearTimeout(handle)
  }, [state.tapArmed, state.tapTimestamps])

  // onBeat handler — fires from the audio engine for every beat (including
  // empty ones; see engine.ts). Flashes the corresponding pattern dot via
  // DOM mutation (NOT React state, per the design — at 240 BPM that would
  // be 4 renders/sec of the whole tree). The .flash class is removed on
  // animationend so the next tick of the same dot fires cleanly.
  const handleBeat = useCallback((beatIndexInBar: number) => {
    const dot = document.querySelector<HTMLElement>(
      `.mt .pattern .pttn-row:first-child .dot[data-beat-index="${beatIndexInBar}"]`,
    )
    if (dot) {
      // Re-trigger CSS animation: remove the class first (in case it's
      // still set from a prior tick), force reflow, then add it.
      dot.classList.remove('flash')
      void dot.offsetWidth
      dot.classList.add('flash')
      const onAnimEnd = (): void => {
        dot.classList.remove('flash')
        dot.removeEventListener('animationend', onAnimEnd)
      }
      dot.addEventListener('animationend', onAnimEnd)
    }
    const pulse = document.querySelector<HTMLElement>('.mt .bpm-hero .pulse')
    if (pulse) {
      pulse.classList.remove('beating')
      void pulse.offsetWidth
      pulse.classList.add('beating')
      const onAnimEnd = (): void => {
        pulse.classList.remove('beating')
        pulse.removeEventListener('animationend', onAnimEnd)
      }
      pulse.addEventListener('animationend', onAnimEnd)
    }
  }, [])

  // Track whether the engine has fired its first beat — used to flip
  // priming → running. Each Start cycle resets it.
  const firstBeatFiredRef = useRef(false)

  // Start/Stop handler. CLAUDE.md item 9 + the original spec: primeAudio()
  // MUST be the first synchronous statement of any play handler, BEFORE
  // any await. Same gesture also fires both wake-lock layers
  // synchronously — NoSleep's video.play() requires the gesture to still
  // be active.
  const onToggleStartStop = useCallback(() => {
    if (state.status !== 'idle') {
      // Stop path
      engineRef.current?.stop()
      wakeLock.release()
      dispatch({ type: 'STOP' })
      return
    }

    // Start path — order matters and is SYNCHRONOUS until engine.start().
    primeAudio() //                       1. iOS audio session → 'playback'
    wakeLock.requestSync() //              2. Wake Lock + NoSleep, both engaged

    // Create engine on first start (lazy) or after a prior stop closed it.
    if (!engineRef.current) {
      const engine = createMetronomeEngine({
        bpm: state.bpm,
        pattern: state.pattern,
        mode: state.mode,
      })
      firstBeatFiredRef.current = false
      engine.onBeat((i) => {
        if (!firstBeatFiredRef.current) {
          firstBeatFiredRef.current = true
          dispatch({ type: 'PRIMED' })
        }
        handleBeat(i)
      })
      engineRef.current = engine
    } else {
      // Re-use existing engine instance — push latest state in
      engineRef.current.setBpm(state.bpm)
      engineRef.current.setPattern(state.pattern, state.mode)
      firstBeatFiredRef.current = false
    }

    dispatch({ type: 'START' })
    // If engine.start() rejects (AudioContext construction failed,
    // unsupported browser), tear down the half-started state so the UI
    // returns to idle instead of stuck in 'priming'.
    engineRef.current.start().catch(() => {
      engineRef.current?.stop()
      engineRef.current = null
      wakeLock.release()
      dispatch({ type: 'STOP' } satisfies Action)
    })
  }, [state.status, state.bpm, state.pattern, state.mode, wakeLock, handleBeat])

  // Tear down the engine when status returns to 'idle' (Stop button OR a
  // programmatic dispatch from the engine.start() catch handler).
  useEffect(() => {
    if (state.status === 'idle' && engineRef.current) {
      engineRef.current.stop()
      engineRef.current = null
    }
  }, [state.status])

  // Cleanup on unmount — release engine + wake lock if the component is
  // torn down mid-play (hot reload during dev, future multi-page mode).
  useEffect(() => {
    return () => {
      engineRef.current?.stop()
      wakeLock.release()
    }
  }, [wakeLock])

  const onTap = useCallback(() => {
    // playTapClick() FIRST — primeAudio() inside it is the required first
    // sync statement of any play handler per CLAUDE.md item 9. The TAP
    // button and the T keyboard shortcut are both valid gestures for
    // iOS audio unlock.
    playTapClick()
    dispatch({ type: 'TAP', t: performance.now() })
  }, [])

  // Keyboard shortcuts — wired to the same dispatch + start/stop handler.
  useKeyboardShortcuts({ onToggleStartStop, onTap, dispatch })

  // Pattern rows: v1 always 1 row. When mode === 'altmeasure', mount a
  // second dimmed "bar 2 — silent" preview row so the user can see the
  // alternation visually.
  const rows = useMemo<PatternRow[]>(() => {
    const main: PatternRow = { beats: state.pattern }
    if (state.mode === 'altmeasure') {
      const preview: PatternRow = {
        beats: state.pattern,
        label: 'bar 2 — silent',
        dim: true,
      }
      return [main, preview]
    }
    return [main]
  }, [state.pattern, state.mode])

  const pageContent = (
    <>
      <BpmHero
        bpm={state.bpm}
        bpmEditing={state.bpmEditing}
        status={state.status}
        onEditStart={() => dispatch({ type: 'BPM_EDIT_START' })}
        onEditCommit={(bpm) => dispatch({ type: 'BPM_EDIT_COMMIT', bpm })}
        onEditCancel={() => dispatch({ type: 'BPM_EDIT_CANCEL' })}
      />
      <div className="tempo">
        <TempoSlider
          bpm={state.bpm}
          onChange={(bpm) => dispatch({ type: 'SET_BPM', bpm })}
        />
        <NudgeRow
          onNudge={(delta) => dispatch({ type: 'NUDGE_BPM', delta })}
          onClassicStep={(dir) => dispatch({ type: 'CLASSIC_STEP', dir })}
        />
        <TapButton tapArmed={state.tapArmed} onTap={onTap} />
      </div>
      <MeterPicker
        beats={state.beats}
        onSelect={(beats) => dispatch({ type: 'SET_BEATS', beats })}
      />
      <PatternEditor
        rows={rows}
        onCycleDot={(index) => dispatch({ type: 'CYCLE_DOT', index })}
      />
      <ModeCards
        mode={state.mode}
        onSelect={(mode) => dispatch({ type: 'SET_MODE', mode })}
      />
      <StartStopButton status={state.status} onToggle={onToggleStartStop} />
    </>
  )

  return (
    <main className="mt" data-layout={layout} data-theme={theme}>
      <Header theme={theme} status={state.status} onToggleTheme={toggleTheme} />
      {showWkwebviewBanner && <WkwebviewBanner />}
      {layout === 'desktop' ? (
        <div className="desk-wrap">
          <DesktopLeftRail />
          <div className="page">{pageContent}</div>
          <DesktopRightRail status={state.status} />
        </div>
      ) : (
        <>
          <div className="page">{pageContent}</div>
          <KbdFooter />
        </>
      )}
    </main>
  )
}
