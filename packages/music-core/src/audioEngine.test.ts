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
    // n arpeggio calls + n block calls (block re-strike added 2026-05-16).
    expect(triggerAttackRelease).toHaveBeenCalledTimes(6)
    const calls = triggerAttackRelease.mock.calls as [string, number, number][]
    // First n are the arpeggio: note i starts at now + i * 0.15.
    expect(calls[0]?.[2]).toBeCloseTo(0, 5)       // note 0 starts at t=0
    expect(calls[1]?.[2]).toBeCloseTo(0.15, 5)     // note 1 starts at t=150 ms
    expect(calls[2]?.[2]).toBeCloseTo(0.30, 5)     // note 2 starts at t=300 ms
  })

  it('arpeggio notes ring one step; the final note is held twice as long', async () => {
    // Notes 0..n-2 ring CHORD_STAGGER_S (0.15 s); the last is held 2× (0.30 s).
    await playChord(['C4', 'E4', 'G4'])
    const calls = triggerAttackRelease.mock.calls as [string, number, number][]
    const arp = calls.slice(0, 3)
    expect(arp[0]?.[1]).toBeCloseTo(0.15, 5) // note 0: one step
    expect(arp[1]?.[1]).toBeCloseTo(0.15, 5) // note 1: one step
    expect(arp[2]?.[1]).toBeCloseTo(0.3, 5) // last note: twice as long
    // Requirement (user 2026-05-16): last arpeggio note = 2× the previous ones.
    expect(arp[2]![1]).toBeCloseTo(2 * arp[1]![1], 5)
  })

  it('re-strikes all notes as a simultaneous block after the arpeggio', async () => {
    // 3 notes → 3 arpeggio calls + 3 block calls = 6 total. The final arp note
    // (i=2) is held 2 steps, so the block starts at (n-1)*0.15 + 2*0.15 =
    // 0.30 + 0.30 = 0.60 s, each for CHORD_BLOCK_S = 1.8 s. (now mocked to 0.)
    await playChord(['C4', 'E4', 'G4'])
    const calls = triggerAttackRelease.mock.calls as [string, number, number][]
    expect(calls).toHaveLength(6)
    const block = calls.slice(3)
    expect(block.map((c) => c[0])).toEqual(['C4', 'E4', 'G4'])
    for (const c of block) {
      expect(c[1]).toBeCloseTo(1.8, 5) // block duration
      expect(c[2]).toBeCloseTo(0.6, 5) // struck together after the held last note
    }
    // Requirement (user 2026-05-16): block lasts 3× the original 0.6 s.
    expect(block[0]![1]).toBeCloseTo(3 * 0.6, 5)
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
