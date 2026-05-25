import { describe, expect, it } from 'vitest'
import {
  appleMusicMusicianUrl,
  appleMusicRecordUrl,
  spotifyMusicianUrl,
  spotifyRecordUrl,
} from './links'

describe('musician deep-links', () => {
  // Musician search queries are disambiguated with `jazz` to dodge the
  // namesake hazard (Paul Chambers, George Lewis, Sam Jones, etc.).
  // Same discipline as the MB-first artist-URL resolution — never search
  // bare name when we have a disambiguating signal.

  it('Spotify musician = open.spotify.com/search/<name>%20jazz', () => {
    expect(spotifyMusicianUrl('Miles Davis')).toBe(
      'https://open.spotify.com/search/Miles%20Davis%20jazz',
    )
  })

  it('Apple musician = music.apple.com/search?term=<name>%20jazz', () => {
    expect(appleMusicMusicianUrl('Miles Davis')).toBe(
      'https://music.apple.com/search?term=Miles%20Davis%20jazz',
    )
  })

  it('disambiguates common-name sidemen (Paul Chambers → namesake guard)', () => {
    // The whole point of the disambiguator — `Paul Chambers` alone surfaces
    // a different artist on Spotify. With `jazz` appended, the jazz bassist
    // ranks first.
    expect(spotifyMusicianUrl('Paul Chambers')).toBe(
      'https://open.spotify.com/search/Paul%20Chambers%20jazz',
    )
    expect(appleMusicMusicianUrl('George Lewis')).toBe(
      'https://music.apple.com/search?term=George%20Lewis%20jazz',
    )
  })

  it('encodes accents and edge characters (and still appends jazz)', () => {
    expect(spotifyMusicianUrl('Antoine Hervé')).toBe(
      'https://open.spotify.com/search/Antoine%20Herv%C3%A9%20jazz',
    )
    expect(appleMusicMusicianUrl('Antoine Hervé')).toBe(
      'https://music.apple.com/search?term=Antoine%20Herv%C3%A9%20jazz',
    )
    // & ? # / + are all percent-encoded by encodeURIComponent
    expect(spotifyMusicianUrl('Ty & The #1 Band / +')).toBe(
      'https://open.spotify.com/search/Ty%20%26%20The%20%231%20Band%20%2F%20%2B%20jazz',
    )
  })

  it('trims surrounding whitespace before encoding (jazz still appended)', () => {
    expect(spotifyMusicianUrl('  Bill Evans  ')).toBe(
      'https://open.spotify.com/search/Bill%20Evans%20jazz',
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
