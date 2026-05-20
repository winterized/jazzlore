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
import { metaLine, firstSentence } from './detailIdentityMeta'

export function DetailIdentity({
  d,
  duplicate,
}: {
  d: MusicianDetail
  duplicate: boolean
}) {
  const firstName = d.name.split(' ')[0] ?? d.name
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
          href={spotifyMusicianUrl(d.name)}
          target="_blank"
          rel="noreferrer"
        >
          <SpotifyIcon /> Listen on Spotify
        </a>
        <a
          className="btn alt"
          href={appleMusicMusicianUrl(d.name)}
          target="_blank"
          rel="noreferrer"
        >
          <AppleIcon /> Apple Music
        </a>
      </section>
    </>
  )
}
