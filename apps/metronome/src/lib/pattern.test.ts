import { describe, it, expect } from 'vitest'
import {
  type BeatState,
  cycleDot,
  modeToPattern,
  resizePattern,
  tapAverage,
} from './pattern'

describe('cycleDot', () => {
  it('rotates empty → normal → accent → empty', () => {
    expect(cycleDot('empty')).toBe('normal')
    expect(cycleDot('normal')).toBe('accent')
    expect(cycleDot('accent')).toBe('empty')
  })
  it('is its own inverse-cubed (3 cycles return to start)', () => {
    const seq: BeatState[] = ['empty', 'normal', 'accent']
    for (const s of seq) {
      expect(cycleDot(cycleDot(cycleDot(s)))).toBe(s)
    }
  })
})

describe('modeToPattern', () => {
  describe('all (Accent on 1)', () => {
    it.each([
      [2, ['accent', 'normal']],
      [3, ['accent', 'normal', 'normal']],
      [4, ['accent', 'normal', 'normal', 'normal']],
      [7, ['accent', 'normal', 'normal', 'normal', 'normal', 'normal', 'normal']],
    ] as const)('beats=%i → %j', (beats, expected) => {
      expect(modeToPattern('all', beats)).toEqual(expected)
    })
  })

  describe('backbeat (2 & 4)', () => {
    it('4 beats → empty, normal, empty, normal', () => {
      expect(modeToPattern('backbeat', 4)).toEqual(['empty', 'normal', 'empty', 'normal'])
    })
    it('5 beats → empty, normal, empty, normal, empty', () => {
      expect(modeToPattern('backbeat', 5)).toEqual([
        'empty',
        'normal',
        'empty',
        'normal',
        'empty',
      ])
    })
    it('2 beats → empty, normal', () => {
      expect(modeToPattern('backbeat', 2)).toEqual(['empty', 'normal'])
    })
  })

  describe('altmeasure', () => {
    it('preserves the previous pattern when given', () => {
      const prev: BeatState[] = ['accent', 'accent', 'empty', 'normal']
      expect(modeToPattern('altmeasure', 4, prev)).toEqual(prev)
    })
    it('falls back to the all-default when no prev is given', () => {
      expect(modeToPattern('altmeasure', 3)).toEqual(['accent', 'normal', 'normal'])
    })
    it('resizes prev pattern to the new beats count', () => {
      const prev: BeatState[] = ['accent', 'normal', 'normal', 'normal']
      expect(modeToPattern('altmeasure', 6, prev)).toEqual([
        'accent',
        'normal',
        'normal',
        'normal',
        'normal',
        'normal',
      ])
    })
  })

  describe('custom', () => {
    it('preserves the previous pattern when given', () => {
      const prev: BeatState[] = ['accent', 'empty', 'normal', 'accent']
      expect(modeToPattern('custom', 4, prev)).toEqual(prev)
    })
    it('falls back to the all-default when no prev is given', () => {
      expect(modeToPattern('custom', 4)).toEqual(['accent', 'normal', 'normal', 'normal'])
    })
  })
})

describe('resizePattern', () => {
  it('returns a copy when sizes match', () => {
    const p: BeatState[] = ['accent', 'normal', 'normal']
    const out = resizePattern(p, 3)
    expect(out).toEqual(p)
    expect(out).not.toBe(p) // new array
  })
  it('truncates trailing beats when shrinking', () => {
    expect(resizePattern(['accent', 'normal', 'accent', 'empty'], 2)).toEqual([
      'accent',
      'normal',
    ])
  })
  it('pads with normal when growing', () => {
    expect(resizePattern(['accent'], 3)).toEqual(['accent', 'normal', 'normal'])
  })
  it('does not mutate the input', () => {
    const original: BeatState[] = ['accent', 'normal']
    resizePattern(original, 5)
    expect(original).toEqual(['accent', 'normal'])
  })
  it('handles edge cases (0 / negative beats → empty array)', () => {
    expect(resizePattern(['accent'], 0)).toEqual([])
    expect(resizePattern(['accent'], -3)).toEqual([])
  })
})

describe('tapAverage', () => {
  it('returns { bpm: null, armed: false } for 0 taps', () => {
    expect(tapAverage([])).toEqual({ bpm: null, armed: false })
  })

  it('arms but stays null on the first tap', () => {
    expect(tapAverage([1000])).toEqual({ bpm: null, armed: true })
  })

  it('computes BPM from 2 taps at 500 ms apart → 120 BPM', () => {
    expect(tapAverage([1000, 1500])).toEqual({ bpm: 120, armed: true })
  })

  it('averages over the last 6 taps', () => {
    // 5 gaps of 500 ms → mean 500 → 120 BPM
    const ts = [0, 500, 1000, 1500, 2000, 2500]
    expect(tapAverage(ts).bpm).toBe(120)
  })

  it('drops earlier taps beyond the maxKeep window', () => {
    // 8 taps at 1000 ms apart → would be 60 BPM
    // but the last 6 windows = 5 gaps of 1000 ms → still 60 BPM
    const ts = [0, 1000, 2000, 3000, 4000, 5000, 6000, 7000]
    expect(tapAverage(ts, 6).bpm).toBe(60)
  })

  it('resets when the latest gap exceeds resetMs (default 2000)', () => {
    // first three taps establish a tempo, then a 3-second gap
    const ts = [0, 500, 1000, 4500]
    expect(tapAverage(ts)).toEqual({ bpm: null, armed: true })
  })

  it('honors a custom resetMs', () => {
    // gaps = [500, 1500], mean = 1000 ms → 60 BPM at default resetMs=2000.
    // At resetMs=1000 the latest 1500 ms gap exceeds the threshold → reset.
    const ts = [0, 500, 2000]
    expect(tapAverage(ts, 6, 2000).bpm).toBe(60)
    expect(tapAverage(ts, 6, 1000)).toEqual({ bpm: null, armed: true })
  })

  it('rounds to integer BPM', () => {
    // gap of 333 ms → 60_000 / 333 = 180.18... → 180
    expect(tapAverage([0, 333]).bpm).toBe(180)
  })

  it('handles a 0 ms gap gracefully (no Infinity)', () => {
    expect(tapAverage([1000, 1000])).toEqual({ bpm: null, armed: true })
  })
})
