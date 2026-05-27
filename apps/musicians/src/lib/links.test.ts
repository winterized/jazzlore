import { describe, expect, it } from 'vitest'
import {
  appleMusicMusicianUrl,
  appleMusicRecordUrl,
  spotifyMusicianUrl,
  spotifyRecordUrl,
} from './links'

describe('musician deep-links', () => {
  // Musician search queries are the **plain name** — no `jazz`, no
  // instrument, no qualifier of any kind. Apple Music's strict
  // multi-term matching zeroes out catalogs that don't tag the
  // qualifier (on-device 2026-05-27: `Antoine Karacostas + jazz` →
  // "No Results"; bare `Antoine Karacostas` → resolves). The
  // namesake-hazard (Paul Chambers, George Lewis, Sam Jones) is
  // accepted as a known trade-off; tier-2 (artist URL) and tier-1
  // (curated track) handle those cases when populator data is present.

  it('Spotify musician = open.spotify.com/search/<name> (plain, no qualifier)', () => {
    expect(spotifyMusicianUrl('Miles Davis')).toBe(
      'https://open.spotify.com/search/Miles%20Davis',
    )
  })

  it('Apple musician = music.apple.com/search?term=<name> (plain, no qualifier)', () => {
    expect(appleMusicMusicianUrl('Miles Davis')).toBe(
      'https://music.apple.com/search?term=Miles%20Davis',
    )
  })

  it('Antoine Karacostas resolves with plain name (on-device regression)', () => {
    // Direct regression: with `jazz` appended, Apple Music returned
    // "No Results" for this name (his catalog isn't tagged jazz at
    // Apple). The plain-name fallback restores the artist page.
    expect(appleMusicMusicianUrl('Antoine Karacostas')).toBe(
      'https://music.apple.com/search?term=Antoine%20Karacostas',
    )
    expect(spotifyMusicianUrl('Antoine Karacostas')).toBe(
      'https://open.spotify.com/search/Antoine%20Karacostas',
    )
  })

  it('appends no qualifier (no "jazz", no instrument, nothing)', () => {
    // Structural assertion: the query string contains exactly the
    // encoded name and nothing else past it. Guards against a future
    // re-introduction of a disambiguator (`jazz`, `musician`, …).
    const spotify = spotifyMusicianUrl('Paul Chambers')
    const apple = appleMusicMusicianUrl('George Lewis')
    expect(spotify).toBe('https://open.spotify.com/search/Paul%20Chambers')
    expect(apple).toBe('https://music.apple.com/search?term=George%20Lewis')
    // The query portion (after `/search/` or `?term=`) must equal the
    // encoded name exactly — no `%20jazz`, `%20musician`, etc.
    expect(spotify.split('/search/')[1]).toBe('Paul%20Chambers')
    expect(apple.split('?term=')[1]).toBe('George%20Lewis')
  })

  it('encodes accents and edge characters (plain name only)', () => {
    expect(spotifyMusicianUrl('Antoine Hervé')).toBe(
      'https://open.spotify.com/search/Antoine%20Herv%C3%A9',
    )
    expect(appleMusicMusicianUrl('Antoine Hervé')).toBe(
      'https://music.apple.com/search?term=Antoine%20Herv%C3%A9',
    )
    // & ? # / + are all percent-encoded by encodeURIComponent
    expect(spotifyMusicianUrl('Ty & The #1 Band / +')).toBe(
      'https://open.spotify.com/search/Ty%20%26%20The%20%231%20Band%20%2F%20%2B',
    )
  })

  it('trims surrounding whitespace before encoding', () => {
    expect(spotifyMusicianUrl('  Bill Evans  ')).toBe(
      'https://open.spotify.com/search/Bill%20Evans',
    )
  })
})

describe('record deep-links', () => {
  it('record query = "<title> <primaryArtist>", encoded, parity across services', () => {
    const spotify = spotifyRecordUrl("Moanin'", 'Art Blakey')
    const apple = appleMusicRecordUrl("Moanin'", 'Art Blakey')
    expect(spotify).toBe(
      "https://open.spotify.com/search/Moanin'%20Art%20Blakey",
    )
    expect(apple).toBe(
      "https://music.apple.com/search?term=Moanin'%20Art%20Blakey",
    )
    // Parity: the encoded search term is identical across services.
    expect(spotify.split('/search/')[1]).toBe(apple.split('?term=')[1])
  })

  it('falls back to title-only when primaryArtist is absent/empty', () => {
    expect(spotifyRecordUrl('Kind of Blue')).toBe(
      'https://open.spotify.com/search/Kind%20of%20Blue',
    )
    expect(spotifyRecordUrl('Kind of Blue', '   ')).toBe(
      'https://open.spotify.com/search/Kind%20of%20Blue',
    )
    expect(appleMusicRecordUrl('Kind of Blue', undefined)).toBe(
      'https://music.apple.com/search?term=Kind%20of%20Blue',
    )
  })

  it('encodes accents in either field', () => {
    expect(spotifyRecordUrl('Café', 'Antoine Hervé')).toBe(
      'https://open.spotify.com/search/Caf%C3%A9%20Antoine%20Herv%C3%A9',
    )
  })
})
