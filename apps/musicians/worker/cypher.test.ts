import { describe, expect, it } from 'vitest'
import {
  assertReadOnly,
  byIdsCypher,
  curatedCypher,
  detailCypher,
  healthCypher,
  peersByEraCypher,
  reshapeByIds,
  reshapeCount,
  reshapeDetail,
  reshapeMusicianRows,
  reshapePeerEra,
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
    expect(() => peersByEraCypher()).not.toThrow()
  })

  it('detail/curated use $params, never interpolation', () => {
    expect(detailCypher()).toContain('$id')
    expect(curatedCypher()).toContain('$ids')
    expect(detailCypher()).not.toMatch(/\{id:\s*['"]/)
  })

  it('peersByEra is parameterized, read-only, and excludes collaborators', () => {
    const q = peersByEraCypher()
    // Parameterized on $id + $limit (never string-interpolated).
    expect(q).toContain('$id')
    expect(q).toContain('$limit')
    expect(q).not.toMatch(/\{id:\s*['"]/)
    // Excludes the focus musician.
    expect(q).toMatch(/p\.id\s*<>\s*m\.id/)
    // Excludes direct collaborators via the through-record PLAYED_ON join.
    expect(q).toMatch(
      /NOT EXISTS\s*\{[\s\S]*PLAYED_ON[\s\S]*PLAYED_ON[\s\S]*\}/,
    )
    // Genre overlap + ±10y window are present.
    expect(q).toMatch(/any\(g IN coalesce\(p\.genres, \[\]\) WHERE g IN genres\)/)
    expect(q).toContain('years_active_start')
    expect(q).toContain('years_active_end')
    // Read-only (no write clauses) — assertReadOnly already wraps it but
    // double-check explicitly so a regression is obvious here.
    expect(q).not.toMatch(/\b(CREATE|MERGE|SET|DELETE|REMOVE)\b/)
  })

  it('peersByEra NULL-gates the focus musician on both years_active fields', () => {
    // C-bff item 1: when the focus's years_active_start or years_active_end
    // is NULL, the query must return zero peers (rather than opening the
    // year-window to all eras via the coalesce defaults). The gate is an
    // early WHERE on `m`, before the genre/year filtering on peers. This
    // assertion is regex-loose enough that whitespace/comment changes don't
    // brittle it; tight enough that "gated on both fields" is the contract.
    const q = peersByEraCypher()
    expect(q).toMatch(
      /MATCH \(m:Musician \{id: \$id\}\)[\s\S]*?WHERE[\s\S]*?m\.years_active_start IS NOT NULL[\s\S]*?m\.years_active_end\s+IS NOT NULL[\s\S]*?WITH m/,
    )
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

describe('reshapePeerEra → EraStrip-shaped items', () => {
  it('maps fields, derives photo from picture_url, drops malformed rows', () => {
    const result: AuraResult = {
      fields: ['id', 'name', 'primary_instruments', 'picture_url', 'overlap'],
      values: [
        [
          'wikidata:Q1',
          'Sonny Rollins',
          ['tenor saxophone'],
          'https://commons.example/sonny.jpg',
          2,
        ],
        // No picture_url → photo:false; no primary_instruments → no instrument.
        ['wikidata:Q2', 'Lee Morgan', [], '', 1],
        // Malformed row: missing id → dropped.
        [null, 'Ghost', ['piano'], 'https://x', 1],
        // Malformed row: missing name → dropped.
        ['wikidata:Q3', null, ['piano'], 'https://x', 1],
      ],
    }
    const peers = reshapePeerEra(result)
    expect(peers).toHaveLength(2)
    expect(peers[0]).toEqual({
      id: 'wikidata:Q1',
      name: 'Sonny Rollins',
      instrument: 'tenor saxophone',
      photo: true,
    })
    expect(peers[1]).toEqual({
      id: 'wikidata:Q2',
      name: 'Lee Morgan',
      photo: false,
    })
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
      'wikidata:Q93341',
      'wikidata:Q7346',
    ])
  })
})

describe('detailCypher — collaborator ordering (ranking bug guard)', () => {
  // The "Where to go from here" list on /musicians/:id renders
  // `MusicianDetail.collaborators` directly (DetailView passes it to
  // MosaicV4 + CollaboratorRail). The frozen `lib/map.ts` preserves
  // array order, so the cypher is the source of truth for ranking.
  // Bug observed on prod 2026-05-21 for Curtis Fuller (Q1145565):
  // Lee Morgan (20 shared records) ended up at #3, behind Art Blakey
  // (19) and Wayne Shorter (13). Root cause: the WITH clause that
  // builds the collaborators list had no `ORDER BY`, so Aura returned
  // them in its natural row order. Fix: count distinct shared records
  // and `ORDER BY ... DESC` BEFORE the final `collect(...)`. These
  // assertions guard the cypher string shape against regression.
  const q = detailCypher()

  it('counts distinct shared records (matches lib/map.ts dedup logic)', () => {
    expect(q).toMatch(/count\(DISTINCT sr\)\s+AS\s+sharedCount/)
  })

  it('orders by sharedCount DESC then name ASC before the final collect', () => {
    expect(q).toMatch(
      /ORDER BY\s+c IS NULL,\s*sharedCount\s+DESC,\s*c\.name\s+ASC/,
    )
  })

  it('the ORDER BY sits BEFORE the collect that builds collabs', () => {
    // If the ORDER BY landed AFTER the collect, the ranking would be
    // applied to the already-collected list (which Cypher would reject
    // anyway, but the intent regression is what we guard).
    const order = q.indexOf('ORDER BY')
    const collect = q.indexOf('collect(CASE WHEN c IS NULL')
    expect(order).toBeGreaterThan(-1)
    expect(collect).toBeGreaterThan(-1)
    expect(order).toBeLessThan(collect)
  })
})

describe('byIdsCypher — read-only, parameterized, $ids', () => {
  it('passes the read-only guard and is parameterized on $ids', () => {
    expect(() => byIdsCypher()).not.toThrow()
    const q = byIdsCypher()
    expect(q).toContain('$ids')
    expect(q).not.toMatch(/\b(CREATE|MERGE|SET|DELETE|REMOVE)\b/)
  })

  it('returns the expected projection columns', () => {
    const q = byIdsCypher()
    expect(q).toContain('picture_url')
    expect(q).toContain('picture_license')
    expect(q).toContain('picture_attribution')
    expect(q).toContain('primary_instruments')
  })
})

describe('reshapeByIds → ByIdsItem[]', () => {
  it('happy path: maps all fields, derives photo from picture_url', () => {
    const result: AuraResult = {
      fields: [
        'id',
        'name',
        'picture_url',
        'picture_license',
        'picture_attribution',
        'primary_instruments',
      ],
      values: [
        [
          'wikidata:Q93341',
          'Miles Davis',
          'https://commons.example/miles.jpg',
          'CC BY-SA 3.0',
          'Tom Palumbo',
          ['trumpet'],
        ],
        // No picture_url → photo:false; no instruments → no primaryInstrument.
        ['wikidata:Q2856321', 'Antoine Hervé', '', '', '', []],
      ],
    }

    const items = reshapeByIds(result)
    expect(items).toHaveLength(2)
    expect(items[0]).toEqual({
      id: 'wikidata:Q93341',
      name: 'Miles Davis',
      photo: true,
      portrait: {
        url: 'https://commons.example/miles.jpg',
        license: 'CC BY-SA 3.0',
        attribution: 'Tom Palumbo',
      },
      primaryInstrument: 'trumpet',
    })
    expect(items[1]).toEqual({
      id: 'wikidata:Q2856321',
      name: 'Antoine Hervé',
      photo: false,
      portrait: {},
    })
  })

  it('drops rows with missing id or name', () => {
    const result: AuraResult = {
      fields: [
        'id',
        'name',
        'picture_url',
        'picture_license',
        'picture_attribution',
        'primary_instruments',
      ],
      values: [
        // Missing id → dropped.
        [null, 'Ghost', '', '', '', []],
        // Missing name → dropped.
        ['wikidata:Q1', null, '', '', '', []],
        // Valid row → kept.
        ['wikidata:Q2', 'Valid', '', '', '', []],
      ],
    }
    const items = reshapeByIds(result)
    expect(items).toHaveLength(1)
    expect(items[0]!.id).toBe('wikidata:Q2')
  })

  it('returns empty array for an empty result', () => {
    const result: AuraResult = {
      fields: [
        'id',
        'name',
        'picture_url',
        'picture_license',
        'picture_attribution',
        'primary_instruments',
      ],
      values: [],
    }
    expect(reshapeByIds(result)).toEqual([])
  })
})
