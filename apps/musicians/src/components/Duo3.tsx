// Duo3 — the deterministic duotone tile primitive (design `Duo3`).
//
// Renders a colour-stable placeholder for a musician / record. `initials`
// defaults true (musician tiles); record-art tiles pass `initials={false}`.
// `photo: false` is DATA (frozen mapper derives it from `picture_url`
// presence, landmine 10) — when false the gradient collapses to a flat
// `--card` surface and the initials lift to centered/bold (design "Mosaic ·
// the orbit" fallback). Purely presentational.
//
// Phase H — hero portrait photos: hero call-sites (the 12 home curated cards
// + the detail identity portrait) opt into a REAL <img> by passing a
// non-empty `portrait.url`. The photo renders inside the SAME fixed-size box
// (CLS = 0 — the layout box is identical whether photo or monogram), in the
// pass-5 duotone treatment by default; on the focusable card/figure's
// `:hover` / `:focus-visible` it transitions to full natural colour
// (reduced-motion → instant, see components.css). An `onError` (Wikimedia
// 404 / redirect / hotlink-block) silently falls back to the monogram —
// never a broken-image icon. The non-hero call-sites pass no `portrait`, so
// their render is byte-behaviour-unchanged.

import type { CSSProperties, ReactNode } from 'react'
import { useState } from 'react'
import type { ImageAttribution } from '../lib/types'
import { duotoneFor, initialsOf } from './duotone'

type Props = {
  name: string
  /** Show the initials overlay (musician tiles). False for record art. */
  initials?: boolean
  /** Data-driven: `false` → flat surface + centered initials. Default true. */
  photo?: boolean
  /** Hero opt-in: a real portrait. Rendered as a duotone <img> only when
   * `url` is non-empty (and `photo` is not false). Omit at non-hero
   * call-sites — they stay byte-behaviour-unchanged. */
  portrait?: ImageAttribution
  /** Eager-load the <img> (first home row / the detail hero, so LCP is not
   * harmed by lazy-loading the above-the-fold portrait). Default lazy. */
  eager?: boolean
  className?: string
  style?: CSSProperties
  children?: ReactNode
  'data-testid'?: string
}

export function Duo3({
  name,
  initials = true,
  photo = true,
  portrait,
  eager = false,
  className = '',
  style,
  children,
  'data-testid': testId,
}: Props) {
  const [lo, hi] = duotoneFor(name)
  // A Wikimedia 404 / redirect / hotlink-block flips this → graceful monogram.
  const [imgFailed, setImgFailed] = useState(false)
  const url = portrait?.url?.trim()
  const showPhoto = photo && !!url && !imgFailed
  const cls = ['duo3', photo ? '' : 'flat', showPhoto ? 'has-photo' : '', className]
    .filter(Boolean)
    .join(' ')
  return (
    <div
      className={cls}
      data-testid={testId}
      style={
        {
          '--duo-lo': lo,
          '--duo-hi': hi,
          ...style,
        } as CSSProperties
      }
    >
      {showPhoto && (
        <img
          className="duo3-photo"
          src={url}
          alt={name}
          decoding="async"
          loading={eager ? 'eager' : 'lazy'}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
        />
      )}
      {initials && (
        <span className="duo3-initials" aria-hidden="true">
          {initialsOf(name)}
        </span>
      )}
      {children}
    </div>
  )
}
