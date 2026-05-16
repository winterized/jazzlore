import { describe, expect, it } from 'vitest'
import { searchChords } from './searchChords'

describe('searchChords', () => {
  it('returns [] for an empty / whitespace query', () => {
    expect(searchChords('', 'C')).toEqual([])
    expect(searchChords('   ', 'C')).toEqual([])
  })

  it("root C + 'dim' → the diminished family with root-prefixed labels", () => {
    const res = searchChords('dim', 'C')
    const byId = new Map(res.map((r) => [r.id, r]))
    expect(byId.get('chord-dim')).toMatchObject({ label: 'C diminished', sublabel: 'Cdim' })
    expect(byId.get('chord-m7b5')).toMatchObject({ label: 'C half-diminished 7th' })
    expect(byId.get('chord-dim7')).toMatchObject({ label: 'C diminished 7th' })
  })

  it('matches the symbol too (accidental-folded): m7b5 → chord-m7b5', () => {
    expect(searchChords('m7b5', 'C').map((r) => r.id)).toContain('chord-m7b5')
  })

  it('uses the given root in the label', () => {
    expect(searchChords('major 7', 'F♯')[0]?.label).toBe('F♯ major 7th')
  })

  it('is case-insensitive and capped at 10', () => {
    expect(searchChords('DIM', 'C').map((r) => r.id)).toContain('chord-dim')
    expect(searchChords('7', 'C').length).toBeLessThanOrEqual(10)
  })
})
