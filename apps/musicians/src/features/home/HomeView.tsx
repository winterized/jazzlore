// HomeView — the home screen (design `MobileHome`, pass-5 voice).
//
// hero invitation · visible ≥16px search · "Start a journey" row · curated-12
// grid (1-col mobile → 2-col sm → 4-col lg, via components.css media queries).
// The search is a slot: D2 ships an accessible search input that navigates on
// submit; D6 injects the full WAI-ARIA autosuggest combobox here without
// restructuring (frozen-contract seam, no churn).

import type { ReactNode } from 'react'
import { Link } from 'react-router'
import type { CuratedCard } from '../../lib/types'
import { Shell } from '../../components/Shell'
import { Duo3 } from '../../components/Duo3'
import { ThemeToggleButton } from '../../components/ThemeToggleButton'
import { HomeSearchInput } from './HomeSearchInput'

type Props = {
  curated: CuratedCard[]
  /** D6 injects the autosuggest combobox here; defaults to a plain
   * accessible search input that routes on submit. */
  searchSlot?: ReactNode
}

const JOURNEYS = [
  { icon: '⚄', label: 'Random jump', blurb: 'Drop into any musician in the graph' },
  { icon: '≡', label: 'Era walk', blurb: 'Step through a decade of jazz' },
  { icon: '⌘', label: 'Label walk', blurb: 'Follow a label across its golden years' },
] as const

export function HomeView({ curated, searchSlot }: Props) {
  return (
    <Shell>
      <header className="hdr">
        <div className="hdr-row">
          <div className="brand">
            Jazz<b>lore</b> · Musicians
          </div>
          <div className="spacer" />
          <ThemeToggleButton />
        </div>
      </header>

      <main>
        <section className="home-hero" aria-labelledby="home-h1">
          <div className="kicker">— A graph database, edited like a museum guide.</div>
          <h1 id="home-h1">
            Step into a musician. <em>Follow whoever they played with.</em>
          </h1>
          <p className="sub">
            Twelve carefully-chosen starting points. Or, if you&rsquo;d rather
            be led, three ways to wander.
          </p>
        </section>

        <div className="home-search">{searchSlot ?? <HomeSearchInput />}</div>

        <h2 className="home-journeys-h">Start a journey</h2>
        <div className="journeys">
          {JOURNEYS.map((j) => (
            <button type="button" className="journey" key={j.label}>
              <div className="icn" aria-hidden="true">
                {j.icon}
              </div>
              <div className="lab">{j.label}</div>
              <div className="blb">{j.blurb}</div>
            </button>
          ))}
        </div>

        <div className="home-12-h">
          <h2 className="lab" id="home-curated-h">
            Twelve to begin with
          </h2>
          <span className="ct">CURATED · {curated.length}</span>
        </div>
        <ul className="home-grid" aria-labelledby="home-curated-h">
          {curated.map((m) => (
            <li key={m.id} className="home-card-li">
              <Link
                className="home-card"
                to={`/musicians/${encodeURIComponent(m.id)}`}
              >
                <Duo3 name={m.name} photo={m.photo} />
                <div className="body">
                  <div className="nm">{m.name}</div>
                  {m.subtitle && <div className="ml">{m.subtitle}</div>}
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
