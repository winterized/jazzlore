// TypographicCover — the missing-cover fallback for record tiles (Records
// project, D5). ~25% of records (mostly the obscure long tail) have no Cover
// Art Archive image; rather than a flat blank surface, render a "typographic
// sleeve": a deterministic family-palette gradient with the record title set
// in the display serif. Every tile then reads as a record cover, art or not,
// so the strip keeps a consistent visual rhythm.
//
// Purely presentational. The gradient seed is the record id (stable across
// renders/sessions — the same record always gets the same sleeve, matching the
// Duo3 "deterministic palette per canonical id" contract). Doubles as the
// <img> onError fallback in AttribAlbum (a hotlink that 404s/blocks degrades
// here, never to a broken-image icon).

import type { CSSProperties } from 'react'
import { duotoneFor } from './duotone'

type Props = {
  title: string
  /** Deterministic gradient seed — the record id (falls back to the title). */
  seed?: string
}

export function TypographicCover({ title, seed }: Props) {
  const [lo, hi] = duotoneFor(seed ?? title)
  return (
    <div
      className="typo-cover"
      aria-hidden="true"
      style={
        {
          '--typo-lo': lo,
          '--typo-hi': hi,
        } as CSSProperties
      }
    >
      <span className="typo-cover-title">{title}</span>
    </div>
  )
}
