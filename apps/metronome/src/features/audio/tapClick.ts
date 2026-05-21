// Single-click audible feedback for the TAP button + T keyboard shortcut.
// Lets the user HEAR their tap so they can sync to their internal sense of
// tempo while setting BPM by feel.
//
// Latency contract — the TAP button is the only metronome control where
// snap-tight (sub-perceptible) feedback matters more than reliability of
// the first click. The user explicitly chose this trade-off:
//
//   1. First tap is SILENT. We primeAudio(), construct the AudioContext,
//      resume(). No click scheduled. The first tap exists only to warm up
//      the audio stack so subsequent taps fire instantaneously.
//   2. Every subsequent tap schedules at ctx.currentTime EXACTLY — no
//      scheduling headroom. Only the OS audio buffer latency remains
//      (~20-50 ms on iOS Safari, irreducible from JS).
//
// This differs from the main engine, where the 400 ms warmup + 30 Hz
// keep-alive guarantee the first BEAT is heard. For TAP, the user is
// already in active gesture mode — the first silent tap is a cheap price
// for zero-latency subsequent taps.
//
// CLAUDE.md item 9: primeAudio() is the FIRST sync statement on the first
// call, before AudioContext construction. After warmup it's a no-op so we
// skip it on the fast path.

import { primeAudio } from '@jazzlore/music-core'
import { playWoodBlock } from './voices'

let ctx: AudioContext | null = null
let primed = false

export function playTapClick(): void {
  if (!primed) {
    // First call — warmup path. CLAUDE.md item 9: primeAudio() FIRST.
    primeAudio()
    if (typeof window === 'undefined') return
    const w = window as unknown as {
      AudioContext?: typeof AudioContext
      webkitAudioContext?: typeof AudioContext
    }
    const Ctx = w.AudioContext ?? w.webkitAudioContext
    if (!Ctx) return
    // latencyHint: 'interactive' is the Web Audio default but being
    // explicit here documents the latency intent for this context vs.
    // the engine's (which can tolerate the 100 ms scheduler lookahead).
    ctx = new Ctx({ latencyHint: 'interactive' })
    if (ctx.state === 'suspended') void ctx.resume()
    primed = true
    return // SILENT first tap — warmup price
  }
  if (!ctx) return // defensive — shouldn't happen post-warmup

  // Fast path — every subsequent tap. Schedule at ctx.currentTime EXACTLY
  // (no headroom). The 1 ms attack envelope inside playWoodBlock gives the
  // audio engine just enough lead time to ramp up cleanly without adding
  // perceptible latency.
  playWoodBlock(ctx, ctx.currentTime, false)
}
