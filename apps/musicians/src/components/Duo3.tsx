// Duo3 — the deterministic duotone tile primitive (design `Duo3`).
//
// Renders a colour-stable placeholder for a musician / record. `initials`
// defaults true (musician tiles); record-art tiles pass `initials={false}`.
// `photo: false` is DATA (frozen mapper derives it from `picture_url`
// presence, landmine 10) — when false the gradient collapses to a flat
// `--card` surface and the initials lift to centered/bold (design "Mosaic ·
// the orbit" fallback). Purely presentational.

import type { CSSProperties, ReactNode } from 'react'
import { duotoneFor, initialsOf } from './duotone'

type Props = {
  name: string
  /** Show the initials overlay (musician tiles). False for record art. */
  initials?: boolean
  /** Data-driven: `false` → flat surface + centered initials. Default true. */
  photo?: boolean
  className?: string
  style?: CSSProperties
  children?: ReactNode
  'data-testid'?: string
}

export function Duo3({
  name,
  initials = true,
  photo = true,
  className = '',
  style,
  children,
  'data-testid': testId,
}: Props) {
  const [lo, hi] = duotoneFor(name)
  const cls = ['duo3', photo ? '' : 'flat', className].filter(Boolean).join(' ')
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
      {initials && (
        <span className="duo3-initials" aria-hidden="true">
          {initialsOf(name)}
        </span>
      )}
      {children}
    </div>
  )
}
