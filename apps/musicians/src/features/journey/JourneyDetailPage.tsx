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
  type MusicianMinimal,
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

  const [portraits, setPortraits] = useState<Record<string, MusicianMinimal>>(
    {},
  )

  useEffect(() => {
    if (!entry) return
    // Reset before fetching: ERA_DATA and LABEL_DATA legitimately share
    // musician ids (Miles, Coltrane, Monk appear in both an era and a
    // label entry). Without this reset, navigating from e.g. era/modal
    // to label/columbia would flash the modal-fetched portraits under
    // the columbia card layout for one paint before the new fetches
    // resolve. Clearing first makes every navigation start from monogram
    // and resolve up — setState-in-effect is the documented legitimate
    // exemption here (a route param changed, the prior render's data must
    // not flash). The render-time reset pattern used in useBffResource
    // is overkill here since portraits are non-load-bearing UX polish.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPortraits({})
    let live = true
    const ids = entry.musicians.map((m) => m.id)
    void source.byIds(ids).then((r) => {
      if (!live) return
      if (isWaking(r)) return
      const map: Record<string, MusicianMinimal> = {}
      for (const item of r.items) map[item.id] = item
      setPortraits(map)
    }).catch(() => {
      // Best-effort: a failed byIds call quietly keeps monogram fallbacks.
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
            const p = portraits[m.id]
            const caption = p?.portrait
              ? attributionCaption(p.portrait, 'Photo')
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
                      photo={p?.photo}
                      portrait={p?.portrait}
                      eager={i < EAGER_FIRST_ROW}
                      /* Journey-entry items don't carry an instrument
                       * field. Pass `inst={null}` to flag this as a
                       * MUSICIAN caller (not a record cover) so a
                       * no-photo entry surfaces the dignified rest
                       * figure rather than the bare-monogram fallback. */
                      inst={null}
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
