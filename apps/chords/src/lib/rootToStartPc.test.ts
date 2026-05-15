import { describe, expect, it } from 'vitest'
import { rootToStartPc } from './rootToStartPc'

describe('rootToStartPc', () => {
  // White keys should pass straight through
  it('returns 0 for C (pc 0)', () => expect(rootToStartPc(0)).toBe(0))
  it('returns 2 for D (pc 2)', () => expect(rootToStartPc(2)).toBe(2))
  it('returns 4 for E (pc 4)', () => expect(rootToStartPc(4)).toBe(4))
  it('returns 5 for F (pc 5)', () => expect(rootToStartPc(5)).toBe(5))
  it('returns 7 for G (pc 7)', () => expect(rootToStartPc(7)).toBe(7))
  it('returns 9 for A (pc 9)', () => expect(rootToStartPc(9)).toBe(9))
  it('returns 11 for B (pc 11)', () => expect(rootToStartPc(11)).toBe(11))

  // Black keys — prefer white key BELOW
  it('returns 0 for C♯/D♭ (pc 1) — white key below is C', () => expect(rootToStartPc(1)).toBe(0))
  it('returns 2 for D♯/E♭ (pc 3) — white key below is D', () => expect(rootToStartPc(3)).toBe(2))
  it('returns 5 for F♯/G♭ (pc 6) — white key below is F', () => expect(rootToStartPc(6)).toBe(5))
  it('returns 7 for G♯/A♭ (pc 8) — white key below is G', () => expect(rootToStartPc(8)).toBe(7))
  it('returns 9 for A♯/B♭ (pc 10) — white key below is A', () => expect(rootToStartPc(10)).toBe(9))
})
