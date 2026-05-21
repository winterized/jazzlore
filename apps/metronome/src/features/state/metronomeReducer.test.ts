import { describe, it, expect } from 'vitest'
import {
  metronomeReducer,
  makeInitialState,
  type MetronomeState,
} from './metronomeReducer'

const init = makeInitialState

describe('SET_BPM', () => {
  it('sets a valid BPM', () => {
    const s = metronomeReducer(init(), { type: 'SET_BPM', bpm: 100 })
    expect(s.bpm).toBe(100)
  })
  it('clamps below 30', () => {
    const s = metronomeReducer(init(), { type: 'SET_BPM', bpm: 5 })
    expect(s.bpm).toBe(30)
  })
  it('clamps above 240', () => {
    const s = metronomeReducer(init(), { type: 'SET_BPM', bpm: 999 })
    expect(s.bpm).toBe(240)
  })
  it('ignores non-finite input', () => {
    const before = init()
    const after = metronomeReducer(before, { type: 'SET_BPM', bpm: NaN })
    expect(after).toBe(before) // same reference (no-op)
  })
  it('returns same reference when value unchanged', () => {
    const before = init() // bpm 120
    const after = metronomeReducer(before, { type: 'SET_BPM', bpm: 120 })
    expect(after).toBe(before)
  })
})

describe('NUDGE_BPM', () => {
  it('nudges +1', () => {
    expect(metronomeReducer(init(), { type: 'NUDGE_BPM', delta: 1 }).bpm).toBe(121)
  })
  it('nudges -10', () => {
    expect(metronomeReducer(init(), { type: 'NUDGE_BPM', delta: -10 }).bpm).toBe(110)
  })
  it('clamps at boundary', () => {
    const at30 = { ...init(), bpm: 30 }
    expect(metronomeReducer(at30, { type: 'NUDGE_BPM', delta: -1 }).bpm).toBe(30)
  })
})

describe('CLASSIC_STEP', () => {
  it('jumps next-higher from 120 → 144', () => {
    expect(metronomeReducer(init(), { type: 'CLASSIC_STEP', dir: 'next' }).bpm).toBe(144)
  })
  it('jumps next-lower from 120 → 108', () => {
    expect(metronomeReducer(init(), { type: 'CLASSIC_STEP', dir: 'prev' }).bpm).toBe(108)
  })
})

describe('SET_BEATS', () => {
  it('grows the pattern with normals when increasing beats', () => {
    const s = metronomeReducer(init(), { type: 'SET_BEATS', beats: 6 })
    expect(s.beats).toBe(6)
    // 'all' mode reapplies → ['accent', 'normal' × 5]
    expect(s.pattern).toEqual(['accent', 'normal', 'normal', 'normal', 'normal', 'normal'])
  })
  it('truncates the pattern when decreasing beats', () => {
    const s = metronomeReducer(init(), { type: 'SET_BEATS', beats: 2 })
    expect(s.beats).toBe(2)
    expect(s.pattern).toEqual(['accent', 'normal']) // 'all' mode reapplied
  })
  it('reapplies backbeat mode at the new beats count', () => {
    let s = metronomeReducer(init(), { type: 'SET_MODE', mode: 'backbeat' })
    expect(s.pattern).toEqual(['empty', 'normal', 'empty', 'normal'])
    s = metronomeReducer(s, { type: 'SET_BEATS', beats: 6 })
    expect(s.pattern).toEqual(['empty', 'normal', 'empty', 'normal', 'empty', 'normal'])
    expect(s.mode).toBe('backbeat')
  })
  it('preserves a custom-edited pattern via resize', () => {
    let s = metronomeReducer(init(), { type: 'CYCLE_DOT', index: 1 }) // 'all' → 'custom'
    expect(s.mode).toBe('custom')
    expect(s.pattern[1]).toBe('accent')
    s = metronomeReducer(s, { type: 'SET_BEATS', beats: 6 })
    expect(s.beats).toBe(6)
    // pattern[1] stays 'accent', tail padded with 'normal'
    expect(s.pattern[1]).toBe('accent')
    expect(s.pattern.length).toBe(6)
  })
  it('rejects out-of-range beats', () => {
    const before = init()
    expect(metronomeReducer(before, { type: 'SET_BEATS', beats: 1 })).toBe(before)
    expect(metronomeReducer(before, { type: 'SET_BEATS', beats: 8 })).toBe(before)
  })
  it('rejects non-integer beats', () => {
    const before = init()
    expect(metronomeReducer(before, { type: 'SET_BEATS', beats: 3.5 })).toBe(before)
  })
})

