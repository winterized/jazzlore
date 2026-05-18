import { describe, expect, it } from 'vitest'
import {
  appleMusicMusicianUrl,
  appleMusicRecordUrl,
  spotifyMusicianUrl,
  spotifyRecordUrl,
} from './links'

describe('musician deep-links', () => {
  it('Spotify musician = open.spotify.com/search/<encoded name>', () => {
    expect(spotifyMusicianUrl('Miles Davis')).toBe(
      'https://open.spotify.com/search/Miles%20Davis',
    )
  })

  it('Apple musician = music.apple.com/search?term=<encoded name>', () => {
    expect(appleMusicMusicianUrl('Miles Davis')).toBe(
      'https://music.apple.com/search?term=Miles%20Davis',
    )
  })

  it('encodes accents and edge characters', () => {
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
