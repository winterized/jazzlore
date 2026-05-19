import { describe, expect, it } from 'vitest'
import { duotoneFor, initialsOf } from './duotone'

describe('duotoneFor', () => {
  it('is deterministic — the same key always yields the same pair', () => {
    const a = duotoneFor('Miles Davis')
    const b = duotoneFor('Miles Davis')
    expect(a).toEqual(b)
  })

  it('returns a [lo, hi] hex pair from the palette', () => {
    const [lo, hi] = duotoneFor('John Coltrane')
    expect(lo).toMatch(/^#[0-9a-f]{6}$/i)
    expect(hi).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('distributes different keys across the palette (not all identical)', () => {
    const pairs = new Set(
      ['Miles Davis', 'John Coltrane', 'Bobby Timmons', 'Art Blakey', 'Ron Carter'].map(
        (n) => duotoneFor(n).join(),
      ),
    )
    expect(pairs.size).toBeGreaterThan(1)
  })

  it('never throws on empty / nullish input', () => {
    expect(() => duotoneFor('')).not.toThrow()
    expect(duotoneFor('')).toHaveLength(2)
  })
})

describe('initialsOf', () => {
  it('takes first + last word initials, uppercased', () => {
    expect(initialsOf('Bobby Timmons')).toBe('BT')
    expect(initialsOf('miles davis')).toBe('MD')
  })

  it('handles a single name', () => {
    expect(initialsOf('Madonna')).toBe('MM')
  })

  it('handles three+ words (first + last only)', () => {
    expect(initialsOf('John William Coltrane')).toBe('JC')
  })

  it('handles empty / whitespace input without throwing', () => {
    expect(initialsOf('')).toBe('')
    expect(initialsOf('   ')).toBe('')
  })

  it('handles a leading-space name', () => {
    expect(initialsOf("'Round About Midnight")).toBe("'M")
  })
})
