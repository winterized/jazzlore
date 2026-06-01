import { describe, it, expect } from 'vitest'
import { CURATED, LISTEN_EXTRAS } from './curated'

// Brand-compliance Phase 5 — structural link verification. Every hand-picked
// tier-1 listen deep-link must point at the canonical streaming hosts so the
// Apple Music / Spotify buttons always resolve to a real music.apple.com /
// open.spotify.com URL. The search-builder tier (links.ts) and its format are
// covered by links.test.ts; the populator-supplied artist-URL tier is live
// data, verified by click-through. This guards the static curated source and
// any future additions to it.
const ALL = [...CURATED, ...LISTEN_EXTRAS]

describe('curated listen links — canonical streaming hosts', () => {
  it('has at least the 12 curated picks (sanity that the import resolved)', () => {
    expect(CURATED.length).toBeGreaterThanOrEqual(12)
  })

  it.each(ALL)(
    '$id deep-links to https Apple Music + Spotify hosts for both services',
    (pick) => {
      expect(pick.listen.spotify).toMatch(/^https:\/\/open\.spotify\.com\/\S+$/)
      expect(pick.listen.apple).toMatch(/^https:\/\/music\.apple\.com\/\S+$/)
    },
  )
})
