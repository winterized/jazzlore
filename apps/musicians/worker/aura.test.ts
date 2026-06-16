import { describe, expect, it, vi } from 'vitest'
import {
  auraQuery,
  AuraQueryError,
  AuraWakingError,
  col,
  httpQueryBase,
  type AuraCreds,
} from './aura'
import {
  CYPHER_ERROR,
  HEALTH_OK,
  mockFetchHang,
  mockFetchJson,
} from './test-fixtures'

const CREDS: AuraCreds = {
  uri: 'https://abc.databases.neo4j.io',
  username: 'neo4j',
  password: 'pw',
}

describe('auraQuery — request shaping', () => {
  it('POSTs the v2 query endpoint with Basic auth + {statement,parameters}', async () => {
    const spy = vi.fn(
      async () =>
        new Response(JSON.stringify(HEALTH_OK), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
    )
    await auraQuery(
      CREDS,
      'MATCH (m:Musician {id:$id}) RETURN m',
      { id: 'wikidata:Q1' },
      spy as unknown as typeof fetch,
    )
    expect(spy).toHaveBeenCalledTimes(1)
    const [url, init] = spy.mock.calls[0]! as unknown as [
      string,
      RequestInit,
    ]
    expect(url).toBe('https://abc.databases.neo4j.io/db/neo4j/query/v2')
    expect(init.method).toBe('POST')
    const headers = init.headers as Record<string, string>
    expect(headers.Authorization).toBe('Basic ' + btoa('neo4j:pw'))
    expect(headers['Content-Type']).toBe('application/json')
    expect(JSON.parse(init.body as string)).toEqual({
      statement: 'MATCH (m:Musician {id:$id}) RETURN m',
      parameters: { id: 'wikidata:Q1' },
    })
  })

  it('normalises a Bolt connection URI to the HTTPS query endpoint', async () => {
    const spy = vi.fn(
      async () => new Response(JSON.stringify(HEALTH_OK), { status: 200 }),
    )
    await auraQuery(
      { ...CREDS, uri: 'neo4j+s://abc.databases.neo4j.io/' },
      'RETURN 1',
      {},
      spy as unknown as typeof fetch,
    )
    expect((spy.mock.calls[0]! as unknown as [string])[0]).toBe(
      'https://abc.databases.neo4j.io/db/neo4j/query/v2',
    )
  })

  it('targets a configurable database when creds.database is set', async () => {
    const spy = vi.fn(
      async () => new Response(JSON.stringify(HEALTH_OK), { status: 200 }),
    )
    await auraQuery(
      { ...CREDS, database: 'd30e12cc' },
      'RETURN 1',
      {},
      spy as unknown as typeof fetch,
    )
    expect((spy.mock.calls[0]! as unknown as [string])[0]).toBe(
      'https://abc.databases.neo4j.io/db/d30e12cc/query/v2',
    )
  })

  it('falls back to the `neo4j` database when creds.database is blank', async () => {
    const spy = vi.fn(
      async () => new Response(JSON.stringify(HEALTH_OK), { status: 200 }),
    )
    await auraQuery(
      { ...CREDS, database: '   ' },
      'RETURN 1',
      {},
      spy as unknown as typeof fetch,
    )
    expect((spy.mock.calls[0]! as unknown as [string])[0]).toBe(
      'https://abc.databases.neo4j.io/db/neo4j/query/v2',
    )
  })
})

describe('httpQueryBase — Aura Bolt-URI → HTTP Query API base', () => {
  it('rewrites every Bolt scheme to https and drops the Bolt port', () => {
    expect(httpQueryBase('neo4j+s://abc.databases.neo4j.io')).toBe(
      'https://abc.databases.neo4j.io',
    )
    expect(httpQueryBase('bolt://abc.databases.neo4j.io:7687')).toBe(
      'https://abc.databases.neo4j.io',
    )
    expect(httpQueryBase('neo4j://abc.databases.neo4j.io/')).toBe(
      'https://abc.databases.neo4j.io',
    )
  })

  it('passes an already-https URI through unchanged (sans trailing slash)', () => {
    expect(httpQueryBase('https://abc.databases.neo4j.io/')).toBe(
      'https://abc.databases.neo4j.io',
    )
  })

  it('defaults a bare host to https', () => {
    expect(httpQueryBase('abc.databases.neo4j.io')).toBe(
      'https://abc.databases.neo4j.io',
    )
  })
})

describe('auraQuery — response parsing', () => {
  it('parses the v2 {data:{fields,values}} success shape', async () => {
    const r = await auraQuery(CREDS, 'RETURN 1', {}, mockFetchJson(HEALTH_OK))
    expect(r.fields).toEqual(['n'])
    expect(r.values).toEqual([[1234]])
    expect(col(r, r.values[0]!, 'n')).toBe(1234)
    expect(col(r, r.values[0]!, 'missing')).toBeUndefined()
  })

  it('throws AuraQueryError on a Cypher error payload', async () => {
    await expect(
      auraQuery(CREDS, 'RETURN', {}, mockFetchJson(CYPHER_ERROR)),
    ).rejects.toBeInstanceOf(AuraQueryError)
  })

  it('throws AuraQueryError on an unexpected body shape', async () => {
    await expect(
      auraQuery(CREDS, 'RETURN 1', {}, mockFetchJson({ nope: true })),
    ).rejects.toBeInstanceOf(AuraQueryError)
  })

  it('throws AuraQueryError on a non-ok 4xx', async () => {
    await expect(
      auraQuery(CREDS, 'RETURN 1', {}, mockFetchJson({}, 401)),
    ).rejects.toBeInstanceOf(AuraQueryError)
  })
})

describe('auraQuery — cold-Aura waking path', () => {
  it('aborts after the timeout and throws AuraWakingError', async () => {
    vi.useFakeTimers()
    const p = auraQuery(CREDS, 'RETURN 1', {}, mockFetchHang())
    const assertion = expect(p).rejects.toBeInstanceOf(AuraWakingError)
    await vi.advanceTimersByTimeAsync(9001)
    await assertion
    vi.useRealTimers()
  })

  it('maps a 503/504 from Aura (resuming) to AuraWakingError', async () => {
    await expect(
      auraQuery(CREDS, 'RETURN 1', {}, mockFetchJson({}, 503)),
    ).rejects.toBeInstanceOf(AuraWakingError)
  })
})

describe('auraQuery — transient-fetch retry (graph-unreachable mitigation)', () => {
  const NO_WAIT = { backoffMs: 0, sleep: async () => {} }

  it('retries a transient subrequest network failure and recovers', async () => {
    let calls = 0
    const flaky = (async () => {
      calls += 1
      if (calls === 1) throw new TypeError('network error') // not an abort
      return new Response(JSON.stringify(HEALTH_OK), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }) as unknown as typeof fetch
    const result = await auraQuery(CREDS, 'RETURN 1', {}, flaky, NO_WAIT)
    expect(calls).toBe(2) // first attempt threw, retry succeeded
    expect(result.fields).toEqual(['n'])
  })

  it('gives up after the retry budget and throws AuraQueryError', async () => {
    let calls = 0
    const alwaysDown = (async () => {
      calls += 1
      throw new TypeError('connection refused')
    }) as unknown as typeof fetch
    await expect(
      auraQuery(CREDS, 'RETURN 1', {}, alwaysDown, NO_WAIT),
    ).rejects.toBeInstanceOf(AuraQueryError)
    expect(calls).toBe(2) // 1 initial + AURA_FETCH_RETRIES(1)
  })

  it('does NOT retry the 9s abort (cold Aura stays a single waking signal)', async () => {
    vi.useFakeTimers()
    let calls = 0
    const hang = ((_url: string, init?: RequestInit) => {
      calls += 1
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () =>
          reject(Object.assign(new Error('aborted'), { name: 'AbortError' })),
        )
      })
    }) as unknown as typeof fetch
    const p = auraQuery(CREDS, 'RETURN 1', {}, hang, NO_WAIT)
    const assertion = expect(p).rejects.toBeInstanceOf(AuraWakingError)
    await vi.advanceTimersByTimeAsync(9001)
    await assertion
    expect(calls).toBe(1) // aborted once, never retried
    vi.useRealTimers()
  })

  it('does NOT retry an HTTP error response (a returned 4xx is final)', async () => {
    let calls = 0
    const four0four = (async () => {
      calls += 1
      return new Response('nope', { status: 404 })
    }) as unknown as typeof fetch
    await expect(
      auraQuery(CREDS, 'RETURN 1', {}, four0four, NO_WAIT),
    ).rejects.toBeInstanceOf(AuraQueryError)
    expect(calls).toBe(1) // got a response → no retry
  })
})
