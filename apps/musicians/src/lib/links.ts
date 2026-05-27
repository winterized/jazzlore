// Spotify + Apple Music search deep-link builders (Phase B contract).
//
// v1 = simple search deep-links, no API integration; both services treated
// equally with link parity (technical note "External link generation").
// Record query is `"<title> <primaryArtist>"`; the same encoded term is used
// for both services so parity is structural, not coincidental.
//
// Musician search query (tier-3 of the 3-tier Listen fallback) is the
// **plain name** — no `jazz`, no instrument, no qualifier of any kind.
// Apple Music's search does strict multi-term matching: ANY qualifier
// zeroes out the result for artists whose catalog doesn't tag that term
// (on-device 2026-05-27: `Antoine Karacostas` → "No Results" with any
// qualifier, resolves perfectly with plain name). Spotify is fuzzier but
// the qualifier's only benefit (homonym disambiguation among common-name
// sidemen) doesn't survive on Apple, so it isn't worth a platform-split.
// We accept the rare case (genuine homonym with no artist URL surfaces
// the wrong artist) to fix the common case (unique names zeroing out).

const SPOTIFY_SEARCH = 'https://open.spotify.com/search/'
const APPLE_SEARCH = 'https://music.apple.com/search?term='

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
  return SPOTIFY_SEARCH + term([name])
}

export function appleMusicMusicianUrl(name: string): string {
  return APPLE_SEARCH + term([name])
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
