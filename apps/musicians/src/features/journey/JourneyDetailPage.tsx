// JourneyDetailPage — `/musicians/journey/era/:slug` and
//                      `/musicians/journey/label/:slug`.
//
// Renders one curated entry as a hero + grid. Re-uses .home-grid +
// .home-card classes from the home page so the visual language matches.
// Per the brainstorm decision, the cards intentionally do NOT load real
// portraits (Duo3 falls back to its monogram view); enriching with
// portraits is a follow-up that requires a BFF /api/musicians/by-ids
// batch endpoint.

import { useMemo } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import type { JourneyVariant } from './JourneyData'
import { ERA_DATA } from './data/eras'
import { LABEL_DATA } from './data/labels'
import { Shell } from '../../components/Shell'
import { Duo3 } from '../../components/Duo3'
import { ChevronIcon } from '../../components/icons'
import { ThemeToggleButton } from '../../components/ThemeToggleButton'

interface Props {
  variant: JourneyVariant
}

export function JourneyDetailPage({ variant }: Props) {
  const { slug } = useParams<{ slug: string }>()
  const dataMap = variant === 'era' ? ERA_DATA : LABEL_DATA
  const entry = useMemo(
    () => (slug ? dataMap[slug] : undefined),
    [dataMap, slug],
  )

  if (!entry) {
    // Unknown slug — bounce back to the index page (which is more useful
    // than the root, since the user was already in a journey context).
    return <Navigate to={`/musicians/journey/${variant}`} replace />
  }

  return (
    <Shell>
      <header className="hdr">
        <div className="hdr-row">
          <Link
            to={`/musicians/journey/${variant}`}
            className="ic ic-back"
            aria-label={`Back to ${variant === 'era' ? 'eras' : 'labels'}`}
          >
            <ChevronIcon />
          </Link>
          <div className="crumb">{entry.name}</div>
          <div className="spacer" />
          <ThemeToggleButton />
        </div>
      </header>

      <main>
        <section
          className="journey-hero"
          aria-labelledby={`journey-detail-${entry.slug}-h1`}
        >
          <div className="kicker">{entry.kicker}</div>
          <h1 id={`journey-detail-${entry.slug}-h1`}>
            <span aria-hidden="true" className="journey-h1-icon">
              {entry.icon}
            </span>{' '}
            {entry.h1}
          </h1>
          <p className="sub">{entry.subtitle}</p>
        </section>

        <div className="home-12-h">
          <h2 className="lab" id={`journey-detail-${entry.slug}-h2`}>
            {entry.musicians.length} to dig into
          </h2>
          <span className="ct">
            {variant === 'era' ? 'ERA · ' : 'LABEL · '}
            {entry.musicians.length}
          </span>
        </div>

        <ul
          className="home-grid"
          aria-labelledby={`journey-detail-${entry.slug}-h2`}
        >
          {entry.musicians.map((m) => (
            <li key={m.id} className="home-card-li">
              <Link
                className="home-card"
                to={`/musicians/${encodeURIComponent(m.id)}`}
              >
                <figure className="home-card-fig">
                  <Duo3 name={m.name} />
                  <figcaption className="home-card-credit"></figcaption>
                </figure>
                <div className="body">
                  <div className="nm">{m.name}</div>
                  <div className="hook">{m.hook}</div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </Shell>
  )
}
