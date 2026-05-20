// The metronome's audio engine. Composes:
//   - its own AudioContext (constructed AFTER primeAudio() runs in the
//     user gesture; primeAudio's session-promotion makes a fresh context
//     start in 'running' state on iOS USB output)
//   - a keep-alive oscillator (sub-audible 30 Hz at ~0.0008 gain — keeps
//     the iOS USB DAC awake between clicks; see keepAlive.ts)
//   - a Chris-Wilson lookahead scheduler (25 ms tick, 100 ms lookahead)
//   - the wood-block voices (accented + normal sine sweeps + filtered
//     noise; see voices.ts)
//   - a 400 ms warmup before the first beat fires (so the DAC has fully
//     spun up before the leading edge of beat 1)
//
// The engine has NO React knowledge. It accepts pattern + mode + bpm via
// setters and fires onBeat(beatIndex) callbacks. The page (MetronomePage)
// wires onBeat into the DOM to flash the corresponding .dot element.

import type { BeatState, Mode } from '../../lib/pattern'
import { startKeepAlive, type KeepAliveHandle } from './keepAlive'
import { createScheduler, type SchedulerHandle } from './scheduler'
import { playWoodBlock } from './voices'

/** Seconds between clicks for a given BPM. */
const beatDurationFromBpm = (bpm: number): number => 60 / bpm

/** Warmup before first beat — non-negotiable per the original spec.
 *  Lets the iOS USB DAC fully spin up so the leading edge of beat 1
 *  isn't swallowed. */
export const WARMUP_SEC = 0.4

/** Tail time before closing the AudioContext on stop(), so the last
 *  scheduled click + keep-alive ramp finishes audibly. */
const CLOSE_TAIL_MS = 250

export interface EngineHandle {
  /** Build the AudioContext, start the keep-alive, schedule beat 0 at
   *  ctx.currentTime + WARMUP_SEC, and start the scheduler. Resolves
   *  when the first beat has been scheduled (i.e. the engine is "primed
   *  and counting"). */
  start(): Promise<void>
  /** Stop the scheduler, ramp the keep-alive to 0, close the context
   *  after the tail. Idempotent. */
  stop(): void
  setBpm(bpm: number): void
  /** Update pattern + mode. Called from the page on every state change
   *  in those slices. The next bar's scheduling uses the new values. */
  setPattern(pattern: readonly BeatState[], mode: Mode): void
  /** Subscribe to per-beat callbacks. Fires for EVERY beat (including
   *  silent ones on altmeasure's off bar — the UI may still want to
   *  flash the dim/dashed dot). For empty-pattern beats the engine
   *  skips the sound but still fires onBeat. */
  onBeat(cb: (beatIndexInBar: number) => void): void
}

export interface EngineParams {
  /** Initial state — the page passes its current values at creation time. */
  bpm: number
  pattern: readonly BeatState[]
  mode: Mode
}

export function createMetronomeEngine(params: EngineParams): EngineHandle {
  let ctx: AudioContext | null = null
  let keepAlive: KeepAliveHandle | null = null
  let scheduler: SchedulerHandle | null = null

  // Live-mutable state — closures inside the scheduler tick read these on
  // every beat so live BPM / pattern / mode changes take effect on the
  // next scheduled beat.
  let bpm = params.bpm
  let pattern: readonly BeatState[] = params.pattern
  let mode: Mode = params.mode

  // altmeasure measure-counter — toggles each bar boundary. Bar 0 plays
  // ("loud bar"), bar 1 is silent, repeat.
  let measureSilent = false

  let beatCallback: ((i: number) => void) | null = null

  const beatsPerBar = (): number => Math.max(1, pattern.length)

  /** Called by the scheduler for every beat. `index` is the absolute beat
   *  index (0, 1, 2, …); we mod by beats-per-bar for the in-bar position. */
  const onSchedulerTick = (index: number, audioTime: number): void => {
    if (!ctx) return
    const inBarIndex = index % beatsPerBar()

    // Bar-boundary toggle for altmeasure mode. When index advances past
    // the last beat of a bar, the NEXT scheduled beat is the start of a
    // new bar — flip the silent flag.
    if (inBarIndex === 0 && index > 0 && mode === 'altmeasure') {
      measureSilent = !measureSilent
    }

    // Silent on the off bar of altmeasure: NO sound, NO onBeat callback
    // (the visible main pattern row stays dark; the dimmed preview row
    // doesn't need to flash either — both signal "silent measure" via
    // visual stillness).
    if (mode === 'altmeasure' && measureSilent) return

    const state: BeatState = pattern[inBarIndex] ?? 'normal'

    // Always fire onBeat — even for 'empty' beats the UI may want to
    // flash the dashed dot to confirm "the metronome counted this beat
    // but didn't click."
    if (beatCallback) beatCallback(inBarIndex)

    // Skip the actual sound for 'empty' beats.
    if (state === 'empty') return

    playWoodBlock(ctx, audioTime, state === 'accent')
  }

  return {
    async start(): Promise<void> {
      if (ctx) return // already running

      // primeAudio() has already run in the caller's gesture; we can
      // safely construct a fresh AudioContext here and it starts in
      // 'running' state on iOS USB output.
      const w = window as unknown as {
        AudioContext?: typeof AudioContext
        webkitAudioContext?: typeof AudioContext
      }
      const Ctx = w.AudioContext ?? w.webkitAudioContext
      if (!Ctx) return
      ctx = new Ctx()

      // iOS sometimes hands back a context in 'suspended' state even when
      // the gesture-unlock succeeded — kick it via resume() just in case.
      if (ctx.state !== 'running') {
        try {
          await ctx.resume()
        } catch {
          // resume() can reject in rare contexts; the scheduler will still
          // try to schedule events — failed plays surface as silence.
        }
      }

      keepAlive = startKeepAlive(ctx)
      measureSilent = false

      const startTime = ctx.currentTime + WARMUP_SEC
      scheduler = createScheduler({
        ctx,
        onTick: onSchedulerTick,
        startTime,
        beatDurationSec: () => beatDurationFromBpm(bpm),
      })
      scheduler.start()
    },

    stop(): void {
      if (scheduler) {
        scheduler.stop()
        scheduler = null
      }
      if (keepAlive) {
        keepAlive.stop()
        keepAlive = null
      }
      if (ctx) {
        const c = ctx
        ctx = null
        // Tail wait so the keep-alive ramp + any in-flight clicks finish
        // before the context closes.
        setTimeout(() => {
          c.close().catch(() => {
            // close() can reject on already-closed contexts in older
            // Safari — swallow.
          })
        }, CLOSE_TAIL_MS)
      }
    },

    setBpm(b: number): void {
      bpm = b
    },

    setPattern(p: readonly BeatState[], m: Mode): void {
      pattern = p
      // Reset measure-silent when entering / leaving altmeasure so the
      // counter starts fresh on the loud bar.
      if (m !== mode) measureSilent = false
      mode = m
    },

    onBeat(cb: (i: number) => void): void {
      beatCallback = cb
    },
  }
}
