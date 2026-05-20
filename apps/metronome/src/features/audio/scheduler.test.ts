import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createScheduler, type SchedulerCtx } from './scheduler'

/** Fake AudioContext-like — currentTime is mutable so tests can advance it
 *  manually between scheduler ticks. */
function makeFakeCtx(initial = 0): SchedulerCtx & { advance(s: number): void } {
  let t = initial
  return {
    get currentTime() {
      return t
    },
    advance(s: number) {
      t += s
    },
  }
}

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

describe('createScheduler — initial scheduling', () => {
  it('schedules every beat within the lookahead window on first tick', () => {
    const ctx = makeFakeCtx(0)
    const onTick = vi.fn()
    const sched = createScheduler({
      ctx,
      onTick,
      startTime: 0,
      beatDurationSec: () => 0.5, // 120 BPM
      lookaheadSec: 0.1,
      intervalMs: 25,
    })
    sched.start()
    // ctx.currentTime + lookahead = 0 + 0.1. Only beat 0 (at t=0) is in
    // window; beat 1 at t=0.5 is past it.
    expect(onTick).toHaveBeenCalledTimes(1)
    expect(onTick).toHaveBeenCalledWith(0, 0)
    sched.stop()
  })

  it('advances the cursor and schedules subsequent beats as time passes', () => {
    const ctx = makeFakeCtx(0)
    const onTick = vi.fn()
    const sched = createScheduler({
      ctx,
      onTick,
      startTime: 0,
      beatDurationSec: () => 0.1, // 600 BPM — every tick will see new beats
      lookaheadSec: 0.1,
      intervalMs: 25,
    })
    sched.start()
    // First tick: window is (0, 0.1) → beat 0 only
    expect(onTick).toHaveBeenCalledTimes(1)

    // Advance ctx time by 0.05 s and run the next setInterval tick
    ctx.advance(0.05)
    vi.advanceTimersByTime(25)
    // Window is now (0.05, 0.15) → beat 1 at t=0.1 is in range
    expect(onTick).toHaveBeenCalledTimes(2)
    expect(onTick).toHaveBeenNthCalledWith(2, 1, 0.1)

    sched.stop()
  })

  it('honors a longer lookahead', () => {
    const ctx = makeFakeCtx(0)
    const onTick = vi.fn()
    const sched = createScheduler({
      ctx,
      onTick,
      startTime: 0,
      beatDurationSec: () => 0.5,
      lookaheadSec: 1.0, // very long lookahead
      intervalMs: 25,
    })
    sched.start()
    // Window (0, 1.0) catches beats 0 (t=0), 1 (t=0.5) — both in window
    expect(onTick).toHaveBeenCalledTimes(2)
    sched.stop()
  })
})

describe('createScheduler — warmup', () => {
  it('does NOT fire any tick when startTime is past the lookahead window', () => {
    const ctx = makeFakeCtx(0)
    const onTick = vi.fn()
    const sched = createScheduler({
      ctx,
      onTick,
      startTime: 0.4, // 400 ms warmup
      beatDurationSec: () => 0.5,
      lookaheadSec: 0.1,
      intervalMs: 25,
    })
    sched.start()
    // Window (0, 0.1) — beat 0 is at t=0.4, outside window. Nothing fires.
    expect(onTick).not.toHaveBeenCalled()
    sched.stop()
  })

  it('fires the first beat when ctx time crosses the warmup threshold', () => {
    const ctx = makeFakeCtx(0)
    const onTick = vi.fn()
    const sched = createScheduler({
      ctx,
      onTick,
      startTime: 0.4,
      beatDurationSec: () => 0.5,
      lookaheadSec: 0.1,
      intervalMs: 25,
    })
    sched.start()
    expect(onTick).not.toHaveBeenCalled()

    // Advance ctx until the window catches the warmup beat
    ctx.advance(0.35) // ctx now at 0.35, window (0.35, 0.45) — catches t=0.4
    vi.advanceTimersByTime(25)
    expect(onTick).toHaveBeenCalledTimes(1)
    expect(onTick).toHaveBeenCalledWith(0, 0.4)

    sched.stop()
  })
})

