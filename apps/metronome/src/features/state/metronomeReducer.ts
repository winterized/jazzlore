// Pure reducer for the metronome's UI state. No React, no DOM, no audio.
//
// Per the plan and CLAUDE.md item 9: the audio engine + Wake Lock + NoSleep
// kicks land in PR 2 and live OUTSIDE this reducer. The reducer's only role
// for Start/Stop is to transition the `status` field (idle → priming →
// running → idle). The actual audio comes from the page's onClick handler
// calling primeAudio() synchronously, then dispatching START.

import {
  classicStep,
  clampBpm,
  nudgeBpm,
  BPM_MIN,
  BPM_MAX,
} from '../../lib/tempo'
import {
  BEATS_MIN,
  BEATS_MAX,
  type BeatState,
  type Mode,
  cycleDot,
  modeToPattern,
  resizePattern,
  tapAverage,
} from '../../lib/pattern'

export type Status = 'idle' | 'priming' | 'running'

export interface MetronomeState {
  bpm: number
  beats: number
  pattern: BeatState[]
  mode: Mode
  bpmEditing: boolean
  /** Trimmed to the last 6 timestamps (the tap-averager window). The 2 s
   *  reset happens via TAP_DISARM dispatched from a UI timer. */
  tapTimestamps: number[]
  tapArmed: boolean
  status: Status
  /** Runtime flag for mode === 'altmeasure': the engine flips this every
   *  bar boundary so every other measure plays silent. Not persisted. */
  altMeasureSilent: boolean
}

export type Action =
  | { type: 'SET_BPM'; bpm: number }
  | { type: 'NUDGE_BPM'; delta: number }
  | { type: 'CLASSIC_STEP'; dir: 'prev' | 'next' }
  | { type: 'SET_BEATS'; beats: number }
  | { type: 'CYCLE_DOT'; index: number }
  | { type: 'SET_MODE'; mode: Mode }
  | { type: 'BPM_EDIT_START' }
  | { type: 'BPM_EDIT_COMMIT'; bpm: number }
  | { type: 'BPM_EDIT_CANCEL' }
  | { type: 'TAP'; t: number }
  | { type: 'TAP_DISARM' }
  | { type: 'START' }
  | { type: 'PRIMED' }
  | { type: 'STOP' }
  | { type: 'TOGGLE_ALT_MEASURE_SILENT' }

/** Construct the v1 default state. The page bootstrap merges this with the
 *  persisted slice via `loadState()` from `persistence.ts`. */
export function makeInitialState(): MetronomeState {
  return {
    bpm: 120,
    beats: 4,
    pattern: ['accent', 'normal', 'normal', 'normal'],
    mode: 'all',
    bpmEditing: false,
    tapTimestamps: [],
    tapArmed: false,
    status: 'idle',
    altMeasureSilent: false,
  }
}

/** Cap the tap-timestamps array at 6 (the averager's window).
 *  Keeping it bounded matters because state is React-controlled and
 *  unbounded growth would mean ever-longer Object.is comparisons. */
const TAP_WINDOW = 6
const TAP_RESET_MS = 2000

export function metronomeReducer(state: MetronomeState, action: Action): MetronomeState {
  switch (action.type) {
    case 'SET_BPM': {
      if (!Number.isFinite(action.bpm)) return state
      const bpm = clampBpm(action.bpm)
      if (bpm === state.bpm) return state
      return { ...state, bpm }
    }

    case 'NUDGE_BPM': {
      const bpm = nudgeBpm(state.bpm, action.delta)
      if (bpm === state.bpm) return state
      return { ...state, bpm }
    }

    case 'CLASSIC_STEP': {
      const bpm = classicStep(state.bpm, action.dir)
      if (bpm === state.bpm) return state
      return { ...state, bpm }
    }

    case 'SET_BEATS': {
      if (!Number.isInteger(action.beats)) return state
      if (action.beats < BEATS_MIN || action.beats > BEATS_MAX) return state
      if (action.beats === state.beats) return state
      // If a quick mode is on, REAPPLY it at the new beats count rather than
      // untoggle. Per the design handoff: "when a quick-mode is active and
      // the user changes `beats`, reapply the mode."
      const pattern =
        state.mode === 'all' || state.mode === 'backbeat'
          ? modeToPattern(state.mode, action.beats)
          : resizePattern(state.pattern, action.beats)
      return { ...state, beats: action.beats, pattern }
    }

    case 'CYCLE_DOT': {
      if (action.index < 0 || action.index >= state.pattern.length) return state
      const next = [...state.pattern]
      const cur = next[action.index]
      if (cur === undefined) return state
      next[action.index] = cycleDot(cur)
      // Per the handoff: editing a dot CLEARS the active quick mode (sets to
      // 'custom'). altmeasure does NOT clear — it's measure-level, not
      // pattern-level — and custom is the "implicit fourth state."
      const mode: Mode =
        state.mode === 'all' || state.mode === 'backbeat' ? 'custom' : state.mode
      return { ...state, pattern: next, mode }
    }

    case 'SET_MODE': {
      if (action.mode === state.mode) return state
      const pattern = modeToPattern(action.mode, state.beats, state.pattern)
      return {
        ...state,
        mode: action.mode,
        pattern,
        // altmeasure starts on the "loud" bar (silent flag off)
        altMeasureSilent: false,
      }
    }

    case 'BPM_EDIT_START':
      if (state.status === 'priming') return state // refuse to enter edit during the warmup
      return { ...state, bpmEditing: true }

    case 'BPM_EDIT_COMMIT': {
      if (!Number.isFinite(action.bpm)) {
        // Empty / unparseable input = cancel
        return { ...state, bpmEditing: false }
      }
      const bpm = clampBpm(action.bpm)
      return { ...state, bpm, bpmEditing: false }
    }

    case 'BPM_EDIT_CANCEL':
      return { ...state, bpmEditing: false }

    case 'TAP': {
      const trimmed = [...state.tapTimestamps, action.t].slice(-TAP_WINDOW)
      const result = tapAverage(trimmed, TAP_WINDOW, TAP_RESET_MS)
      // On a reset (latest gap > resetMs), tapAverage returns null and the
      // trailing tap becomes the new session's first tap — so we start
      // fresh with just the latest timestamp.
      if (result.bpm === null && trimmed.length >= 2) {
        return { ...state, tapTimestamps: [action.t], tapArmed: true }
      }
      const bpm = result.bpm !== null ? clampBpm(result.bpm) : state.bpm
      return {
        ...state,
        tapTimestamps: trimmed,
        tapArmed: result.armed,
        bpm,
      }
    }

    case 'TAP_DISARM':
      if (!state.tapArmed && state.tapTimestamps.length === 0) return state
      return { ...state, tapTimestamps: [], tapArmed: false }

    case 'START':
      if (state.status !== 'idle') return state
      return { ...state, status: 'priming', bpmEditing: false }

    case 'PRIMED':
      if (state.status !== 'priming') return state
      return { ...state, status: 'running' }

    case 'STOP':
      if (state.status === 'idle') return state
      return { ...state, status: 'idle', altMeasureSilent: false }

    case 'TOGGLE_ALT_MEASURE_SILENT':
      return { ...state, altMeasureSilent: !state.altMeasureSilent }
  }
}

/** Re-exported for the persistence layer + UI's range guards. */
export { BPM_MIN, BPM_MAX, BEATS_MIN, BEATS_MAX }
