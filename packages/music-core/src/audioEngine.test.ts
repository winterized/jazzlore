import { beforeEach, describe, expect, it, vi } from 'vitest'

// Hoisted mock — must be set up before importing audioEngine
const triggerAttackRelease = vi.fn()
const releaseAll = vi.fn()
const dispose = vi.fn()

vi.mock('tone', () => {
  return {
    Sampler: vi.fn(function (this: unknown, opts: { onload?: () => void; onerror?: (e: Error) => void }) {
      const instance = {
        triggerAttackRelease,
        releaseAll,
        dispose,
        toDestination() {
          return this
        },
      }
      // Resolve onload on next microtask to simulate fast loading
      queueMicrotask(() => opts.onload?.())
      return instance
    }),
    PolySynth: vi.fn(function (this: unknown) {
      return {
        triggerAttackRelease,
        releaseAll,
        dispose,
        toDestination() {
          return this
        },
      }
    }),
    start: vi.fn().mockResolvedValue(undefined),
    Transport: { stop: vi.fn() },
    now: vi.fn().mockReturnValue(0),
  }
})

import { __resetForTests, ensureEngine, playChord, playScale, stopAll, unlockAudio } from './audioEngine'

describe('audioEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    __resetForTests()
  })

  it('ensureEngine initializes a Sampler on first call', async () => {
    const kind = await ensureEngine()
    expect(kind).toBe('sampler')
    const Tone = await import('tone')
    expect(Tone.Sampler).toHaveBeenCalledTimes(1)
  })

  it('ensureEngine is idempotent — second call returns same kind without re-initing', async () => {
    await ensureEngine()
    await ensureEngine()
    const Tone = await import('tone')
    expect(Tone.Sampler).toHaveBeenCalledTimes(1)
  })

  it('playScale schedules one note per element', async () => {
    await ensureEngine()
    await playScale(['C4', 'D4', 'E4', 'F4'])
    expect(triggerAttackRelease).toHaveBeenCalledTimes(4)
  })

  it('unlockAudio calls Tone.start()', async () => {
    await unlockAudio()
    const Tone = await import('tone')
    expect(Tone.start).toHaveBeenCalledTimes(1)
  })

  it('stopAll calls releaseAll on the engine', async () => {
    await ensureEngine()
    stopAll()
    expect(releaseAll).toHaveBeenCalledTimes(1)
  })
})

describe('playChord', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    __resetForTests()
  })

  it('empty notes array is a no-op — no triggerAttackRelease calls', async () => {
    await playChord([])
    expect(triggerAttackRelease).not.toHaveBeenCalled()
  })

  it('schedules each note staggered ~150 ms apart (startTime = i * 0.15)', async () => {
    // Tone.now() is mocked to return 0
    await playChord(['C4', 'E4', 'G4'])
    // Each note i should start at now + i * 0.15
    expect(triggerAttackRelease).toHaveBeenCalledTimes(3)
    const calls = triggerAttackRelease.mock.calls as [string, number, number][]
    expect(calls[0]?.[2]).toBeCloseTo(0, 5)       // note 0 starts at t=0
    expect(calls[1]?.[2]).toBeCloseTo(0.15, 5)     // note 1 starts at t=150 ms
    expect(calls[2]?.[2]).toBeCloseTo(0.30, 5)     // note 2 starts at t=300 ms
  })

  it('each note duration extends to the block end so all sustain together', async () => {
    // For 3 notes: block ends at (3-1)*0.15 + 0.6 = 0.9 s from now (t=0)
    // note i duration = (n-i-1)*0.15 + 0.6
    await playChord(['C4', 'E4', 'G4'])
    const calls = triggerAttackRelease.mock.calls as [string, number, number][]
    // note 0: duration = (3-0-1)*0.15 + 0.6 = 0.30 + 0.6 = 0.9
    expect(calls[0]?.[1]).toBeCloseTo(0.9, 5)
    // note 1: duration = (3-1-1)*0.15 + 0.6 = 0.15 + 0.6 = 0.75
    expect(calls[1]?.[1]).toBeCloseTo(0.75, 5)
    // note 2: duration = (3-2-1)*0.15 + 0.6 = 0 + 0.6 = 0.6
    expect(calls[2]?.[1]).toBeCloseTo(0.6, 5)
  })

  it('calls stopAll() before scheduling so re-clicking another chord stops previous playback', async () => {
    await ensureEngine()
    // Reset releaseAll count after ensureEngine
    releaseAll.mockClear()
    // Play one chord
    await playChord(['C4', 'E4'])
    // releaseAll should have been called once (stopAll inside playChord)
    expect(releaseAll).toHaveBeenCalledTimes(1)
  })

  it('calling playChord a second time calls stopAll() again (re-entry)', async () => {
    await playChord(['C4', 'E4'])
    releaseAll.mockClear()
    await playChord(['G4', 'B4'])
    expect(releaseAll).toHaveBeenCalledTimes(1)
  })

  it('note names are passed through to triggerAttackRelease unchanged', async () => {
    await playChord(['C4', 'Bb4', 'G4'])
    const calls = triggerAttackRelease.mock.calls as [string, number, number][]
    expect(calls[0]?.[0]).toBe('C4')
    expect(calls[1]?.[0]).toBe('Bb4')
    expect(calls[2]?.[0]).toBe('G4')
  })
})
