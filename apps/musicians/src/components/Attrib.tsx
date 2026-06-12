// AttribPhoto / AttribAlbum — magazine-style image captions.
//
// LEGAL requirement, not polish (CLAUDE.md "Image attribution"): render the
// caption whenever ANY license/attribution field is non-empty. The frozen
// `attributionCaption` (lib/attribution.ts) owns that rule — returns null only
// for public-domain (all fields empty). A missing portrait gets an explicit
// italic placeholder, never silent (design "Missing-photo gets an italic
// placeholder").

import type { MouseEvent } from 'react'
import { useState } from 'react'
import type { ImageAttribution, RecordRef } from '../lib/types'
import { attributionCaption } from '../lib/attribution'
import { appleMusicRecordUrl, spotifyRecordUrl } from '../lib/links'
import { coverArtSources } from '../lib/cover'
import { Duo3 } from './Duo3'
import { TypographicCover } from './TypographicCover'

export function AttribPhoto({
  name,
  attribution,
  missing = false,
}: {
  name: string
  attribution: ImageAttribution
  /** No portrait on file → explicit italic placeholder (never silent). */
  missing?: boolean
}) {
  const caption = attributionCaption(attribution, 'Photo')
  // Phase H — the detail hero renders the REAL duotone portrait (eager +
  // priority: it is the LCP image on the detail route, so it loads eagerly
  // AND with fetchpriority=high to win connection priority over the record
  // strip's cover requests under slow-4G — issue #164). The figure is presentational
  // (no interactive role → NOT made tabbable: a focusable non-interactive
  // element is an a11y anti-pattern). The duotone→colour reveal therefore
  // fires on `:hover` here; on the home page the curated card IS a focusable
  // <a> so it additionally reveals on `:focus-visible` (keyboard parity).
  // `missing` keeps the explicit "no portrait on file" placeholder + the
  // flat monogram (never silent).
  return (
    <figure className="ident-photo">
      <Duo3
        name={name}
        photo={!missing}
        portrait={missing ? undefined : attribution}
        eager
        priority
      />
      <figcaption>
        {missing ? (
          <span className="attr-missing">
            No portrait on file &mdash; Wikimedia Commons request pending.
          </span>
        ) : (
          caption && <span>{caption}</span>
        )}
      </figcaption>
    </figure>
  )
}

/** The cover image, with a graceful onError → typographic-sleeve fallback (a
 * hotlinked CAA cover that 404s / blocks degrades to the deterministic
 * typographic cover, never a broken-image icon). Decorative `alt=""` — the
 * title text + the link's aria-label carry the accessible name, so the cover
 * doesn't triple-announce. 250px served into the 124px tile (perf, D8). */
function RecordCover({ rec }: { rec: RecordRef }) {
  const [failed, setFailed] = useState(false)
  const url = rec.cover.url
  if (!url || failed) {
    return <TypographicCover title={rec.title} seed={rec.id ?? rec.title} />
  }
  const { src, srcSet } = coverArtSources(url)
  return (
    <img
      className="rec-cover"
      src={src}
      srcSet={srcSet}
      sizes="124px"
      alt=""
      width={124}
      height={124}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  )
}

export function AttribAlbum({ rec }: { rec: RecordRef }) {
  const caption = attributionCaption(rec.cover, 'Cover art')
  const artist = rec.primaryArtist
  const meta = [artist, rec.label].filter(Boolean).join(' · ')
  // Listen cascade (D6): album-level resolved URL when the populator found one,
  // else the `<title> <artist>` search builder. Apple-first per §1.3.
  const appleHref = rec.appleAlbumUrl ?? appleMusicRecordUrl(rec.title, artist)
  const spotifyHref = rec.spotifyAlbumUrl ?? spotifyRecordUrl(rec.title, artist)
  // Icon taps open in a new tab and MUST NOT bubble to the cover's primary
  // link (mirrors ConnRow's listen icons). They are siblings of `.rec-link`
  // (not nested anchors), so this is belt-and-suspenders.
  const stop = (e: MouseEvent): void => e.stopPropagation()
  return (
    <div className="rec-tile">
      <a
        className="rec-link"
        href={appleHref}
        target="_blank"
        rel="noreferrer"
        aria-label={`Listen to ${rec.title}${artist ? ` by ${artist}` : ''} on Apple Music`}
      >
        <figure className="fig">
          <RecordCover rec={rec} />
          <div className="rt">{rec.title}</div>
          {meta && <div className="rm">{meta}</div>}
          {rec.releaseYear && (
            <div className="ry">&apos;{String(rec.releaseYear).slice(-2)}</div>
          )}
          {caption && <figcaption>{caption}</figcaption>}
        </figure>
      </a>
      {/* Apple Music FIRST per Apple's Identity Guidelines §1.3 (when Apple's
          mark sits alongside other music-service marks it must lead). `.rec-act`
          is a flex ROW, so DOM order = visual left→right: Apple left, Spotify
          right. Official marks vendored unmodified + theme-swapped in CSS
          (Apple never recoloured). Decorative glyphs — the anchor carries the
          accessible name. */}
      <div className="rec-act">
        <a
          className="ic"
          href={appleHref}
          target="_blank"
          rel="noreferrer"
          aria-label={`Listen to ${rec.title} on Apple Music`}
          onClick={stop}
        >
          <span className="ic-glyph ic-apple" aria-hidden="true" />
        </a>
        <a
          className="ic"
          href={spotifyHref}
          target="_blank"
          rel="noreferrer"
          aria-label={`Listen to ${rec.title} on Spotify`}
          onClick={stop}
        >
          <span className="ic-glyph ic-spotify" aria-hidden="true" />
        </a>
      </div>
    </div>
  )
}
