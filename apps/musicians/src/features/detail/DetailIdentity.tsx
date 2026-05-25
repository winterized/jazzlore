// DetailIdentity — the identity strip + bio + listen block (design
// `MobileDetailV5` header/ident/bio/listen). Sparse-faithful: no bio → an
// explicit "bio not yet written" placeholder (never silent); no portrait →
// the Duo3 initials carry identity. The user-facing duplicate flag (the
// Antoine sparse-state design) renders only when the BFF flags it — this is
// a UI signal, NOT a dedup (landmine 11).

import type { MusicianDetail } from '../../lib/types'
import { spotifyMusicianUrl, appleMusicMusicianUrl } from '../../lib/links'
import { AttribPhoto } from '../../components/Attrib'
import { SpotifyIcon, AppleIcon } from '../../components/icons'
import { CURATED, type CuratedListenLink } from '../../data/curated'
import { metaLine, firstSentence } from './detailIdentityMeta'

// Wave 3 / Tier 1 — for the 12 curated musicians, the Listen affordance
// deep-links to a hand-picked signature track (data lives on each
// `CuratedPick.listen`). Non-curated musicians fall back to the existing
// search-URL behaviour from `lib/links`. Frontend-side join: no BFF
// thread, no frozen-type change. The map is built once at module scope.
const CURATED_LISTEN_BY_ID: ReadonlyMap<string, CuratedListenLink> = new Map(
  CURATED.map((c) => [c.id, c.listen]),
)

export function DetailIdentity({
  d,
  duplicate,
}: {
  d: MusicianDetail
  duplicate: boolean
}) {
  const firstName = d.name.split(' ')[0] ?? d.name
  // Wave 3 / Tier 1 — deep-link the Listen buttons to the hand-picked
  // signature track when this musician is one of the curated 12. The
  // visible button labels stay the same ("Listen on Spotify" / "Apple
  // Music"); the swap is in `href` + aria-label, plus a small editorial
  // caption underneath naming the track + source record.
  const listen = CURATED_LISTEN_BY_ID.get(d.id)
  const spotifyHref = listen?.spotify ?? spotifyMusicianUrl(d.name)
  const appleHref = listen?.apple ?? appleMusicMusicianUrl(d.name)
  const spotifyAria = listen
    ? `Listen to ${listen.trackTitle} on Spotify`
    : `Listen to ${d.name} on Spotify`
  const appleAria = listen
    ? `Listen to ${listen.trackTitle} on Apple Music`
    : `Listen to ${d.name} on Apple Music`
  return (
    <>
      {/* Phase H — the real duotone hero portrait + the LEGAL caption
          (AttribPhoto wires the FROZEN attributionCaption). Missing
          picture → AttribPhoto's explicit "no portrait on file"
          placeholder + flat monogram (never silent). */}
      <AttribPhoto
        name={d.name}
        attribution={d.portrait}
        missing={!d.photo}
      />
      <section className="ident ident-text" aria-labelledby="detail-name">
        <div>
          <h1 className="nm" id="detail-name">
            {d.name}
          </h1>
          <div className="ml">{metaLine(d)}</div>
          {duplicate && (
            <div className="dupe-flag">
              <span aria-hidden="true">⚠︎</span> Possible duplicate · help us
              merge
            </div>
          )}
        </div>
      </section>

      <section className="bio" aria-label="Biography">
        {d.bioSummary ? (
          <p className="bio-teaser">
            <em>{firstSentence(d.bioSummary)}</em>
            <a className="more" href="#about">
              More about {firstName} →
            </a>
          </p>
        ) : (
          <div className="sparse-note">
            <b>· Bio not yet written ·</b>
            We don&rsquo;t yet have a biographical summary for {d.name}.
          </div>
        )}
      </section>

      <section className="listen" aria-label={`Listen to ${d.name}`}>
        <a
          className="btn"
          href={spotifyHref}
          target="_blank"
          rel="noreferrer"
          aria-label={spotifyAria}
        >
          <SpotifyIcon /> Listen on Spotify
        </a>
        <a
          className="btn alt"
          href={appleHref}
          target="_blank"
          rel="noreferrer"
          aria-label={appleAria}
        >
          <AppleIcon /> Apple Music
        </a>
      </section>
      {/* Wave 3 / Tier 1 — editorial provenance for the curated 12. Track
       *  title + source record sit beneath the buttons so sighted users
       *  see what they're about to play. aria-hidden because the track
       *  title is already in each anchor's aria-label (no double-read). */}
      {listen && (
        <p className="listen-track" aria-hidden="true">
          <em>{listen.trackTitle}</em> &middot; {listen.sourceRecord}
        </p>
      )}
    </>
  )
}
