import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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
    setContext: vi.fn(),
    getContext: vi.fn(() => ({ state: 'running', rawContext: { state: 'running' } })),
    Transport: { stop: vi.fn() },
    now: vi.fn().mockReturnValue(0),
  }
})

import {
  __resetForTests,
  ensureEngine,
  playChord,
  playScale,
  primeAudio,
  stopAll,
  unlockAudio,
} from './audioEngine'

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

  it('schedules each arpeggio note 0.2 s apart (startTime = i * 0.2)', async () => {
    // Tone.now() is mocked to return 0
    await playChord(['C4', 'E4', 'G4'])
    // n arpeggio calls + n block calls (block re-strike added 2026-05-16).
    expect(triggerAttackRelease).toHaveBeenCalledTimes(6)
    const calls = triggerAttackRelease.mock.calls as [string, number, number][]
    // First n are the arpeggio: note i starts at now + i * 0.2.
    expect(calls[0]?.[2]).toBeCloseTo(0, 5)       // note 0 starts at t=0
    expect(calls[1]?.[2]).toBeCloseTo(0.2, 5)      // note 1 starts at t=200 ms
    expect(calls[2]?.[2]).toBeCloseTo(0.4, 5)      // note 2 starts at t=400 ms
  })

  it('arpeggio notes ring 0.2 s; the final note is held 0.5 s', async () => {
    // User-specified absolute values (2026-05-16): first notes 0.2 s, last 0.5 s.
    await playChord(['C4', 'E4', 'G4'])
    const calls = triggerAttackRelease.mock.calls as [string, number, number][]
    const arp = calls.slice(0, 3)
    expect(arp[0]?.[1]).toBeCloseTo(0.2, 5) // note 0
    expect(arp[1]?.[1]).toBeCloseTo(0.2, 5) // note 1
    expect(arp[2]?.[1]).toBeCloseTo(0.5, 5) // last note: held longer
  })

  it('re-strikes all notes as a simultaneous block after the arpeggio', async () => {
    // 3 notes → 3 arpeggio + 3 block calls = 6 total. The final arp note (i=2)
    // is held 0.5 s, so the block starts at (n-1)*0.2 + 0.5 = 0.4 + 0.5 = 0.9 s,
    // each for CHORD_BLOCK_S = 1.2 s. (now mocked to 0.)
    await playChord(['C4', 'E4', 'G4'])
    const calls = triggerAttackRelease.mock.calls as [string, number, number][]
    expect(calls).toHaveLength(6)
    const block = calls.slice(3)
    expect(block.map((c) => c[0])).toEqual(['C4', 'E4', 'G4'])
    for (const c of block) {
      expect(c[1]).toBeCloseTo(1.2, 5) // block duration (user-specified 2026-05-16)
      expect(c[2]).toBeCloseTo(0.9, 5) // struck together after the held last note
    }
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

describe('primeAudio / iOS unlock', () => {
  describe('without Web Audio (jsdom — no window.AudioContext)', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      __resetForTests()
    })

    it('primeAudio() is a safe no-op and does not throw', () => {
      expect(() => primeAudio()).not.toThrow()
    })

    it('unlockAudio() still calls Tone.start and skips setContext when nothing was primed', async () => {
      primeAudio()
      await unlockAudio()
      const Tone = await import('tone')
      expect(Tone.start).toHaveBeenCalledTimes(1)
      expect(Tone.setContext).not.toHaveBeenCalled()
    })
  })

  describe('with a stubbed AudioContext (the iOS gesture path)', () => {
    type FakeCtx = {
      state: 'suspended' | 'running'
      destination: object
      resume: ReturnType<typeof vi.fn>
      createBuffer: ReturnType<typeof vi.fn>
      createBufferSource: ReturnType<typeof vi.fn>
    }
    const ctxInstances: FakeCtx[] = []

    // Factory (returns an object so `new FakeAudioContext()` yields it) — no
    // class/`this` aliasing. Each instance pushes itself for assertions.
    function FakeAudioContext(): FakeCtx {
      const ctx: FakeCtx = {
        state: 'suspended',
        destination: {},
        resume: vi.fn(() => {
          ctx.state = 'running'
          return Promise.resolve()
        }),
        createBuffer: vi.fn(() => ({})),
        createBufferSource: vi.fn(() => ({ buffer: null, connect: vi.fn(), start: vi.fn() })),
      }
      ctxInstances.push(ctx)
      return ctx
    }
    const lastCtx = (): FakeCtx | undefined => ctxInstances.at(-1)

    beforeEach(() => {
      vi.clearAllMocks()
      __resetForTests()
      ctxInstances.length = 0
      vi.stubGlobal('AudioContext', FakeAudioContext)
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('primeAudio() creates the context and resumes it (with the legacy silent-buffer kick)', () => {
      primeAudio()
      const ctx = lastCtx()
      if (!ctx) throw new Error('expected primeAudio to create a context')
      expect(ctx.resume).toHaveBeenCalledTimes(1)
      expect(ctx.createBufferSource).toHaveBeenCalledTimes(1)
    })

    it('unlockAudio() binds Tone to the primed context exactly once, then starts', async () => {
      primeAudio()
      const ctx = lastCtx()
      await unlockAudio()
      const Tone = await import('tone')
      expect(Tone.setContext).toHaveBeenCalledTimes(1)
      expect(Tone.setContext).toHaveBeenCalledWith(ctx)
      expect(Tone.start).toHaveBeenCalledTimes(1)
      // A second unlock must NOT rebind — that would orphan the Sampler.
      await unlockAudio()
      expect(Tone.setContext).toHaveBeenCalledTimes(1)
    })

    it('primeAudio() re-resumes the existing context instead of recreating it', () => {
      primeAudio()
      const first = lastCtx()
      if (!first) throw new Error('expected a context')
      first.state = 'suspended' // simulate an iOS interruption (call, silent switch)
      primeAudio()
      expect(ctxInstances).toHaveLength(1) // same instance, not recreated
      expect(first.resume).toHaveBeenCalledTimes(2)
    })
  })
})
