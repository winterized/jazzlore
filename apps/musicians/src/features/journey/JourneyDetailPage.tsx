// JourneyDetailPage — `/musicians/journey/era/:slug` and
//                      `/musicians/journey/label/:slug`.
//
// Renders one curated entry as a hero + grid. Re-uses .home-grid +
// .home-card classes from the home page so the visual language matches.
//
// Portrait loading: on mount, parallel-fetch each musician's detail via
// the data-source seam, then surface `portrait` + `photo` + the legal
// attribution caption (same Duo3 + attributionCaption pattern the home
// page uses). Until each fetch resolves, Duo3 falls back to the monogram
// — there's no layout shift since both the monogram and the photo share
// the same square frame. A failed fetch for one musician quietly stays
// on the monogram fallback (the rest still render).

import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import type { JourneyVariant } from './JourneyData'
import { ERA_DATA } from './data/eras'
import { LABEL_DATA } from './data/labels'
import {
  defaultSource,
  type DataSource,
  type MusicianDetailWithEra,
} from '../../hooks/useMusicianData'
import { isWaking } from '../../lib/types'
import { attributionCaption } from '../../lib/attribution'
import { Shell } from '../../components/Shell'
import { Duo3 } from '../../components/Duo3'
import { ChevronIcon } from '../../components/icons'
import { ThemeToggleButton } from '../../components/ThemeToggleButton'

/** First-row eager-loads its portraits so above-the-fold images don't
 * get lazy-deferred. Mirrors HomeView's EAGER_FIRST_ROW. The grid is
 * 1-col mobile → 2-col sm → 4-col lg, so 4 covers the largest first row. */
const EAGER_FIRST_ROW = 4

interface Props {
  variant: JourneyVariant
  /** BFF seam. Defaults to the production fetch source; tests inject
   *  `fixtureSource` so the portrait fetch resolves deterministically. */
  source?: DataSource
}

export function JourneyDetailPage({
  variant,
  source = defaultSource,
}: Props) {
  const { slug } = useParams<{ slug: string }>()
  const dataMap = variant === 'era' ? ERA_DATA : LABEL_DATA
  const entry = slug ? dataMap[slug] : undefined

  const [details, setDetails] = useState<
    Record<string, MusicianDetailWithEra>
  >({})

  useEffect(() => {
    if (!entry) return
    // Reset before fetching: ERA_DATA and LABEL_DATA legitimately share
    // musician ids (Miles, Coltrane, Monk appear in both an era and a
    // label entry). Without this reset, navigating from e.g. era/modal
    // to label/columbia would flash the modal-fetched portraits under
    // the columbia card layout for one paint before the new fetches
    // resolve. Clearing first makes every navigation start from
    // monogram and resolve up — same idiom + lint exemption as
    // useBffResource's `setState({kind:'loading'})` reset.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDetails({})
    let live = true
    void Promise.all(
      entry.musicians.map(async (m) => {
        try {
          const r = await source.detail(m.id)
          if (isWaking(r)) return null
          return [m.id, r] as const
        } catch {
          return null
        }
      }),
    ).then((results) => {
      if (!live) return
      const map: Record<string, MusicianDetailWithEra> = {}
      for (const r of results) if (r) map[r[0]] = r[1]
      setDetails(map)
    })
    return () => {
      live = false
    }
  }, [entry, source])

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
          {entry.musicians.map((m, i) => {
            const d = details[m.id]
            const caption = d?.portrait
              ? attributionCaption(d.portrait, 'Photo')
              : null
            return (
              <li key={m.id} className="home-card-li">
                <Link
                  className="home-card"
                  to={`/musicians/${encodeURIComponent(m.id)}`}
                >
                  <figure className="home-card-fig">
                    <Duo3
                      name={m.name}
                      photo={d?.photo}
                      portrait={d?.portrait}
                      eager={i < EAGER_FIRST_ROW}
                    />
                    {/* Always rendered so credited + uncredited cards
                       reserve identical footprints (CLS = 0). Empty
                       when no attribution is required. */}
                    <figcaption className="home-card-credit">
                      {caption}
                    </figcaption>
                  </figure>
                  <div className="body">
                    <div className="nm">{m.name}</div>
                    <div className="hook">{m.hook}</div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      </main>
    </Shell>
  )
}
