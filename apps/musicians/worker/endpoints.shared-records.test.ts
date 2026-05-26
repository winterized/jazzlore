// Endpoint test for `/api/musicians/:focusId/collaborators/:collabId/records`.
// Stubs `auraQuery` and asserts the response shape, leader-precedence for
// primaryArtist, the totalCount surfacing (R1), and the cold-Aura branch.

import { afterEach, describe, expect, it, vi } from 'vitest'
import { handleSharedRecords } from './endpoints'
import * as auraMod from './aura'
import type { Env } from './env'

const ENV: Env = {
  ASSETS: { fetch: async () => new Response('') } as unknown as Fetcher,
  NEO4J_URI: 'https://abc.databases.neo4j.io',
  NEO4J_USERNAME: 'neo4j',
  NEO4J_PASSWORD: 'pw',
}

function stubAura(fixture: {
  data: { fields: string[]; values: unknown[][] }
}) {
  return vi
    .spyOn(auraMod, 'auraQuery')
    .mockResolvedValue(fixture.data as auraMod.AuraResult)
}

const FIELDS = ['records', 'totalCount', 'focusName', 'collabName']

function rec(
  id: string,
  title: string,
  year: number | null,
  opts: { focusRole?: string; collabRole?: string } = {},
) {
  return {
    record: {
      id,
      title,
      release_year: year,
    },
    focusEdge: opts.focusRole ? { role: opts.focusRole } : {},
    collabEdge: opts.collabRole ? { role: opts.collabRole } : {},
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('handleSharedRecords', () => {
  it('happy path: returns the slice + totalCount + leader-derived primaryArtist', async () => {
    stubAura({
      data: {
        fields: FIELDS,
        values: [
          [
            [
              rec('rec:kob', 'Kind of Blue', 1959, { focusRole: 'leader' }),
              rec('rec:somethin', "Somethin' Else", 1958, {
                collabRole: 'leader',
              }),
              rec('rec:milestones', 'Milestones', 1958),
            ],
            3,
            'Miles Davis',
            'Cannonball Adderley',
          ],
        ],
      },
    })

    const res = await handleSharedRecords(
      ENV,
      'wikidata:Q93341',
      'wikidata:Q151952',
    )
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toContain('s-maxage')
    const body = (await res.json()) as {
      records: { id: string; title: string; primaryArtist: string }[]
      totalCount: number
    }
    expect(body.totalCount).toBe(3)
    expect(body.records).toHaveLength(3)

    const kob = body.records.find((r) => r.id === 'rec:kob')!
    expect(kob.title).toBe('Kind of Blue')
    // focusRole === leader → primary artist is the FOCUS (Miles).
    expect(kob.primaryArtist).toBe('Miles Davis')

    const somethin = body.records.find((r) => r.id === 'rec:somethin')!
    // collabRole === leader, focus has no role → primary artist is COLLAB.
    expect(somethin.primaryArtist).toBe('Cannonball Adderley')

    const milestones = body.records.find((r) => r.id === 'rec:milestones')!
    // No leader on either side → page-author bias: fall back to FOCUS.
    expect(milestones.primaryArtist).toBe('Miles Davis')
  })

  it('truncated response carries the TRUE totalCount (R1 — 100 of 147)', async () => {
    const slice = Array.from({ length: 100 }, (_, i) =>
      rec(`rec:${i}`, `Record ${i}`, 2020 - i),
    )
    stubAura({
      data: {
        fields: FIELDS,
        values: [[slice, 147, 'Paul Chambers', 'Wynton Kelly']],
      },
    })

    const res = await handleSharedRecords(ENV, 'wikidata:Q541659', 'wikidata:Q310291')
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      records: unknown[]
      totalCount: number
    }
    expect(body.records).toHaveLength(100)
    expect(body.totalCount).toBe(147)
  })

  it('returns 404 when no row matches (one or both ids unresolved)', async () => {
    stubAura({ data: { fields: FIELDS, values: [] } })
    const res = await handleSharedRecords(
      ENV,
      'wikidata:Qnope',
      'wikidata:Q7346',
    )
    expect(res.status).toBe(404)
    expect(await res.json()).toMatchObject({ error: 'not-found' })
  })

  it('cold-Aura 503 → frozen waking shape', async () => {
    vi.spyOn(auraMod, 'auraQuery').mockRejectedValue(
      new auraMod.AuraWakingError(),
    )
    const res = await handleSharedRecords(
      ENV,
      'wikidata:Q93341',
      'wikidata:Q7346',
    )
    expect(res.status).toBe(503)
    expect(await res.json()).toEqual({ status: 'waking', retryAfter: 10 })
  })
})
