// RandomJumpPage tests — Wave 1 / PR6 / audit Quality #1 + #17.
//
// Verifies the polished-first-then-fallthrough flow:
//   1. polishedIds() picks succeed → navigate to a polished musician
//   2. polishedIds() waking or empty → fall through to searchIndex pick
//   3. Both fail → navigate to /musicians

import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router'
import {
  fixtureSource,
  type DataSource,
} from '../../hooks/useMusicianData'
import { RandomJumpPage } from './RandomJumpPage'

/** Captures react-router location into a ref so each test can assert the
 * final replace-navigate destination after the page rolls. */
function LocationProbe({ onLocation }: { onLocation: (path: string) => void }) {
  const loc = useLocation()
  onLocation(`${loc.pathname}${loc.search}${loc.hash}`)
  return null
}

function setup(source: DataSource): { lastPath: () => string } {
  let last = '/musicians/journey/random'
  render(
    <MemoryRouter initialEntries={['/musicians/journey/random']}>
      <Routes>
        <Route
          path="/musicians/journey/random"
          element={<RandomJumpPage source={source} />}
        />
        <Route path="*" element={<LocationProbe onLocation={(p) => (last = p)} />} />
      </Routes>
    </MemoryRouter>,
  )
  return { lastPath: () => last }
}

beforeEach(() => {
  // Determinism: pick index 0 → the first id in the pool.
  vi.spyOn(Math, 'random').mockReturnValue(0)
})
afterEach(() => {
  vi.restoreAllMocks()
})

describe('RandomJumpPage', () => {
  it('navigates to a polished musician when polishedIds resolves with ids', async () => {
    const source: DataSource = {
      ...fixtureSource,
      polishedIds: async () => ({
        ids: ['wikidata:Q93341', 'wikidata:Q7346'],
      }),
      // searchIndex should NOT be called on the happy path — if it is, the
      // test will fail with the wrong navigation target.
      searchIndex: async () => {
        throw new Error('searchIndex should not be reached')
      },
    }
    const { lastPath } = setup(source)
    await waitFor(() => {
      expect(lastPath()).toBe('/musicians/wikidata%3AQ93341')
    })
  })

  it('falls through to searchIndex when polishedIds returns waking', async () => {
    const source: DataSource = {
      ...fixtureSource,
      polishedIds: async () => ({ status: 'waking', retryAfter: 8 }),
      searchIndex: async () => ({
        corpus: [
          { id: 'wikidata:FALLBACK', name: 'Fallback', aka: [] },
        ],
      }),
    }
    const { lastPath } = setup(source)
    await waitFor(() => {
      expect(lastPath()).toBe('/musicians/wikidata%3AFALLBACK')
    })
  })

  it('falls through to searchIndex when polishedIds returns an empty pool', async () => {
    const source: DataSource = {
      ...fixtureSource,
      polishedIds: async () => ({ ids: [] }),
      searchIndex: async () => ({
        corpus: [{ id: 'wikidata:EMPTY', name: 'Empty Pool Fallback', aka: [] }],
      }),
    }
    const { lastPath } = setup(source)
    await waitFor(() => {
      expect(lastPath()).toBe('/musicians/wikidata%3AEMPTY')
    })
  })

  it('falls through to searchIndex when polishedIds rejects (network/HTTP error)', async () => {
    const source: DataSource = {
      ...fixtureSource,
      polishedIds: async () => {
        throw new Error('boom')
      },
      searchIndex: async () => ({
        corpus: [{ id: 'wikidata:NET', name: 'Net Fallback', aka: [] }],
      }),
    }
    const { lastPath } = setup(source)
    await waitFor(() => {
      expect(lastPath()).toBe('/musicians/wikidata%3ANET')
    })
  })

  it('navigates to /musicians when BOTH polishedIds AND searchIndex fail', async () => {
    const source: DataSource = {
      ...fixtureSource,
      polishedIds: async () => {
        throw new Error('boom')
      },
      searchIndex: async () => {
        throw new Error('boom2')
      },
    }
    const { lastPath } = setup(source)
    await waitFor(() => {
      expect(lastPath()).toBe('/musicians')
    })
  })

  it('navigates to /musicians when both pools are waking + empty', async () => {
    const source: DataSource = {
      ...fixtureSource,
      polishedIds: async () => ({ status: 'waking', retryAfter: 8 }),
      searchIndex: async () => ({ status: 'waking', retryAfter: 8 }),
    }
    const { lastPath } = setup(source)
    await waitFor(() => {
      expect(lastPath()).toBe('/musicians')
    })
  })

  it('NEVER picks a known-incomplete fixture id when polishedIds returns the curated pool', async () => {
    // Big Joe Turner — the audit's "this site is half-built" example.
    // Confirm he is NOT in the polished pool returned by the fixture source.
    const BIG_JOE = 'wikidata:Q367761'
    const ids = (await fixtureSource.polishedIds()) as { ids: string[] }
    expect(ids.ids).not.toContain(BIG_JOE)
  })
})
