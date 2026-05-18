// DetailIdentity — the identity strip + bio + listen block (design
// `MobileDetailV5` header/ident/bio/listen). Sparse-faithful: no bio → an
// explicit "bio not yet written" placeholder (never silent); no portrait →
// the Duo3 initials carry identity. The user-facing duplicate flag (the
// Antoine sparse-state design) renders only when the BFF flags it — this is
// a UI signal, NOT a dedup (landmine 11).

import type { MusicianDetail } from '../../lib/types'
import { spotifyMusicianUrl, appleMusicMusicianUrl } from '../../lib/links'
import { Duo3 } from '../../components/Duo3'
import { SpotifyIcon, AppleIcon } from '../../components/icons'

function metaLine(d: MusicianDetail): string {
  const bits: string[] = []
  const inst = d.primaryInstruments[0]
  if (inst) bits.push(inst)
  if (d.era) bits.push(d.era)
  const start = d.birthYear ?? d.yearsActiveStart
  if (start !== undefined) {
    const end = d.deathYear
    bits.push(end !== undefined ? `${start}–${end}` : `${start}–present`)
  }
  return bits.join(' · ')
}

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
      <section className="ident" aria-labelledby="detail-name">
        <Duo3 name={d.name} photo={d.photo} />
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
          <p>
            {d.bioSummary}
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