describe('CYCLE_DOT', () => {
  it('rotates a beat through empty → normal → accent → empty', () => {
    let s = init()
    expect(s.pattern[1]).toBe('normal')
    s = metronomeReducer(s, { type: 'CYCLE_DOT', index: 1 })
    expect(s.pattern[1]).toBe('accent')
    s = metronomeReducer(s, { type: 'CYCLE_DOT', index: 1 })
    expect(s.pattern[1]).toBe('empty')
    s = metronomeReducer(s, { type: 'CYCLE_DOT', index: 1 })
    expect(s.pattern[1]).toBe('normal')
  })
  it("clears the 'all' mode to 'custom' on edit", () => {
    const s = metronomeReducer(init(), { type: 'CYCLE_DOT', index: 1 })
    expect(s.mode).toBe('custom')
  })
  it("clears the 'backbeat' mode to 'custom' on edit", () => {
    let s = metronomeReducer(init(), { type: 'SET_MODE', mode: 'backbeat' })
    expect(s.mode).toBe('backbeat')
    s = metronomeReducer(s, { type: 'CYCLE_DOT', index: 0 })
    expect(s.mode).toBe('custom')
  })
  it("does NOT clear 'altmeasure' on dot edit (it's measure-level)", () => {
    let s = metronomeReducer(init(), { type: 'SET_MODE', mode: 'altmeasure' })
    expect(s.mode).toBe('altmeasure')
    s = metronomeReducer(s, { type: 'CYCLE_DOT', index: 1 })
    expect(s.mode).toBe('altmeasure')
  })
  it('ignores out-of-range index', () => {
    const before = init()
    expect(metronomeReducer(before, { type: 'CYCLE_DOT', index: -1 })).toBe(before)
    expect(metronomeReducer(before, { type: 'CYCLE_DOT', index: 99 })).toBe(before)
  })
})

describe('SET_MODE', () => {
  it("applies 'all' pattern", () => {
    const s = metronomeReducer(init(), { type: 'SET_MODE', mode: 'all' })
    expect(s.mode).toBe('all')
  })
  it("applies 'backbeat' pattern", () => {
    const s = metronomeReducer(init(), { type: 'SET_MODE', mode: 'backbeat' })
    expect(s.mode).toBe('backbeat')
    expect(s.pattern).toEqual(['empty', 'normal', 'empty', 'normal'])
  })
  it("'altmeasure' preserves the existing pattern", () => {
    let s = metronomeReducer(init(), { type: 'CYCLE_DOT', index: 1 }) // pattern[1] = 'accent', mode = 'custom'
    const prevPattern = s.pattern
    s = metronomeReducer(s, { type: 'SET_MODE', mode: 'altmeasure' })
    expect(s.pattern).toEqual(prevPattern)
    expect(s.altMeasureSilent).toBe(false) // resets on mode entry
  })
  it("'custom' is the implicit fourth state — settable but doesn't change pattern", () => {
    const before = init()
    const after = metronomeReducer(before, { type: 'SET_MODE', mode: 'custom' })
    expect(after.mode).toBe('custom')
    expect(after.pattern).toEqual(before.pattern)
  })

  it("SET_MODE 'altmeasure' when already 'altmeasure' UNTOGGLES to 'custom'", () => {
    let s = metronomeReducer(init(), { type: 'SET_MODE', mode: 'altmeasure' })
    expect(s.mode).toBe('altmeasure')
    // Pretend the engine flipped the silent flag on the off bar
    s = { ...s, altMeasureSilent: true }
    s = metronomeReducer(s, { type: 'SET_MODE', mode: 'altmeasure' })
    expect(s.mode).toBe('custom')
    expect(s.altMeasureSilent).toBe(false) // re-armed for the next session
  })

  it("SET_MODE 'all' / 'backbeat' when already active is a no-op (clear via dot edits)", () => {
    // 'all' is the default initial mode
    const before = init()
    expect(before.mode).toBe('all')
    const afterAll = metronomeReducer(before, { type: 'SET_MODE', mode: 'all' })
    expect(afterAll).toBe(before)

    const backbeatActive = metronomeReducer(init(), {
      type: 'SET_MODE',
      mode: 'backbeat',
    })
    const afterBackbeat = metronomeReducer(backbeatActive, {
      type: 'SET_MODE',
      mode: 'backbeat',
    })
    expect(afterBackbeat).toBe(backbeatActive)
  })
})

describe('BPM editing', () => {
  it('enters and cancels edit mode', () => {
    let s = metronomeReducer(init(), { type: 'BPM_EDIT_START' })
    expect(s.bpmEditing).toBe(true)
    s = metronomeReducer(s, { type: 'BPM_EDIT_CANCEL' })
    expect(s.bpmEditing).toBe(false)
    expect(s.bpm).toBe(120) // unchanged
  })
  it('commits a typed BPM', () => {
    let s = metronomeReducer(init(), { type: 'BPM_EDIT_START' })
    s = metronomeReducer(s, { type: 'BPM_EDIT_COMMIT', bpm: 95 })
    expect(s.bpm).toBe(95)
    expect(s.bpmEditing).toBe(false)
  })
  it('clamps a typed BPM out of range', () => {
    const s = metronomeReducer(init(), { type: 'BPM_EDIT_COMMIT', bpm: 500 })
    expect(s.bpm).toBe(240)
  })
  it('treats non-finite commit as cancel (NaN)', () => {
    const before = init()
    const after = metronomeReducer(
      { ...before, bpmEditing: true },
      { type: 'BPM_EDIT_COMMIT', bpm: NaN },
    )
    expect(after.bpm).toBe(120)
    expect(after.bpmEditing).toBe(false)
  })
  it("refuses to enter edit during 'priming'", () => {
    const priming: MetronomeState = { ...init(), status: 'priming' }
    const after = metronomeReducer(priming, { type: 'BPM_EDIT_START' })
    expect(after).toBe(priming)
  })
})

