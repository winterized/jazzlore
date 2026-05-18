// AttribPhoto / AttribAlbum — magazine-style image captions.
//
// LEGAL requirement, not polish (CLAUDE.md "Image attribution"): render the
// caption whenever ANY license/attribution field is non-empty. The frozen
// `attributionCaption` (lib/attribution.ts) owns that rule — returns null only
// for public-domain (all fields empty). A missing portrait gets an explicit
// italic placeholder, never silent (design "Missing-photo gets an italic
// placeholder").

import type { ImageAttribution, RecordRef } from '../lib/types'
import { attributionCaption } from '../lib/attribution'
import { spotifyRecordUrl } from '../lib/links'
import { Duo3 } from './Duo3'

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
  return (
    <figure className="ident-photo">
      <Duo3 name={name} photo={!missing} />
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

export function AttribAlbum({ rec }: { rec: RecordRef }) {
  const caption = attributionCaption(rec.cover, 'Cover art')
  return (
    <a
      className="rec-tile"
      href={spotifyRecordUrl(rec.title, rec.primaryArtist)}
      target="_blank"
      rel="noreferrer"
    >
      <figure className="fig">
        <Duo3 name={rec.title} initials={false} photo={Boolean(rec.cover.url)} />
        <div className="rt">{rec.title}</div>
        <div className="rm">
          {[rec.primaryArtist, rec.label].filter(Boolean).join(' · ')}
        </div>
        {rec.releaseYear && (
          <div className="ry">&apos;{String(rec.releaseYear).slice(-2)}</div>
        )}
        {caption && <figcaption>{caption}</figcaption>}
      </figure>
    </a>
  )
}
