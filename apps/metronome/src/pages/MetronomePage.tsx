import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
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
/** The 400 ms warmup window before the first beat fires — a non-negotiable
 *  audio constraint per the original spec (so the iOS USB DAC is fully
 *  streaming before the leading edge of the first click). In PR 1 we have
 *  no audio, so the priming → running transition is driven by this
 *  setTimeout; in PR 2 the same transition will be driven by the audio
 *  engine's `ready` signal at the end of its own 400 ms warmup, and this
 *  setTimeout is replaced by the engine's callback. The duration stays the
 *  same — the source of the "warmup complete" event changes. */
const WARMUP_MS = 400

export default function MetronomePage() {
  const { theme, toggle: toggleTheme } = useTheme()
  const layout = useLayoutMode()
  const [state, dispatch] = useReducer(metronomeReducer, undefined, initState)

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

  // priming → running after the 400 ms warmup. In PR 1, this useEffect is
  // the warmup driver. In PR 2 the audio engine drives the transition (the
  // engine schedules the first click at ctx.currentTime + 0.4 and fires the
  // ready callback then); this useEffect will be removed in favor of the
  // engine's callback wiring.
  useEffect(() => {
    if (state.status !== 'priming') return
    const handle = setTimeout(() => dispatch({ type: 'PRIMED' }), WARMUP_MS)
    return () => clearTimeout(handle)
  }, [state.status])

  // Start/Stop handler — the surface where primeAudio() + Wake Lock +
  // NoSleep will land in PR 2, all synchronously before any await. For PR
  // 1, just toggle status; the priming stub above bridges to 'running'.
  const onToggleStartStop = useCallback(() => {
    // PR 2: primeAudio()  ← FIRST sync statement
    // PR 2: wakeLock.requestSync()
    if (state.status === 'idle') {
      dispatch({ type: 'START' })
    } else {
      dispatch({ type: 'STOP' })
    }
  }, [state.status])

  const onTap = useCallback(() => {
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
