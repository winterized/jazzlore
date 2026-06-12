import { describe, expect, it, vi } from 'vitest'
import {
  assertReadOnly,
  byIdsCypher,
  curatedCypher,
  detailCypher,
  healthCypher,
  peersByEraCypher,
  polishedIdsCypher,
  reshapeByIds,
  reshapeCount,
  reshapeDetail,
  reshapeMusicianRows,
  reshapePeerEra,
  reshapePolishedIds,
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

  it('detailCypher resolves stale aliases via also_known_as_ids (issue #84)', () => {
    const q = detailCypher()
    // The alias clause must sit ALONGSIDE the canonical-id match (OR), not
    // replace it — canonical visits stay exact-match and short-circuit.
    expect(q).toMatch(/m\.id\s*=\s*\$id/)
    expect(q).toMatch(/\$id\s+IN\s+coalesce\(m\.also_known_as_ids,\s*\[\]\)/)
  })

  it('peersByEra is parameterized, read-only, and excludes collaborators', () => {
    const q = peersByEraCypher()
    // Parameterized on $id + $limit + $currentYear (never string-interpolated).
    // $currentYear was added in #47 as the "still active" upper-bound for
    // the year window when years_active_end is NULL or "present".
    expect(q).toContain('$id')
    expect(q).toContain('$limit')
    expect(q).toContain('$currentYear')
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

  it('peersByEra NULL-gates only on years_active_start (issue #47 fix)', () => {
    // Pre-#47: the focus musician was NULL-gated on BOTH years_active_start
    // AND years_active_end — which broke for living musicians (Herbie
    // Hancock, Sonny Rollins) whose end-year is NULL or the populator's
    // literal "present" string. Post-#47: only start is gated; end is
    // coalesced via toInteger() → $currentYear (still-active treatment).
    // Anchor-with-no-start-year (Antoine-style total NULL) stays excluded.
    const q = peersByEraCypher()
    expect(q).toMatch(
      /MATCH \(m:Musician \{id: \$id\}\)[\s\S]*?WHERE[\s\S]*?m\.years_active_start IS NOT NULL[\s\S]*?WITH m/,
    )
    // The pre-#47 dual NULL gate must NOT be present: regression-guard
    // against "WHERE m.years_active_start IS NOT NULL AND m.years_active_end
    // IS NOT NULL" sneaking back in.
    expect(q).not.toMatch(
      /m\.years_active_start IS NOT NULL\s+AND\s+m\.years_active_end\s+IS NOT NULL/,
    )
  })

  it('peersByEra coalesces NULL end-year to $currentYear on both anchor and peer (issue #47)', () => {
    // After populator issue #75 closed (2026-05-24), years_active_end is
    // guaranteed Integer-or-NULL — never the literal string "present". The
    // defensive toInteger() wrapper that protected against "present" is
    // unwound; anchor and peer both coalesce NULL to $currentYear directly.
    const q = peersByEraCypher()
    expect(q).toMatch(
      /coalesce\(m\.years_active_end,\s*\$currentYear\)\s+AS\s+yae/,
    )
    expect(q).toMatch(
      /coalesce\(p\.years_active_end,\s*\$currentYear\)\s+>=\s+yas\s*-\s*10/,
    )
    // The toInteger() wrappers must be gone — regression guard against the
    // defensive shim sneaking back in once the populator contract is clean.
    expect(q).not.toMatch(/toInteger\(m\.years_active_end\)/)
    expect(q).not.toMatch(/toInteger\(p\.years_active_end\)/)
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

  it('warns + first-row-wins on multi-row result (issue #89 observability)', () => {
    // Simulate a populator alias conflict: same stale id projected onto
    // TWO survivors' also_known_as_ids. reshapeDetail must NOT filter the
    // response (faithful) but MUST emit one structured `warn` so the
    // populator owner sees the conflict in CF logs. Logger injection
    // mirrors `warnOnDuplicates`'s testability pattern.
    const base = toResult(DETAIL_MILES)
    const dup = { ...base, values: [...base.values, ...base.values] }
    const logger = { warn: vi.fn() }
    const raw = reshapeDetail(dup, logger)
    expect(raw).not.toBeNull()
    expect(raw!.musician.id).toBe('wikidata:Q93341') // first row wins
    expect(logger.warn).toHaveBeenCalledTimes(1)
    const payload = JSON.parse(logger.warn.mock.calls[0]![0] as string) as {
      event: string
      rowCount: number
      matchedIds: string[]
    }
    expect(payload.event).toBe('detail-multi-row')
    expect(payload.rowCount).toBe(2)
    expect(payload.matchedIds).toContain('wikidata:Q93341')
  })
})

describe('reshapePeerEra → EraStrip-shaped items', () => {
  // PR4c — peersByEra RETURN now also carries picture_license + picture_attribution
  // so the era-tile portrait can be rendered with its legal caption.
  const FIELDS = [
    'id',
    'name',
    'primary_instruments',
    'picture_url',
    'picture_license',
    'picture_attribution',
    'overlap',
  ]

  it('maps fields, derives photo from picture_url, drops malformed rows', () => {
    const result: AuraResult = {
      fields: FIELDS,
      values: [
        [
          'wikidata:Q1',
          'Sonny Rollins',
          ['tenor saxophone'],
          'https://commons.example/sonny.jpg',
          'CC-BY-SA-4.0',
          'F. Wolff',
          2,
        ],
        // No picture_url → photo:false, no portrait carried.
        ['wikidata:Q2', 'Lee Morgan', [], '', '', '', 1],
        // Malformed row: missing id → dropped.
        [null, 'Ghost', ['piano'], 'https://x', '', '', 1],
        // Malformed row: missing name → dropped.
        ['wikidata:Q3', null, ['piano'], 'https://x', '', '', 1],
      ],
    }
    const peers = reshapePeerEra(result)
    expect(peers).toHaveLength(2)
    expect(peers[0]).toEqual({
      id: 'wikidata:Q1',
      name: 'Sonny Rollins',
      instrument: 'tenor saxophone',
      photo: true,
      portrait: {
        url: 'https://commons.example/sonny.jpg',
        license: 'CC-BY-SA-4.0',
        attribution: 'F. Wolff',
      },
    })
    expect(peers[1]).toEqual({
      id: 'wikidata:Q2',
      name: 'Lee Morgan',
      photo: false,
    })
  })

  it('omits empty license/attribution fields from the portrait (public-domain pattern)', () => {
    // A public-domain image has a URL but empty license + attribution strings —
    // the legal-caption builder will then render nothing. Mirrors the same
    // logic in reshapeByIds.
    const result: AuraResult = {
      fields: FIELDS,
      values: [
        ['wikidata:Q9', 'Public Domain Pete', [], 'https://example/pd.jpg', '', '', 1],
      ],
    }
    const peers = reshapePeerEra(result)
    expect(peers[0]?.portrait).toEqual({ url: 'https://example/pd.jpg' })
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

describe('detailCypher — record ordering (Records project, D2)', () => {
  // Records render in BFF order (the frozen mapper never re-sorts), so the
  // cypher is the source of truth. D2: studio-first, then collaborator-overlap
  // DESC, then release_year ASC (originals first), then title. The ORDER BY
  // must sit BEFORE the collect that builds `records`, else the order is lost.
  const q = detailCypher()

  it('counts distinct collaborators per record, excluding the focus', () => {
    expect(q).toMatch(
      /OPTIONAL MATCH \(r\)<-\[:PLAYED_ON\]-\(co:Musician\)\s+WHERE co\.id <> m\.id/,
    )
    expect(q).toMatch(/count\(DISTINCT co\)\s+AS\s+collabCount/)
  })

  it('orders studio-first, collab-overlap DESC, year ASC, title ASC', () => {
    expect(q).toMatch(
      /ORDER BY coalesce\(r\.is_various_artists, false\) ASC,\s*collabCount DESC,\s*coalesce\(r\.release_year, 99999\) ASC,\s*r\.title ASC/,
    )
  })

  it('the record ORDER BY sits BEFORE the collect that builds records', () => {
    const order = q.indexOf('collabCount DESC')
    const collect = q.indexOf('}) AS records')
    expect(order).toBeGreaterThan(-1)
    expect(collect).toBeGreaterThan(-1)
    expect(order).toBeLessThan(collect)
  })

  it('projects the three new streaming/attribution fields', () => {
    expect(q).toContain('.cover_art_attribution')
    expect(q).toContain('.apple_album_url')
    expect(q).toContain('.spotify_album_url')
  })
})

describe('detailCypher — property trimming (issue #155 Lever 1)', () => {
  // Lever 1 replaces the whole-node `{.*}` spreads on the per-record and
  // per-collaborator projections with EXPLICIT property maps of exactly what
  // the FROZEN mapper (src/lib/map.ts) reads. This shrinks the Aura→Worker
  // payload (Miles: 1,003 nested shared records + 418 collaborator bios) that
  // the Worker must JSON.parse + reshape + re-stringify inside the 10ms CPU
  // budget. Output is byte-identical (guarded in src/lib/map.test.ts). These
  // assertions lock the query SHAPE against a `{.*}` regression sneaking back.
  const q = detailCypher()

  it('drops the whole-node {.*} spreads for records + shared records + collaborators', () => {
    expect(q).not.toContain('r{.*}')
    expect(q).not.toContain('sr{.*}')
    expect(q).not.toContain('c{.*}')
  })

  it('keeps the focus musician as a full m{.*} spread (page/OG/era read ~20 fields)', () => {
    expect(q).toContain('m{.*} AS m')
  })

  it('top-level record projects the 17 fields mapRecordRef reads', () => {
    const fields = [
      '.id', '.title', '.type', '.release_year', '.recording_year',
      '.label', '.catalog_number', '.track_count',
      '.cover_art_url', '.cover_art_license', '.cover_art_attribution',
      '.apple_album_url', '.spotify_album_url',
      '.wikipedia_url', '.wikidata_id', '.musicbrainz_id', '.discogs_id',
    ]
    for (const f of fields) expect(q).toContain(f)
  })

  it('nested shared record projects only {id, title, release_year}', () => {
    expect(q).toMatch(/sr\{\s*\.id,\s*\.title,\s*\.release_year\s*\}/)
  })

  it('collaborator node projects only the 6 fields mapCollaborator + mapGraphData read', () => {
    expect(q).toMatch(
      /c\{\.id,\s*\.name,\s*\.primary_instruments,\s*\.picture_url,\s*\.spotify_artist_url,\s*\.apple_artist_url\}/,
    )
    // The big Miles win: a full bio_summary must NOT ship per collaborator.
    expect(q).not.toContain('bio_summary')
    // Portrait license/attribution are NOT needed here (they come from the
    // separate by-ids batch); only picture_url, for the `photo` boolean.
    expect(q).not.toContain('picture_license')
    expect(q).not.toContain('picture_attribution')
  })

  it('keeps full edge properties() (dedup-safe; narrowing could change the DISTINCT key)', () => {
    expect(q).toContain('edge: properties(fe)')
    expect(q).toContain('edge: properties(ce)')
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

// PR6 — polished pool cypher (`/api/musicians/polished-ids`).

describe('polishedIdsCypher — read-only, no params, bio + portrait WHERE', () => {
  it('passes the read-only guard and takes no parameters', () => {
    expect(() => polishedIdsCypher()).not.toThrow()
    const q = polishedIdsCypher()
    expect(q).not.toMatch(/\b(CREATE|MERGE|SET|DELETE|REMOVE)\b/)
    expect(q).not.toContain('$') // no params
  })

  it('filters on bio_summary + picture_url + years_active_* being NOT NULL', () => {
    const q = polishedIdsCypher()
    // All four required fields must be in the WHERE clause.
    expect(q).toContain('bio_summary')
    expect(q).toContain('picture_url')
    expect(q).toContain('years_active_start')
    expect(q).toContain('years_active_end')
    // Empty-string exclusion (a NULL gate alone wouldn't filter "" values).
    expect(q).toContain("''")
    // Stable order so the random pick is deterministic across cache hits.
    expect(q).toContain('ORDER BY m.name ASC')
  })

  it('returns only the canonical id column', () => {
    const q = polishedIdsCypher()
    expect(q).toMatch(/RETURN m\.id AS id/)
    // Should NOT leak other personal fields into the cached payload.
    expect(q).not.toContain('bio_summary AS')
    expect(q).not.toContain('picture_url AS')
  })
})

describe('reshapePolishedIds → string[]', () => {
  it('maps the id column out of each row', () => {
    const result: AuraResult = {
      fields: ['id'],
      values: [
        ['wikidata:Q93341'],
        ['wikidata:Q7346'],
        ['wikidata:Q132341'],
      ],
    }
    expect(reshapePolishedIds(result)).toEqual([
      'wikidata:Q93341',
      'wikidata:Q7346',
      'wikidata:Q132341',
    ])
  })

  it('drops rows with missing/non-string id (defensive)', () => {
    const result: AuraResult = {
      fields: ['id'],
      values: [['wikidata:Q1'], [null], [42], ['wikidata:Q2']],
    }
    expect(reshapePolishedIds(result)).toEqual([
      'wikidata:Q1',
      'wikidata:Q2',
    ])
  })

  it('returns [] for an empty result set', () => {
    expect(reshapePolishedIds({ fields: ['id'], values: [] })).toEqual([])
  })
})
