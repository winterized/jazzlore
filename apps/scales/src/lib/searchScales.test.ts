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
    expect(locrian).toMatchObject({
      label: 'Locrian',
      sublabel: 'Modes of major',
      chipId: 'group-modes-of-major',
    })
  })

  it('matches the alias too (Super Locrian → altered)', () => {
    expect(searchScales('super locrian').map((r) => r.id)).toContain('scale-altered')
  })

  it('is case-insensitive', () => {
    expect(searchScales('LOCR').map((r) => r.id)).toContain('scale-locrian')
  })

  it('caps the result count at 10', () => {
    // 'i' appears in very many scale names — ensure the cap holds.
    expect(searchScales('i').length).toBeLessThanOrEqual(10)
  })
})
