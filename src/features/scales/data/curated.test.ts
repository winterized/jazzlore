import { describe, expect, it } from 'vitest'
import { CURATED_SCALES, FAMILIES } from './curated'

describe('CURATED_SCALES', () => {
  it('has 38 entries', () => {
    expect(CURATED_SCALES).toHaveLength(38)
  })

  it('every entry has a unique id', () => {
    const ids = CURATED_SCALES.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every entry references a known family', () => {
    const familyIds = new Set(FAMILIES.map((f) => f.id))
    for (const scale of CURATED_SCALES) {
      expect(familyIds.has(scale.family)).toBe(true)
    }
  })

  it('semitones start at 0 and are strictly ascending', () => {
    for (const scale of CURATED_SCALES) {
      expect(scale.semitones[0]).toBe(0)
      for (let i = 1; i < scale.semitones.length; i++) {
        expect(scale.semitones[i]).toBeGreaterThan(scale.semitones[i - 1]!)
      }
    }
  })

  it('intervalDisplay length matches semitones length', () => {
    for (const scale of CURATED_SCALES) {
      expect(scale.intervalDisplay).toHaveLength(scale.semitones.length)
    }
  })

  it('has Ionian with the Major alias', () => {
    const ionian = CURATED_SCALES.find((s) => s.id === 'ionian')
    expect(ionian).toBeDefined()
    expect(ionian?.alias).toBe('Major')
  })

  it('has Aeolian with the Natural minor alias', () => {
    const aeolian = CURATED_SCALES.find((s) => s.id === 'aeolian')
    expect(aeolian?.alias).toBe('Natural minor')
  })

  it('FAMILIES has Modes of major expanded by default; all others collapsed', () => {
    const expanded = FAMILIES.filter((f) => f.defaultExpanded)
    expect(expanded).toHaveLength(1)
    expect(expanded[0]?.id).toBe('modes-of-major')
  })
})
