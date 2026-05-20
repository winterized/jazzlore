// Persistence seam for the metronome state. Reads + writes through
// @jazzlore/music-core's `storage` module, which prepends the `jazzlore:`
// key prefix. Per the plan, four separate keys:
//   jazzlore:metronome:bpm
//   jazzlore:metronome:beats
//   jazzlore:metronome:pattern
//   jazzlore:metronome:mode
//
// Each read is validated against the live shape — malformed values (from a
// stale schema, a manual DevTools edit, or a JSON.parse on a coerced string)
// fall through to the v1 defaults. No exceptions cross this boundary; the
// page hydrates with a valid state on every mount.

import { read, write } from '@jazzlore/music-core'
import { BPM_MIN, BPM_MAX, clampBpm } from '../../lib/tempo'
import {
  BEATS_MIN,
  BEATS_MAX,
  type BeatState,
  type Mode,
  resizePattern,
} from '../../lib/pattern'

export interface PersistedState {
  bpm: number
  beats: number
  pattern: BeatState[]
  mode: Mode
}

export const KEY_BPM = 'metronome:bpm'
export const KEY_BEATS = 'metronome:beats'
export const KEY_PATTERN = 'metronome:pattern'
export const KEY_MODE = 'metronome:mode'

export const DEFAULT_PERSISTED: PersistedState = {
  bpm: 120,
  beats: 4,
  pattern: ['accent', 'normal', 'normal', 'normal'],
  mode: 'all',
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}
function isValidBpm(v: unknown): v is number {
  return isFiniteNumber(v) && v >= BPM_MIN && v <= BPM_MAX
}
function isValidBeats(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= BEATS_MIN && v <= BEATS_MAX
}
function isBeatState(v: unknown): v is BeatState {
  return v === 'empty' || v === 'normal' || v === 'accent'
}
function isValidPattern(v: unknown): v is BeatState[] {
  return (
    Array.isArray(v) &&
    v.length >= BEATS_MIN &&
    v.length <= BEATS_MAX &&
    v.every(isBeatState)
  )
}
function isValidMode(v: unknown): v is Mode {
  return v === 'all' || v === 'backbeat' || v === 'altmeasure' || v === 'custom'
}

/** Read + validate all four persisted keys. Each key falls back to the v1
 *  default independently — a corrupt `pattern` doesn't poison the `bpm`. If
 *  the persisted `pattern.length` disagrees with the persisted `beats`, we
 *  resize the pattern to match (truncating or padding with 'normal'); this
 *  matters because the reducer's invariant is `pattern.length === beats`. */
export function loadState(): PersistedState {
  const bpmRaw = read<unknown>(KEY_BPM)
  const beatsRaw = read<unknown>(KEY_BEATS)
  const patternRaw = read<unknown>(KEY_PATTERN)
  const modeRaw = read<unknown>(KEY_MODE)

  const bpm = isValidBpm(bpmRaw) ? clampBpm(bpmRaw) : DEFAULT_PERSISTED.bpm
  const beats = isValidBeats(beatsRaw) ? beatsRaw : DEFAULT_PERSISTED.beats
  let pattern: BeatState[] = isValidPattern(patternRaw)
    ? [...patternRaw]
    : [...DEFAULT_PERSISTED.pattern]
  if (pattern.length !== beats) pattern = resizePattern(pattern, beats)
  const mode: Mode = isValidMode(modeRaw) ? modeRaw : DEFAULT_PERSISTED.mode

  return { bpm, beats, pattern, mode }
}

/** Atomic save of the four persisted slices. Storage writes are synchronous
 *  but JSON serialization for the pattern is non-trivial — call via
 *  `makeDebouncedSave()` from the page's `useEffect`, not from every action. */
export function saveState(s: PersistedState): void {
  write(KEY_BPM, s.bpm)
  write(KEY_BEATS, s.beats)
  write(KEY_PATTERN, s.pattern)
  write(KEY_MODE, s.mode)
}

/** Build a debounced wrapper around saveState. Each call resets the timer;
 *  the last `state` wins. Default debounce: 200 ms. */
export function makeDebouncedSave(ms = 200): (s: PersistedState) => void {
  let handle: ReturnType<typeof setTimeout> | null = null
  return (s) => {
    if (handle !== null) clearTimeout(handle)
    handle = setTimeout(() => {
      saveState(s)
      handle = null
    }, ms)
  }
}
