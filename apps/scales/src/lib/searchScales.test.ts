import { describe, expect, it } from 'vitest'
import { searchScales } from './searchScales'

describe('searchScales', () => {
  it('returns [] for an empty / whitespace query', () => {
    expect(searchScales('')).toEqual([])
    expect(searchScales('   ')).toEqual([])
  })

  it("'locr' finds Locrian and Locrian ♮2 (name + accidental folded)", () => {
    const ids = searchScales('locr').map((r) => r.id)
    expect(ids).toContain('scale-locrian')
    expect(ids).toContain('scale-locrian-nat2')
    const locrian = searchScales('locr').find((r) => r.id === 'scale-locrian')
    // Sublabel + chip now reflect the use-case group, not the family.
    expect(locrian).toMatchObject({
      label: 'Locrian',
      sublabel: 'Half-diminished / m7♭5',
      chipId: 'group-m7b5',
    })
  })

  it('matches kept aliases (Super Locrian → Altered)', () => {
    expect(searchScales('super locrian').map((r) => r.id)).toContain('scale-altered')
  })

  it('finds the renamed scales by their inverted aliases', () => {
    // Ionian became "Major" (alias Ionian); Aeolian became "Natural minor"
    // (alias Aeolian) — the old names must still resolve via the alias.
    expect(searchScales('ionian').map((r) => r.id)).toContain('scale-ionian')
    expect(searchScales('aeolian').map((r) => r.id)).toContain('scale-aeolian')
  })

  it('matches by name (altered → Altered)', () => {
    expect(searchScales('altered').map((r) => r.id)).toContain('scale-altered')
  })

  it('matches by description (japanese → Hirajoshi and In Sen)', () => {
    const ids = searchScales('japanese').map((r) => r.id)
    expect(ids).toContain('scale-hirajoshi')
    expect(ids).toContain('scale-in-sen')
  })

  it('is case-insensitive', () => {
    expect(searchScales('LOCR').map((r) => r.id)).toContain('scale-locrian')
  })

  it('caps the result count at 10', () => {
    // 'i' appears in very many scale names — ensure the cap holds.
    expect(searchScales('i').length).toBeLessThanOrEqual(10)
  })
})
