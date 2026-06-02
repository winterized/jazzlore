// DetailIdentity — the identity strip + bio + listen block (design
// `MobileDetailV5` header/ident/bio/listen). Sparse-faithful: no bio → an
// explicit "bio not yet written" placeholder (never silent); no portrait →
// the Duo3 initials carry identity. The user-facing duplicate flag (the
// Antoine sparse-state design) renders only when the BFF flags it — this is
// a UI signal, NOT a dedup (landmine 11).

import type { MusicianDetail } from '../../lib/types'
import { spotifyMusicianUrl, appleMusicMusicianUrl } from '../../lib/links'
import { AttribPhoto } from '../../components/Attrib'
import {
  CURATED,
  LISTEN_EXTRAS,
  type CuratedListenLink,
} from '../../data/curated'
import { metaLine, firstSentence } from './detailIdentityMeta'

// 3-tier Listen fallback. The button always renders; what it deep-links to
// degrades through:
//   Tier 1 — hand-picked TRACK URL (the 12 curated picks + LISTEN_EXTRAS
//            like John Lewis). Aria-label names the track; an editorial
//            caption shows beneath the buttons.
//   Tier 2 — artist-page URL on the musician's `links` (Spotify ~50% /
//            Apple <30% via MusicBrainz; populator-supplied). Aria-label
//            stays generic on the musician name — we don't imply a track.
//   Tier 3 — plain-name search URL. Apple Music's strict multi-term
//            matching zeroes out artists whose catalog isn't tagged
//            for a given qualifier (on-device 2026-05-27: any qualifier
//            on `Antoine Karacostas` → "No Results"). The namesake
//            hazard on common-name sidemen (Paul Chambers, George Lewis,
//            Sam Jones) is accepted as a trade-off; tier-2 covers those
//            cases when the populator landed an artist URL.
// The two services resolve INDEPENDENTLY — a musician can land in tier 2
// for Spotify (artist URL present) and tier 3 for Apple (no artist URL).
// Tier 1, when present, covers both services together (same track, two
// services); enforced at the type level by `CuratedListenLink` requiring
// BOTH `spotify` AND `apple` (curated.ts:38-48) — there's no partial-tier-1
// case to handle. The visible button label stays "Listen on Spotify" /
// "Apple Music" at every tier — honest at all three.
//
// Tiebreak: if an id ever appears in BOTH CURATED and LISTEN_EXTRAS (the
// home-grid 12 vs. the not-on-home-grid extras), `CURATED` wins. CURATED is
// the editorial authority for the home grid; LISTEN_EXTRAS is for picks
// outside that surface. Today there's zero overlap by design, but spreading
// LISTEN_EXTRAS FIRST then CURATED keeps the intuitive precedence even if
// someone later forgets and adds a duplicate id.
const TIER1_LISTEN_BY_ID: ReadonlyMap<string, CuratedListenLink> = new Map([
  ...LISTEN_EXTRAS.map((e) => [e.id, e.listen] as const),
  ...CURATED.map((c) => [c.id, c.listen] as const),
])

// Official Apple-supplied "Listen on Apple Music" badge, vendored UNMODIFIED
// at public/brand-assets/apple-music (Phase 1). Apple's Identity Guidelines
// REQUIRE the badge be used exactly as supplied — no recolour, no redraw —
// so it ships as a static asset embedded via <img> (public/ is copied
// verbatim, never transformed by the build). It is the primary Apple Music
// surface; the badge's own colour note is Apple's mandated artwork.
const APPLE_MUSIC_BADGE =
  '/brand-assets/apple-music/US-UK_Apple_Music_Listen_on_Badge_RGB_072720.svg'

export function DetailIdentity({
  d,
  duplicate,
}: {
  d: MusicianDetail
  duplicate: boolean
}) {
  const firstName = d.name.split(' ')[0] ?? d.name
  // 3-tier Listen resolution. See module-level TIER1_LISTEN_BY_ID doc.
  // `??` cascades the tiers per service; aria-labels only name a specific
  // track on tier 1 (artist/search tiers stay generic so we never imply a
  // track the user might tap into).
  const listen = TIER1_LISTEN_BY_ID.get(d.id)
  const spotifyHref =
    listen?.spotify ?? d.links.spotifyArtistUrl ?? spotifyMusicianUrl(d.name)
  const appleHref =
    listen?.apple ?? d.links.appleArtistUrl ?? appleMusicMusicianUrl(d.name)
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

      {/* Apple Music FIRST per Apple's Identity Guidelines §1.3: when the
          Apple Music badge appears alongside another music-service mark it
          must lead the lineup. `.listen` is a (wrapping) flex row, so DOM
          order = visual left→right: Apple badge left, Spotify button right. */}
      <section className="listen" aria-label={`Listen to ${d.name}`}>
        {/* Primary Apple Music surface — Apple's fixed badge artwork
            (embedded verbatim). The badge already reads "Listen on Apple
            Music", so the <img> is decorative (alt="" + aria-hidden) and the
            anchor's tiered aria-label stays the single accessible name. */}
        <a
          className="apple-badge"
          href={appleHref}
          target="_blank"
          rel="noreferrer"
          aria-label={appleAria}
        >
          {/* width/height = the badge artwork's native viewBox (140.62x41,
              rounded) so the browser reserves the correct aspect box before
              the SVG loads (no layout shift). CSS still renders it at 44px
              tall / auto width. */}
          <img
            src={APPLE_MUSIC_BADGE}
            alt=""
            aria-hidden="true"
            width={141}
            height={41}
          />
        </a>
        <a
          className="btn"
          href={spotifyHref}
          target="_blank"
          rel="noreferrer"
          aria-label={spotifyAria}
        >
          {/* Official Spotify mark (vendored unmodified) rendered as a CSS
              mask so it inherits the button's text colour via currentColor —
              white on light, near-black on dark, exactly like the label. */}
          <span className="spfy-mark" aria-hidden="true" /> Listen on Spotify
        </a>
      </section>
      {/* Editorial provenance line — only when both services land in
       *  tier 1 (hand-picked track). Track title + source record sit
       *  beneath the buttons so sighted users see what they're about to
       *  play. aria-hidden because the track title is already in each
       *  anchor's aria-label (no double-read). Tier 2 / 3 never show this
       *  line — there's no specific track to name. */}
      {listen && (
        <p className="listen-track" aria-hidden="true">
          <em>{listen.trackTitle}</em> &middot; {listen.sourceRecord}
        </p>
      )}
    </>
  )
}
