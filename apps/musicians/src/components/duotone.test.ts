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

  it('skips leading-punctuation tokens (apostrophes etc.) and uses real letters', () => {
    // "'Round About Midnight" — the song title starts with an apostrophe.
    // The apostrophe-led token is filtered out; "About" + "Midnight" remain.
    expect(initialsOf("'Round About Midnight")).toBe('AM')
  })

  // Wave 1 / PR2 — Audit HIGH-2 / Quality #1: the initials helper used to
  // walk space-delimited tokens taking the first char of each with no letter
  // filter, producing pathological strings like "M1" for "Miles Davis + 19"
  // and "B(" for "Bobby Thompson (19". Fix: filter to tokens whose first
  // code point is a Unicode letter before extracting initials.

  it('filters non-letter tokens (the "+19" / "(19" pathological inputs)', () => {
    expect(initialsOf('Miles Davis + 19')).toBe('MD')
    expect(initialsOf('Bobby Thompson (19')).toBe('BT')
  })

  it('keeps Unicode letters (accents, diacritics, non-Latin scripts)', () => {
    expect(initialsOf('Nguyên Lê')).toBe('NL')
    expect(initialsOf('Antônio Jobim')).toBe('AJ')
    expect(initialsOf('Antoine Hervé')).toBe('AH')
  })

  it('returns empty when every token is non-letter', () => {
    expect(initialsOf('+ 19 ( )')).toBe('')
    expect(initialsOf('123 456')).toBe('')
  })

  it('keeps embedded punctuation inside a single token (single-word doubling path)', () => {
    // "O'Brien" is one token whose FIRST code point ("O") is a letter, so
    // the filter passes it; it then falls through to single-word doubling.
    expect(initialsOf("O'Brien")).toBe('OO')
  })

  it('handles CJK and other non-Latin scripts', () => {
    // Non-Latin letters (Lo class) pass the \p{L} filter; the code-point
    // extractor returns a single scalar for each.
    expect(initialsOf('宮本 武蔵')).toBe('宮武')
  })

  it('handles astral-plane letters without producing lone UTF-16 surrogates', () => {
    // Mathematical alphanumerics are \p{L} but live outside the BMP, so the
    // first code unit is a high surrogate. The code-point extractor returns
    // the full scalar pair rather than the lone surrogate.
    // (Audit-noted regression-guard for stylized stage names.)
    const result = initialsOf('𝒜lice 𝐁ob')
    // Must NOT be the lone-surrogate "\uD835\uD835"; toUpperCase on these
    // astral letters is identity, so the result is the two astral letters.
    expect(result).toBe('𝒜𝐁')
  })
})
