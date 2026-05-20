// Pure pattern helpers — beat-state cycling, mode→pattern conversion, pattern
// resize on beats change, tap-tempo rolling average.
//
// All functions here are pure (no React, no DOM). The reducer composes them
// to keep the action handlers small and individually testable.

export type BeatState = 'empty' | 'normal' | 'accent'
export type Mode = 'all' | 'backbeat' | 'altmeasure' | 'custom'

export const BEATS_MIN = 2
export const BEATS_MAX = 7

/** Cycle a single dot through empty → normal → accent → empty.
 *  Per the design handoff: clicking a dot rotates through the three states. */
export function cycleDot(s: BeatState): BeatState {
  switch (s) {
    case 'empty':
      return 'normal'
    case 'normal':
      return 'accent'
    case 'accent':
      return 'empty'
  }
}

/** Build the canonical pattern for the "Accent on 1" mode at a given beat
 *  count. Beat 0 is `accent`, all others `normal`. */
function allBeatsPattern(beats: number): BeatState[] {
  const out: BeatState[] = ['accent']
  for (let i = 1; i < beats; i++) out.push('normal')
  return out
}

/** Build the canonical pattern for the "2 & 4" (backbeat / jazz feel) mode.
 *  Odd-indexed beats (the backbeat) click; even-indexed beats are silent.
 *  e.g. 4 beats → ['empty','normal','empty','normal']. */
function backbeatPattern(beats: number): BeatState[] {
  const out: BeatState[] = []
  for (let i = 0; i < beats; i++) out.push(i % 2 === 1 ? 'normal' : 'empty')
  return out
}

/** Convert a Mode to its canonical pattern at a given beats count.
 *
 *  - `all` / `backbeat`: deterministic patterns derived from `beats`.
 *  - `altmeasure`: does NOT mutate the pattern (the mode's effect is a
 *    measure-level silent flag, not a per-beat one). We return the previous
 *    pattern if supplied, else the `all` default. UI mounts a second dimmed
 *    preview row when this mode is active.
 *  - `custom`: caller-supplied pattern. We return `prevPattern` verbatim if
 *    given, else the `all` default. */
export function modeToPattern(
  mode: Mode,
  beats: number,
  prevPattern?: readonly BeatState[],
): BeatState[] {
  switch (mode) {
    case 'all':
      return allBeatsPattern(beats)
    case 'backbeat':
      return backbeatPattern(beats)
    case 'altmeasure':
    case 'custom':
      return prevPattern ? resizePattern([...prevPattern], beats) : allBeatsPattern(beats)
  }
}

/** Truncate or pad a pattern to a new beats count.
 *
 *  Pad slots (when the new count is larger) get `'normal'` — the same value
 *  as the rest of an Accent-on-1 row, so the meter change feels natural.
 *  Truncate just drops trailing beats. The original array is not mutated. */
export function resizePattern(pattern: readonly BeatState[], newBeats: number): BeatState[] {
  if (newBeats <= 0) return []
  if (pattern.length === newBeats) return [...pattern]
  if (pattern.length > newBeats) return pattern.slice(0, newBeats)
  const out = [...pattern]
  while (out.length < newBeats) out.push('normal')
  return out
}

/** Tap-tempo rolling averager.
 *
 *  Given an array of tap timestamps (ms — `performance.now()` style),
 *  returns the implied BPM from the inter-tap gaps. Behavior:
 *
 *  - Fewer than 2 taps → bpm: null (caller keeps the current BPM, shows the
 *    "armed" state so the user knows their first tap registered).
 *  - The averager looks only at the trailing `maxKeep` taps (default 6),
 *    matching the handoff README ("last 6 averaged").
 *  - If the LATEST tap's gap from the prior one is > resetMs (default
 *    2000 ms), treat the trailing tap as a fresh session: drop everything
 *    before it and return { bpm: null, armed: true }. This is the "reset
 *    after 2 s of inactivity" rule.
 *  - Otherwise compute BPM = round(60_000 / mean-of-gaps). */
export interface TapResult {
  bpm: number | null
  /** true once at least one tap has registered; UI surfaces the armed state. */
  armed: boolean
}
export function tapAverage(
  timestamps: readonly number[],
  maxKeep = 6,
  resetMs = 2000,
): TapResult {
  if (timestamps.length === 0) return { bpm: null, armed: false }
  if (timestamps.length === 1) return { bpm: null, armed: true }

  // Trim to the trailing `maxKeep` taps.
  const trimmed = timestamps.slice(Math.max(0, timestamps.length - maxKeep))

  // Inter-tap gaps. Length is trimmed.length - 1.
  const gaps: number[] = []
  for (let i = 1; i < trimmed.length; i++) {
    const prev = trimmed[i - 1]
    const cur = trimmed[i]
    if (prev === undefined || cur === undefined) continue
    gaps.push(cur - prev)
  }
  if (gaps.length === 0) return { bpm: null, armed: true }

  // If the LATEST gap exceeds the reset window, the user paused — fresh session.
  const latestGap = gaps[gaps.length - 1]
  if (latestGap === undefined || latestGap > resetMs) return { bpm: null, armed: true }

  // Mean gap → BPM. Clamp to a sane window so a finger jitter doesn't produce
  // 1200 BPM; the reducer's `clampBpm` covers the final clamp, but we floor
  // the gap here too at 10 ms (= 6000 BPM) to avoid Infinity from a 0 gap.
  const mean = gaps.reduce((sum, g) => sum + g, 0) / gaps.length
  if (mean <= 0) return { bpm: null, armed: true }
  const bpm = Math.round(60_000 / mean)
  return { bpm, armed: true }
}
