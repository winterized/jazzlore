import { describe, expect, it, vi } from 'vitest'
import { detectDuplicates, warnOnDuplicates } from './duplicates'
import { reshapeMusicianRows } from './cypher'
import { SEARCH_INDEX } from './test-fixtures'

describe('detectDuplicates — observability, NOT dedup', () => {
  const rows = reshapeMusicianRows(SEARCH_INDEX.data)

  it('flags the same external id across distinct node ids', () => {
    const groups = detectDuplicates(rows)
    expect(groups).toHaveLength(1)
    expect(groups[0]).toEqual({
      idType: 'wikidata',
      externalId: 'Q2856321',
      nodeIds: ['musicbrainz:antoine-herve-dupe', 'wikidata:Q2856321'],
    })
  })

  it('does NOT flag a unique external id', () => {
    const groups = detectDuplicates([
      { id: 'a', name: 'A', wikidata_id: 'Q1' },
      { id: 'b', name: 'B', wikidata_id: 'Q2' },
    ])
    expect(groups).toEqual([])
  })

  it('ignores empty/absent external ids', () => {
    const groups = detectDuplicates([
      { id: 'a', name: 'A', wikidata_id: '' },
      { id: 'b', name: 'B' },
    ])
    expect(groups).toEqual([])
  })

  it('returns the rows untouched — caller must not filter', () => {
    // detectDuplicates is pure: it reports, it never returns a filtered list.
    expect(rows).toHaveLength(4)
  })
})

describe('warnOnDuplicates — structured log line, faithful data', () => {
  it('emits one structured warn per group and returns the groups', () => {
    const warn = vi.fn()
    const groups = warnOnDuplicates(
      reshapeMusicianRows(SEARCH_INDEX.data),
      'search-index',
      { warn },
    )
    expect(groups).toHaveLength(1)
    expect(warn).toHaveBeenCalledTimes(1)
    const payload = JSON.parse(warn.mock.calls[0]![0] as string)
    expect(payload).toMatchObject({
      level: 'warn',
      event: 'duplicate-musician-suspected',
      source: 'search-index',
      idType: 'wikidata',
      externalId: 'Q2856321',
    })
    expect(payload.note).toMatch(/NOT deduped/)
  })

  it('is silent when there are no duplicates', () => {
    const warn = vi.fn()
    warnOnDuplicates([{ id: 'a', name: 'A', wikidata_id: 'Q1' }], 's', { warn })
    expect(warn).not.toHaveBeenCalled()
  })
})
