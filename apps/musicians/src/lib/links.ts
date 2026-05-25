// Spotify + Apple Music search deep-link builders (Phase B contract).
//
// v1 = simple search deep-links, no API integration; both services treated
// equally with link parity (technical note "External link generation").
// Record query is `"<title> <primaryArtist>"`; the same encoded term is used
// for both services so parity is structural, not coincidental.
//
// Musician search query is **disambiguated with `jazz`** — `Paul Chambers`,
// `George Lewis`, `Sam Jones` etc. share their names with non-jazz artists,
// and a bare-name search would surface the namesake first. The
// disambiguator follows the same discipline as the MB-first artist-URL
// resolution: never search bare name when a disambiguating signal is
// available. Tier-3 of the 3-tier Listen fallback fires precisely on the
// obscure / ambiguous tail where mis-hits are worst.

const SPOTIFY_SEARCH = 'https://open.spotify.com/search/'
const APPLE_SEARCH = 'https://music.apple.com/search?term='
const JAZZ_DISAMBIGUATOR = 'jazz'

/** Build the shared, encoded search term. Trims, then encodeURIComponent so
 * accents and `& ? # / +` are all percent-encoded identically per service. */
function term(parts: string[]): string {
  return encodeURIComponent(
    parts
      .map((p) => p.trim())
      .filter((p) => p !== '')
      .join(' '),
  )
}

export function spotifyMusicianUrl(name: string): string {
  return SPOTIFY_SEARCH + term([name, JAZZ_DISAMBIGUATOR])
}

export function appleMusicMusicianUrl(name: string): string {
  return APPLE_SEARCH + term([name, JAZZ_DISAMBIGUATOR])
}

/** Record search term = `"<title> <primaryArtist>"`. `primaryArtist` is
 * optional (it's a derived field — see types.ts / README reconcile note);
 * absent/blank falls back to title-only so the URL is never malformed. */
export function spotifyRecordUrl(title: string, primaryArtist?: string): string {
  return SPOTIFY_SEARCH + term([title, primaryArtist ?? ''])
}

export function appleMusicRecordUrl(
  title: string,
  primaryArtist?: string,
): string {
  return APPLE_SEARCH + term([title, primaryArtist ?? ''])
}
