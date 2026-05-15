import { describe, expect, it } from 'vitest'
import {
  centerScrollLeft,
  isChipVisible,
  resolveActiveChip,
  type ResolvedTarget,
} from './stickyHeader.helpers'

// ─── resolveActiveChip ─────────────────────────────────────────────────────────

describe('resolveActiveChip', () => {
  const targets: ResolvedTarget[] = [
    { id: 'triads', top: -200 },
    { id: 'sixths', top: -100 },
    { id: 'sevenths', top: 50 },
  ]

  it('returns null when targets array is empty', () => {
    expect(resolveActiveChip([], 80)).toBeNull()
  })

  it('returns first chip id when no target has crossed the threshold yet', () => {
    // All tops are above 0 — nothing has scrolled to the threshold.
    const fresh: ResolvedTarget[] = [
      { id: 'triads', top: 300 },
      { id: 'sixths', top: 500 },
    ]
    expect(resolveActiveChip(fresh, 80)).toBe('triads')
  })

  it('returns the id of the LAST target whose top <= threshold', () => {
    // threshold=80: triads (-200) ✓, sixths (-100) ✓, sevenths (50) ✓
    expect(resolveActiveChip(targets, 80)).toBe('sevenths')
  })

  it('stops at the last target that crossed — does not go past a non-crossing one', () => {
    // threshold=0: triads (-200) ✓, sixths (-100) ✓, sevenths (50) ✗ → sixths
    expect(resolveActiveChip(targets, 0)).toBe('sixths')
  })

  it('first chip is active when only it has crossed the threshold', () => {
    const t: ResolvedTarget[] = [
      { id: 'triads', top: -10 },
      { id: 'sixths', top: 200 },
    ]
    expect(resolveActiveChip(t, 80)).toBe('triads')
  })

  it('handles exactly-at-threshold (top === threshold → active)', () => {
    const t: ResolvedTarget[] = [
      { id: 'triads', top: 80 },
      { id: 'sixths', top: 200 },
    ]
    expect(resolveActiveChip(t, 80)).toBe('triads')
  })

  it('handles a single target that has not crossed threshold', () => {
    expect(resolveActiveChip([{ id: 'only', top: 500 }], 80)).toBe('only')
  })

  it('handles a single target that has crossed threshold', () => {
    expect(resolveActiveChip([{ id: 'only', top: -50 }], 80)).toBe('only')
  })

  it('all targets crossed — last one wins', () => {
    const t: ResolvedTarget[] = [
      { id: 'a', top: -300 },
      { id: 'b', top: -200 },
      { id: 'c', top: -10 },
    ]
    expect(resolveActiveChip(t, 80)).toBe('c')
  })

  it('works with threshold = 0', () => {
    const t: ResolvedTarget[] = [
      { id: 'a', top: -1 },
      { id: 'b', top: 0 },
      { id: 'c', top: 1 },
    ]
    // a (-1 ≤ 0) ✓, b (0 ≤ 0) ✓, c (1 ≤ 0) ✗ → b
    expect(resolveActiveChip(t, 0)).toBe('b')
  })
})

// ─── centerScrollLeft ──────────────────────────────────────────────────────────

describe('centerScrollLeft', () => {
  it('returns the ideal scroll position to center the chip', () => {
    // rowWidth=300, totalScrollWidth=600, chipLeft=400, chipWidth=60
    // ideal = 400 - 150 + 30 = 280; max = 300; result = 280
    expect(centerScrollLeft(300, 600, 400, 60)).toBe(280)
  })

  it('clamps at 0 when the ideal is negative', () => {
    // chipLeft=10, chipWidth=60, rowWidth=300 → ideal = 10-150+30 = -110 → 0
    expect(centerScrollLeft(300, 600, 10, 60)).toBe(0)
  })

  it('clamps at maxScrollLeft when the chip is near the end', () => {
    // rowWidth=300, totalScrollWidth=600 → max=300
    // chipLeft=580, chipWidth=60 → ideal=580-150+30=460 > 300 → 300
    expect(centerScrollLeft(300, 600, 580, 60)).toBe(300)
  })

  it('returns 0 when row does not overflow (totalScrollWidth ≤ rowWidth)', () => {
    // maxScrollLeft=0 → clamped to 0
    expect(centerScrollLeft(400, 300, 100, 60)).toBe(0)
  })
})

// ─── isChipVisible ─────────────────────────────────────────────────────────────

describe('isChipVisible', () => {
  it('returns true when chip is fully inside the buffer zone', () => {
    // row: scroll=0, width=400 → viewLeft=40, viewRight=360
    // chip: left=100, width=80 → right=180 — inside [40, 360]
    expect(isChipVisible(0, 400, 100, 80)).toBe(true)
  })

  it('returns false when chip is off to the right', () => {
    // viewRight=360; chipRight=180+240=420 > 360 → false
    expect(isChipVisible(0, 400, 350, 80)).toBe(false)
  })

  it('returns false when chip is off to the left', () => {
    // scrollLeft=200 → viewLeft=240; chipLeft=100 < 240 → false
    expect(isChipVisible(200, 400, 100, 80)).toBe(false)
  })

  it('returns true when chip is exactly on the buffer boundary (inclusive)', () => {
    // viewLeft=40; chipLeft=40 → 40 >= 40 → true (inclusive boundary)
    // chipRight=40+80=120; viewRight=400-40=360 → 120 <= 360 → true
    expect(isChipVisible(0, 400, 40, 80)).toBe(true)
  })

  it('returns false when chip left is just inside the buffer zone', () => {
    // viewLeft=40; chipLeft=39 → 39 < 40 → false
    expect(isChipVisible(0, 400, 39, 80)).toBe(false)
  })

  it('accepts a custom buffer value', () => {
    // buffer=0: viewLeft=0, viewRight=400; chip left=0, right=80 → true
    expect(isChipVisible(0, 400, 0, 80, 0)).toBe(true)
  })
})