describe('createScheduler — live BPM changes', () => {
  // The canonical Chris-Wilson semantic: the cursor commits the NEXT beat's
  // time when the CURRENT beat fires. A beatDurationSec() change therefore
  // takes effect on the beat AFTER the one already committed — at most one
  // beat of latency, which is fine for a metronome.
  it('applies new beatDurationSec() to the beat AFTER the next committed one', () => {
    const ctx = makeFakeCtx(0)
    const onTick = vi.fn()
    let beatDur = 0.5 // 120 BPM
    const sched = createScheduler({
      ctx,
      onTick,
      startTime: 0,
      beatDurationSec: () => beatDur,
      lookaheadSec: 0.1,
      intervalMs: 25,
    })
    sched.start()
    // First tick: schedules beat 0 at t=0; cursor → 0.5 (committed before
    // beatDur change).
    expect(onTick).toHaveBeenCalledTimes(1)
    expect(onTick).toHaveBeenLastCalledWith(0, 0)

    // Switch to 60 BPM (1 s/beat). Advance ctx so the next tick's window
    // catches the already-committed beat 1 at t=0.5.
    beatDur = 1.0
    ctx.advance(0.5) // ctx 0.5, window (0.5, 0.6) — beat 1 at t=0.5 fires
    vi.advanceTimersByTime(25)
    expect(onTick).toHaveBeenCalledTimes(2)
    expect(onTick).toHaveBeenLastCalledWith(1, 0.5)
    // Cursor for beat 2 now reads the NEW beatDur: 0.5 + 1.0 = 1.5

    // Advance toward beat 2 — should fire at t=1.5, not the old 1.0.
    ctx.advance(0.95) // ctx 1.45, window (1.45, 1.55) — catches t=1.5
    vi.advanceTimersByTime(25)
    expect(onTick).toHaveBeenCalledTimes(3)
    expect(onTick).toHaveBeenLastCalledWith(2, 1.5)

    sched.stop()
  })
})

describe('createScheduler — lifecycle', () => {
  it('stop() halts further ticks', () => {
    const ctx = makeFakeCtx(0)
    const onTick = vi.fn()
    const sched = createScheduler({
      ctx,
      onTick,
      startTime: 0,
      beatDurationSec: () => 0.05, // fast — would otherwise fire many beats
      lookaheadSec: 0.1,
      intervalMs: 25,
    })
    sched.start()
    const initial = onTick.mock.calls.length
    sched.stop()
    ctx.advance(1.0)
    vi.advanceTimersByTime(500)
    expect(onTick.mock.calls.length).toBe(initial) // no new calls after stop
  })

  it('start() is idempotent (calling twice does not double-tick)', () => {
    const ctx = makeFakeCtx(0)
    const onTick = vi.fn()
    const sched = createScheduler({
      ctx,
      onTick,
      startTime: 0,
      beatDurationSec: () => 0.5,
      lookaheadSec: 0.1,
      intervalMs: 25,
    })
    sched.start()
    sched.start() // no-op
    expect(onTick).toHaveBeenCalledTimes(1)
    sched.stop()
  })

  it('getNextBeatIndex tracks the cursor', () => {
    const ctx = makeFakeCtx(0)
    const sched = createScheduler({
      ctx,
      onTick: () => {},
      startTime: 0,
      beatDurationSec: () => 0.05,
      lookaheadSec: 0.1,
      intervalMs: 25,
    })
    expect(sched.getNextBeatIndex()).toBe(0)
    sched.start()
    // First tick schedules beats at t=0 and t=0.05 (both in window 0..0.1)
    expect(sched.getNextBeatIndex()).toBe(2)
    sched.stop()
  })
})