describe('TAP', () => {
  it('arms on the first tap (no BPM change)', () => {
    const s = metronomeReducer(init(), { type: 'TAP', t: 1000 })
    expect(s.tapArmed).toBe(true)
    expect(s.tapTimestamps).toEqual([1000])
    expect(s.bpm).toBe(120) // unchanged
  })
  it('commits BPM on the 2nd tap', () => {
    let s = metronomeReducer(init(), { type: 'TAP', t: 1000 })
    s = metronomeReducer(s, { type: 'TAP', t: 1500 }) // 500 ms gap → 120 BPM
    expect(s.bpm).toBe(120)
    expect(s.tapArmed).toBe(true)
  })
  it('changes BPM on a faster tap series', () => {
    let s = init()
    // 4 taps at 250 ms apart → 240 BPM
    s = metronomeReducer(s, { type: 'TAP', t: 0 })
    s = metronomeReducer(s, { type: 'TAP', t: 250 })
    s = metronomeReducer(s, { type: 'TAP', t: 500 })
    s = metronomeReducer(s, { type: 'TAP', t: 750 })
    expect(s.bpm).toBe(240)
  })
  it('starts fresh after a >2 s gap', () => {
    let s = init()
    s = metronomeReducer(s, { type: 'TAP', t: 0 })
    s = metronomeReducer(s, { type: 'TAP', t: 500 })
    expect(s.bpm).toBe(120)
    // 3 s gap → reset
    s = metronomeReducer(s, { type: 'TAP', t: 3500 })
    expect(s.tapTimestamps).toEqual([3500])
    expect(s.bpm).toBe(120) // unchanged (no commit during reset)
  })
  it('caps timestamps at the 6-tap window', () => {
    let s = init()
    for (let i = 0; i < 10; i++) {
      s = metronomeReducer(s, { type: 'TAP', t: i * 500 })
    }
    expect(s.tapTimestamps.length).toBe(6)
  })
})

describe('TAP_DISARM', () => {
  it('clears timestamps and tapArmed', () => {
    let s = metronomeReducer(init(), { type: 'TAP', t: 1000 })
    expect(s.tapArmed).toBe(true)
    s = metronomeReducer(s, { type: 'TAP_DISARM' })
    expect(s.tapArmed).toBe(false)
    expect(s.tapTimestamps).toEqual([])
  })
  it('is a no-op when already disarmed', () => {
    const before = init()
    expect(metronomeReducer(before, { type: 'TAP_DISARM' })).toBe(before)
  })
})

describe('status transitions', () => {
  it('idle → priming on START', () => {
    const s = metronomeReducer(init(), { type: 'START' })
    expect(s.status).toBe('priming')
  })
  it('priming → running on PRIMED', () => {
    let s = metronomeReducer(init(), { type: 'START' })
    s = metronomeReducer(s, { type: 'PRIMED' })
    expect(s.status).toBe('running')
  })
  it('running → idle on STOP', () => {
    let s = metronomeReducer(init(), { type: 'START' })
    s = metronomeReducer(s, { type: 'PRIMED' })
    s = metronomeReducer(s, { type: 'STOP' })
    expect(s.status).toBe('idle')
  })
  it('PRIMED is a no-op when not in priming', () => {
    const before = init()
    expect(metronomeReducer(before, { type: 'PRIMED' })).toBe(before)
  })
  it('START is a no-op when already running', () => {
    let s = metronomeReducer(init(), { type: 'START' })
    s = metronomeReducer(s, { type: 'PRIMED' })
    const before = s
    const after = metronomeReducer(before, { type: 'START' })
    expect(after).toBe(before)
  })
  it('START exits BPM-editing', () => {
    let s = metronomeReducer(init(), { type: 'BPM_EDIT_START' })
    s = metronomeReducer(s, { type: 'START' })
    expect(s.bpmEditing).toBe(false)
  })
  it('STOP clears altMeasureSilent', () => {
    let s: MetronomeState = { ...init(), altMeasureSilent: true, status: 'running' }
    s = metronomeReducer(s, { type: 'STOP' })
    expect(s.altMeasureSilent).toBe(false)
  })
})

describe('TOGGLE_ALT_MEASURE_SILENT', () => {
  it('flips the silent flag', () => {
    let s = init()
    expect(s.altMeasureSilent).toBe(false)
    s = metronomeReducer(s, { type: 'TOGGLE_ALT_MEASURE_SILENT' })
    expect(s.altMeasureSilent).toBe(true)
    s = metronomeReducer(s, { type: 'TOGGLE_ALT_MEASURE_SILENT' })
    expect(s.altMeasureSilent).toBe(false)
  })
})
