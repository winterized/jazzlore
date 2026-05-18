import { describe, expect, it } from 'vitest'
import {
  assertReadOnly,
  curatedCypher,
  detailCypher,
  healthCypher,
  reshapeCount,
  reshapeDetail,
  reshapeMusicianRows,
  searchIndexCypher,
} from './cypher'
import {
  CURATED_PARTIAL,
  DETAIL_MILES,
  DETAIL_NOT_FOUND,
  HEALTH_OK,
  SEARCH_INDEX,
} from './test-fixtures'
import type { AuraResult } from './aura'

const toResult = (f: {
  data: { fields: string[]; values: unknown[][] }
}): AuraResult => f.data

describe('Cypher builders are parameterized + read-only', () => {
  it('every builder passes the read-only guard', () => {
    expect(() => healthCypher()).not.toThrow()
    expect(() => curatedCypher()).not.toThrow()
    expect(() => searchIndexCypher()).not.toThrow()
    expect(() => detailCypher()).not.toThrow()
  })

  it('detail/curated use $params, never interpolation', () => {
    expect(detailCypher()).toContain('$id')
    expect(curatedCypher()).toContain('$ids')
    expect(detailCypher()).not.toMatch(/\{id:\s*['"]/)
  })

  it('assertReadOnly rejects write clauses', () => {
    expect(() => assertReadOnly('MATCH (m) SET m.x = 1')).toThrow()
    expect(() => assertReadOnly('MERGE (m:Musician)')).toThrow()
    expect(() => assertReadOnly('MATCH (m) DETACH DELETE m')).toThrow()
    expect(() => assertReadOnly('CREATE (m:Musician)')).toThrow()
    expect(() => assertReadOnly('MATCH (m) RETURN m')).not.toThrow()
    // false-positive guard: a property literally named "asset" is fine.
    expect(() =>
      assertReadOnly('MATCH (a:asset) RETURN a.name'),
    ).not.toThrow()
  })
})

describe('reshapeCount', () => {
  it('reads the integer from RETURN count(m) AS n', () => {
    expect(reshapeCount(toResult(HEALTH_OK))).toBe(1234)
  })
  it('defaults to 0 on an empty result', () => {
    expect(reshapeCount({ fields: ['n'], values: [] })).toBe(0)
  })
})

describe('reshapeDetail → frozen RawDetailResult', () => {
  it('reshapes focus + records + collaborators', () => {
    const raw = reshapeDetail(toResult(DETAIL_MILES))
    expect(raw).not.toBeNull()
    expect(raw!.musician.id).toBe('wikidata:Q93341')
    expect(raw!.musician.name).toBe('Miles Davis')
    expect(raw!.records).toHaveLength(2)
    expect(raw!.records[0]!.record.title).toBe('Kind of Blue')
    expect(raw!.records[0]!.edge.role).toBe('leader')
    expect(raw!.collaborators).toHaveLength(2)
    const trane = raw!.collaborators[0]!
    expect(trane.musician.name).toBe('John Coltrane')
    expect(trane.sharedRecords).toHaveLength(2)
  })

  it('returns null when the musician id is absent (→ 404)', () => {
    expect(reshapeDetail(toResult(DETAIL_NOT_FOUND))).toBeNull()
  })
})

describe('reshapeMusicianRows → faithful RawMusician[] (no dedup)', () => {
  it('keeps the duplicate Antoine double-node faithfully', () => {
    const rows = reshapeMusicianRows(toResult(SEARCH_INDEX))
    expect(rows).toHaveLength(4)
    const antoines = rows.filter((m) => m.name === 'Antoine Hervé')
    expect(antoines).toHaveLength(2)
    expect(antoines.map((a) => a.id).sort()).toEqual([
      'musicbrainz:antoine-herve-dupe',
      'wikidata:Q2856321',
    ])
  })

  it('curated hydration returns only the resolvable picks, in row order', () => {
    const rows = reshapeMusicianRows(toResult(CURATED_PARTIAL))
    expect(rows.map((m) => m.id)).toEqual([
      'wikidata:Q49575',
      'wikidata:Q200791',
    ])
  })
})
