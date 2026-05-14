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

import { __resetForTests, ensureEngine, playScale, stopAll, unlockAudio } from './audioEngine'

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
