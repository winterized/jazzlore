import { describe, it, expect } from 'vitest'
import {
  BPM_MIN,
  BPM_MAX,
  CLASSIC_TEMPOS,
  tempoName,
  clampBpm,
  nudgeBpm,
  classicStep,
} from './tempo'

describe('tempoName', () => {
  // Exact boundary points from the design handoff README table.
  // Lower-inclusive, upper-exclusive per the spec wording.
  it.each([
    [30, 'Largo'],
    [59, 'Largo'],
    [60, 'Adagio'],
    [75, 'Adagio'],
    [76, 'Andante'],
    [107, 'Andante'],
    [108, 'Moderato'],
    [119, 'Moderato'],
    [120, 'Allegro'],
    [155, 'Allegro'],
    [156, 'Vivace'],
    [199, 'Vivace'],
    [200, 'Presto'],
    [240, 'Presto'],
  ] as const)('BPM %i → %s', (bpm, expected) => {
    expect(tempoName(bpm)).toBe(expected)
  })
})

describe('clampBpm', () => {
  it('passes values inside [30, 240] through (rounded)', () => {
    expect(clampBpm(120)).toBe(120)
    expect(clampBpm(120.4)).toBe(120)
    expect(clampBpm(120.6)).toBe(121)
  })
  it('clamps below to BPM_MIN', () => {
    expect(clampBpm(0)).toBe(30)
    expect(clampBpm(-50)).toBe(30)
    expect(clampBpm(29)).toBe(30)
  })
  it('clamps above to BPM_MAX', () => {
    expect(clampBpm(241)).toBe(240)
    expect(clampBpm(1000)).toBe(240)
  })
  it('returns NaN for non-finite input (precondition violation surfaces upstream)', () => {
    expect(clampBpm(NaN)).toBeNaN()
  })
})

describe('nudgeBpm', () => {
  it('adds delta and clamps', () => {
    expect(nudgeBpm(120, 1)).toBe(121)
    expect(nudgeBpm(120, -1)).toBe(119)
    expect(nudgeBpm(120, 10)).toBe(130)
    expect(nudgeBpm(120, -10)).toBe(110)
  })
  it('clamps at lower bound', () => {
    expect(nudgeBpm(31, -10)).toBe(30)
    expect(nudgeBpm(30, -1)).toBe(30)
  })
  it('clamps at upper bound', () => {
    expect(nudgeBpm(239, 10)).toBe(240)
    expect(nudgeBpm(240, 1)).toBe(240)
  })
})

describe('classicStep', () => {
  it('jumps to the next-lower classic from an arbitrary BPM', () => {
    expect(classicStep(125, 'prev')).toBe(120)
    expect(classicStep(80, 'prev')).toBe(76)
    expect(classicStep(50, 'prev')).toBe(40)
  })
  it('jumps to the next-higher classic from an arbitrary BPM', () => {
    expect(classicStep(125, 'next')).toBe(144)
    expect(classicStep(80, 'next')).toBe(108)
    expect(classicStep(180, 'next')).toBe(200)
  })
  it('jumps STRICTLY past a BPM that already equals a classic', () => {
    expect(classicStep(120, 'next')).toBe(144)
    expect(classicStep(120, 'prev')).toBe(108)
  })
  it('clamps at the lower end', () => {
    expect(classicStep(40, 'prev')).toBe(40) // already at lowest classic
    expect(classicStep(35, 'prev')).toBe(40) // below lowest → lowest
  })
  it('clamps at the upper end', () => {
    expect(classicStep(200, 'next')).toBe(200) // already at highest classic
    expect(classicStep(220, 'next')).toBe(200) // above highest → highest
  })
  it('walks each classic tempo in order via repeated next()', () => {
    const walk: number[] = []
    let cur = 30
    // walk forward through all classics
    for (let i = 0; i < CLASSIC_TEMPOS.length + 1; i++) {
      const stepped = classicStep(cur, 'next')
      if (stepped === cur) break // hit the upper clamp
      walk.push(stepped)
      cur = stepped
    }
    expect(walk).toEqual([...CLASSIC_TEMPOS])
  })
})

describe('BPM_MIN / BPM_MAX constants', () => {
  it('match the design handoff range (30..240)', () => {
    expect(BPM_MIN).toBe(30)
    expect(BPM_MAX).toBe(240)
  })
})
