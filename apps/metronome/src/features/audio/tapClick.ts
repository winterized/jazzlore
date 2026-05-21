// Single-click audible feedback for the TAP button + T keyboard shortcut.
// Lets the user HEAR their tap so they can sync to their internal sense of
// tempo while setting BPM by feel.
//
// Architecture: a singleton AudioContext, lazily created on the first tap
// (in the user gesture) and reused for the page lifetime. NO keep-alive —
// tap clicks are transient feedback, not sustained audio; the leading-edge
// drop concern that justifies the engine's 30 Hz keep-alive doesn't apply
// to taps in isolation.
//
// CLAUDE.md item 9: primeAudio() is the FIRST synchronous statement, before
// any AudioContext construction. The TAP button + T keyboard shortcut are
// both valid user gestures for iOS audio unlock.

import { primeAudio } from '@jazzlore/music-core'
import { playWoodBlock } from './voices'

let ctx: AudioContext | null = null

/** Play a single normal-voice woodblock click on the current TAP gesture.
 *  Safe to call repeatedly — the singleton context is reused. */
export function playTapClick(): void {
  primeAudio()

  if (typeof window === 'undefined') return
  if (!ctx) {
    const w = window as unknown as {
      AudioContext?: typeof AudioContext
      webkitAudioContext?: typeof AudioContext
    }
    const Ctx = w.AudioContext ?? w.webkitAudioContext
    if (!Ctx) return
    ctx = new Ctx()
  }
  // Only resume from 'suspended' — calling resume() on a 'closed' context
  // rejects (the singleton context is never closed in normal page lifetime,
  // but the tighter guard makes that contract explicit).
  if (ctx.state === 'suspended') void ctx.resume()

  // ~5 ms ahead — gives the audio thread headroom without perceptible
  // latency vs. a now-scheduled click.
  playWoodBlock(ctx, ctx.currentTime + 0.005, false)
}
