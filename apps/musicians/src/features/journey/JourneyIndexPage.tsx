// JourneyIndexPage — `/musicians/journey/era` and `/musicians/journey/label`.
//
// A picker grid showing the 7 eras (chronological) or 6 labels (founding
// year). Each chip links to /musicians/journey/{variant}/{slug}, which
// renders the curated grid via JourneyDetailPage.
//
// Layout: re-uses the home `.kicker`/`.hdr` shell + an unordered list of
// `.journey-picker-chip` items. CSS in components.css sets the grid
// breakpoints — 2-col mobile, 3-col tablet, 4-col desktop (eras only
// fits 7 across 2 rows on the widest layout; labels at 6 fits 2×3).

import { useMemo } from 'react'
import { Link } from 'react-router'
import type { JourneyVariant } from './JourneyData'
import { ERA_DATA } from './data/eras'
import { LABEL_DATA } from './data/labels'
import { Shell } from '../../components/Shell'
import { ChevronIcon } from '../../components/icons'
import { ThemeToggleButton } from '../../components/ThemeToggleButton'

const TITLES = {
  era: {
    kicker: '— SEVEN ERAS · A QUICK MAP OF THE 20TH CENTURY',
    h1: 'Step through a decade of jazz.',
    sub: 'Pick an era and meet the musicians who defined it.',
  },
  label: {
    kicker: '— SIX LABELS · THE BRICK-AND-MORTAR OF THE MUSIC',
    h1: 'Follow a label across its golden years.',
    sub: 'Pick a house and meet its roster at its peak.',
  },
} as const

interface Props {
  variant: JourneyVariant
}

export function JourneyIndexPage({ variant }: Props) {
  const entries = useMemo(
    () => Object.values(variant === 'era' ? ERA_DATA : LABEL_DATA),
    [variant],
  )
  const t = TITLES[variant]

  return (
    <Shell>
      <header className="hdr">
        <div className="hdr-row">
          <Link
            to="/musicians"
            className="ic ic-back"
            aria-label="Back to home"
          >
            <ChevronIcon />
          </Link>
          <div className="brand">
            Jazz<b>lore</b> · Musicians
          </div>
          <div className="spacer" />
          <ThemeToggleButton />
        </div>
      </header>

      <main>
        <section
          className="journey-hero"
          aria-labelledby={`journey-${variant}-h1`}
        >
          <div className="kicker">{t.kicker}</div>
          <h1 id={`journey-${variant}-h1`}>{t.h1}</h1>
          <p className="sub">{t.sub}</p>
        </section>

        <ul
          className="journey-picker"
          aria-label={
            variant === 'era' ? 'Jazz eras' : 'Jazz labels'
          }
        >
          {entries.map((e) => (
            // Explicit role="listitem" because the chip's <li> uses
            // `display: contents` to participate directly in the parent
            // grid. Pre-2023 WebKit/Chromium/Firefox dropped the
            // listitem role under `display: contents`; current engines
            // restore it, but the explicit role is a cheap a11y
            // belt-and-suspenders.
            <li key={e.slug} role="listitem">
              <Link
                to={`/musicians/journey/${variant}/${e.slug}`}
                className="journey-picker-chip"
              >
                <div className="icn" aria-hidden="true">
                  {e.icon}
                </div>
                <div className="lab">{e.name}</div>
                <div className="blb">{e.subtitle}</div>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </Shell>
  )
}
