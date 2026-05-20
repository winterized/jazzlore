// Chris-Wilson lookahead scheduler — the canonical Web Audio metronome
// pattern. Combines a coarse setInterval (the "lookahead tick", ~25 ms) with
// a fine AudioContext-time cursor (the "next beat time"). Each tick walks
// the cursor forward and emits onTick(beatIndex, audioTime) for every beat
// whose scheduled time falls within (now, now + lookaheadSec). The audio
// engine reads onTick callbacks and schedules sample-accurate sounds at the
// emitted audioTime via AudioBufferSourceNode.start(time).
//
// This module is pure (no React, no DOM). It accepts an AudioContext-like
// object so it can be unit-tested with a fake ctx that exposes `currentTime`.

export interface SchedulerCtx {
  /** Audio context time in seconds — must monotonically increase. */
  readonly currentTime: number
}

export interface SchedulerOptions {
  ctx: SchedulerCtx
  /** How far ahead (seconds) we schedule beats. Default 0.1 (100 ms). */
  lookaheadSec?: number
  /** How often the lookahead tick fires (ms). Default 25. */
  intervalMs?: number
  /** Fires once per beat. `audioTime` is the AudioContext time at which the
   *  caller should schedule the actual sound (via osc.start(audioTime)). */
  onTick: (beatIndex: number, audioTime: number) => void
  /** Seconds per beat. The scheduler reads this each tick so live BPM
   *  changes apply on the next beat. */
  beatDurationSec: () => number
  /** Audio time at which beat 0 fires. Used for the 400 ms warmup —
   *  the engine sets startTime = ctx.currentTime + 0.4. */
  startTime: number
}

export interface SchedulerHandle {
  start(): void
  stop(): void
  /** Index of the next beat to be scheduled. Useful for tests + the engine's
   *  mode-gating logic. */
  getNextBeatIndex(): number
}

export const DEFAULT_LOOKAHEAD_SEC = 0.1
export const DEFAULT_INTERVAL_MS = 25

export function createScheduler(opts: SchedulerOptions): SchedulerHandle {
  const lookaheadSec = opts.lookaheadSec ?? DEFAULT_LOOKAHEAD_SEC
  const intervalMs = opts.intervalMs ?? DEFAULT_INTERVAL_MS

  let nextBeatTime = opts.startTime
  let nextBeatIndex = 0
  let timerId: ReturnType<typeof setInterval> | null = null

  const tick = (): void => {
    // Schedule every beat whose time is within the lookahead window.
    while (nextBeatTime < opts.ctx.currentTime + lookaheadSec) {
      opts.onTick(nextBeatIndex, nextBeatTime)
      nextBeatTime += opts.beatDurationSec()
      nextBeatIndex += 1
    }
  }

  return {
    start(): void {
      if (timerId !== null) return // already running
      // Fire one tick immediately so the first beat is scheduled without
      // waiting for the first setInterval cycle (~25 ms latency saved).
      tick()
      timerId = setInterval(tick, intervalMs)
    },
    stop(): void {
      if (timerId !== null) {
        clearInterval(timerId)
        timerId = null
      }
    },
    getNextBeatIndex(): number {
      return nextBeatIndex
    },
  }
}
