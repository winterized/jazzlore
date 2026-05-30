import { describe, expect, it } from 'vitest'
import { CURATED_SCALES, FAMILIES, GROUPS, type ScaleGroup } from './curated'

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

  it('every entry references a known group', () => {
    const groupIds = new Set(GROUPS.map((g) => g.id))
    for (const scale of CURATED_SCALES) {
      expect(groupIds.has(scale.group)).toBe(true)
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

  it('every entry has a non-empty description and theoryTag', () => {
    for (const scale of CURATED_SCALES) {
      expect(scale.description.trim().length).toBeGreaterThan(0)
      expect(scale.theoryTag.trim().length).toBeGreaterThan(0)
    }
  })

  it('group counts match the spec (4/6/3/6/3/3/1/12)', () => {
    const expected: Record<ScaleGroup, number> = {
      maj7: 4,
      '7': 6,
      '7alt': 3,
      m7: 6,
      m6: 3,
      m7b5: 3,
      dim7: 1,
      color: 12,
    }
    for (const group of GROUPS) {
      const count = CURATED_SCALES.filter((s) => s.group === group.id).length
      expect(count, group.id).toBe(expected[group.id])
    }
  })

  it('groupOrder is 1..N contiguous and unique within each group', () => {
    for (const group of GROUPS) {
      const orders = CURATED_SCALES.filter((s) => s.group === group.id)
        .map((s) => s.groupOrder)
        .sort((a, b) => a - b)
      const expected = Array.from({ length: orders.length }, (_, i) => i + 1)
      expect(orders, group.id).toEqual(expected)
    }
  })

  it('renames Ionian → Major (alias Ionian)', () => {
    const major = CURATED_SCALES.find((s) => s.id === 'ionian')
    expect(major?.name).toBe('Major')
    expect(major?.alias).toBe('Ionian')
    expect(major?.group).toBe('maj7')
  })

  it('renames Aeolian → Natural minor (alias Aeolian)', () => {
    const natMinor = CURATED_SCALES.find((s) => s.id === 'aeolian')
    expect(natMinor?.name).toBe('Natural minor')
    expect(natMinor?.alias).toBe('Aeolian')
    expect(natMinor?.group).toBe('m7')
  })

  it('renames Bebop major → Major bebop', () => {
    const majorBebop = CURATED_SCALES.find((s) => s.id === 'bebop-major')
    expect(majorBebop?.name).toBe('Major bebop')
    expect(majorBebop?.group).toBe('maj7')
  })
})

describe('GROUPS', () => {
  it('has exactly maj7 expanded by default; all others collapsed', () => {
    const expanded = GROUPS.filter((g) => g.defaultExpanded)
    expect(expanded).toHaveLength(1)
    expect(expanded[0]?.id).toBe('maj7')
  })

  it('lists the 8 use-case groups in display order', () => {
    expect(GROUPS.map((g) => g.id)).toEqual([
      'maj7',
      '7',
      '7alt',
      'm7',
      'm6',
      'm7b5',
      'dim7',
      'color',
    ])
  })
})
