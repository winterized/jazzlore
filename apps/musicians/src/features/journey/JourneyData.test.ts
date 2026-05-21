// Data-integrity guard for the journey landing pages. Catches accidental
// edits to eras.ts / labels.ts (typos in IDs, missing kickers, dupes in
// the curated lists, slug drift). Runs as a vitest unit suite.

import { describe, it, expect } from 'vitest'
import { ERA_DATA } from './data/eras'
import { LABEL_DATA } from './data/labels'
import type { JourneyEntry } from './JourneyData'

const KEBAB_SLUG = /^[a-z][a-z0-9-]*[a-z0-9]$/
const VALID_ID_PREFIX = /^(wikidata|musicbrainz|discogs):/

function expectsAJourneyEntry(slug: string, entry: JourneyEntry): void {
  expect(entry.slug, `entry.slug must equal map key ${slug}`).toBe(slug)
  expect(entry.slug).toMatch(KEBAB_SLUG)
  expect(entry.name.length).toBeGreaterThan(0)
  expect(entry.kicker.length).toBeGreaterThan(0)
  expect(entry.h1.length).toBeGreaterThan(0)
  expect(entry.subtitle.length).toBeGreaterThan(0)
  expect(entry.icon.length).toBeGreaterThan(0)
  // 8 to 12 curated musicians per the brainstorm decision.
  expect(entry.musicians.length).toBeGreaterThanOrEqual(8)
  expect(entry.musicians.length).toBeLessThanOrEqual(12)
  const seen = new Set<string>()
  for (const m of entry.musicians) {
    expect(m.id).toMatch(VALID_ID_PREFIX)
    expect(m.name.length).toBeGreaterThan(0)
    expect(m.hook.length).toBeGreaterThan(0)
    expect(seen.has(m.id), `duplicate id ${m.id} in ${slug}`).toBe(false)
    seen.add(m.id)
  }
}

describe('ERA_DATA', () => {
  it('has the 7 canonical eras', () => {
    expect(Object.keys(ERA_DATA)).toEqual([
      'swing',
      'bebop',
      'cool',
      'hard-bop',
      'modal',
      'free',
      'fusion',
    ])
  })

  for (const [slug, entry] of Object.entries(ERA_DATA)) {
    it(`${slug} is a valid JourneyEntry`, () => {
      expectsAJourneyEntry(slug, entry)
    })
  }
})

describe('LABEL_DATA', () => {
  it('has the 6 iconic labels in jazz-prominence order (NOT strict founding year — see data/labels.ts header)', () => {
    expect(Object.keys(LABEL_DATA)).toEqual([
      'blue-note',
      'prestige',
      'riverside',
      'verve',
      'columbia',
      'impulse',
    ])
  })

  for (const [slug, entry] of Object.entries(LABEL_DATA)) {
    it(`${slug} is a valid JourneyEntry`, () => {
      expectsAJourneyEntry(slug, entry)
    })
  }
})
