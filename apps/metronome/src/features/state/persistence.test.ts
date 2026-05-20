import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_PERSISTED,
  KEY_BPM,
  KEY_BEATS,
  KEY_PATTERN,
  KEY_MODE,
  loadState,
  saveState,
  makeDebouncedSave,
  type PersistedState,
} from './persistence'

const FULL_PREFIX = 'jazzlore:'

function rawGet(key: string): string | null {
  return localStorage.getItem(FULL_PREFIX + key)
}
function rawSet(key: string, raw: string): void {
  localStorage.setItem(FULL_PREFIX + key, raw)
}

beforeEach(() => {
  localStorage.clear()
})

describe('loadState — fresh slate', () => {
  it('returns the v1 defaults when nothing is stored', () => {
    expect(loadState()).toEqual(DEFAULT_PERSISTED)
  })
})

describe('loadState — round-trip with saveState', () => {
  it('round-trips a valid state', () => {
    const s: PersistedState = {
      bpm: 168,
      beats: 5,
      pattern: ['accent', 'normal', 'empty', 'normal', 'accent'],
      mode: 'custom',
    }
    saveState(s)
    expect(loadState()).toEqual(s)
  })
})

describe('loadState — malformed value fallback', () => {
  it('falls back to default BPM on string-typed value', () => {
    rawSet(KEY_BPM, JSON.stringify('120')) // wrong type
    expect(loadState().bpm).toBe(DEFAULT_PERSISTED.bpm)
  })
  it('falls back to default BPM on out-of-range value', () => {
    rawSet(KEY_BPM, JSON.stringify(9999))
    expect(loadState().bpm).toBe(DEFAULT_PERSISTED.bpm)
  })
  it('falls back to default BPM on JSON parse error', () => {
    rawSet(KEY_BPM, '{ not json')
    expect(loadState().bpm).toBe(DEFAULT_PERSISTED.bpm)
  })
  it('falls back to default beats on non-integer', () => {
    rawSet(KEY_BEATS, JSON.stringify(3.5))
    expect(loadState().beats).toBe(DEFAULT_PERSISTED.beats)
  })
  it('falls back to default beats on out-of-range', () => {
    rawSet(KEY_BEATS, JSON.stringify(99))
    expect(loadState().beats).toBe(DEFAULT_PERSISTED.beats)
  })
  it('falls back to default pattern on non-array', () => {
    rawSet(KEY_PATTERN, JSON.stringify('foo'))
    expect(loadState().pattern).toEqual(DEFAULT_PERSISTED.pattern)
  })
  it('falls back to default pattern on array of invalid beat states', () => {
    rawSet(KEY_PATTERN, JSON.stringify(['normal', 'unknown', 'normal']))
    expect(loadState().pattern).toEqual(DEFAULT_PERSISTED.pattern)
  })
  it('falls back to default pattern when pattern length is out of range', () => {
    // pattern length 1 is below BEATS_MIN=2 — invalid
    rawSet(KEY_PATTERN, JSON.stringify(['accent']))
    expect(loadState().pattern).toEqual(DEFAULT_PERSISTED.pattern)
  })
  it('falls back to default mode on unknown mode', () => {
    rawSet(KEY_MODE, JSON.stringify('badmode'))
    expect(loadState().mode).toBe(DEFAULT_PERSISTED.mode)
  })
  it('per-key fallback: corrupt pattern does not poison bpm', () => {
    rawSet(KEY_BPM, JSON.stringify(168))
    rawSet(KEY_PATTERN, '{ corrupt')
    const s = loadState()
    expect(s.bpm).toBe(168)
    expect(s.pattern).toEqual(DEFAULT_PERSISTED.pattern) // 4-long default
    expect(s.beats).toBe(DEFAULT_PERSISTED.beats)
  })
})

describe('loadState — pattern/beats consistency', () => {
  it('resizes pattern to match beats when they disagree', () => {
    // Persist 5 beats but only a 4-long pattern → load resizes to 5
    rawSet(KEY_BEATS, JSON.stringify(5))
    rawSet(
      KEY_PATTERN,
      JSON.stringify(['accent', 'normal', 'normal', 'normal']),
    )
    const s = loadState()
    expect(s.beats).toBe(5)
    expect(s.pattern.length).toBe(5)
    expect(s.pattern[0]).toBe('accent')
    expect(s.pattern[4]).toBe('normal') // padded
  })
  it('truncates pattern when it is longer than beats', () => {
    rawSet(KEY_BEATS, JSON.stringify(3))
    rawSet(
      KEY_PATTERN,
      JSON.stringify(['accent', 'normal', 'accent', 'normal', 'normal']),
    )
    const s = loadState()
    expect(s.beats).toBe(3)
    expect(s.pattern).toEqual(['accent', 'normal', 'accent'])
  })
})

describe('saveState', () => {
  it('writes each slice under the prefixed key', () => {
    saveState({
      bpm: 144,
      beats: 3,
      pattern: ['accent', 'normal', 'normal'],
      mode: 'all',
    })
    expect(rawGet(KEY_BPM)).toBe('144')
    expect(rawGet(KEY_BEATS)).toBe('3')
    expect(rawGet(KEY_PATTERN)).toBe(JSON.stringify(['accent', 'normal', 'normal']))
    expect(rawGet(KEY_MODE)).toBe(JSON.stringify('all'))
  })
})

describe('makeDebouncedSave', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })
  it('coalesces multiple rapid calls into a single write', () => {
    const save = makeDebouncedSave(200)
    save({ bpm: 60, beats: 4, pattern: DEFAULT_PERSISTED.pattern, mode: 'all' })
    save({ bpm: 90, beats: 4, pattern: DEFAULT_PERSISTED.pattern, mode: 'all' })
    save({ bpm: 144, beats: 4, pattern: DEFAULT_PERSISTED.pattern, mode: 'all' })
    expect(rawGet(KEY_BPM)).toBeNull()
    vi.advanceTimersByTime(200)
    expect(rawGet(KEY_BPM)).toBe('144') // only the latest survives
  })
  it('writes after the debounce window elapses', () => {
    const save = makeDebouncedSave(100)
    save(DEFAULT_PERSISTED)
    vi.advanceTimersByTime(99)
    expect(rawGet(KEY_BPM)).toBeNull()
    vi.advanceTimersByTime(1)
    expect(rawGet(KEY_BPM)).toBe('120')
  })
})
