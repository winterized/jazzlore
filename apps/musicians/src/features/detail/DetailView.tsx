// DetailView — the mobile musician detail screen (design `MobileDetailV5`).
//
// Composition (locked, same at every data density):
//   header → identity → bio → listen → orbit mosaic → "Where to go from
//   here" (16 headliners + expansion CTA / tail-marker) → "From the same
//   era" → "Records they shaped" → attribution footer.
//
// Sparse-faithful (no bio / no portrait → explicit placeholders, never
// silent) and the user-facing duplicate flag (Antoine design) are handled in
// DetailIdentity. D4 wires the mosaic→rail scroll+pulse; D5 the #about
// sheet — both plug into the slots/props here without restructuring.

import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import type { MusicianDetail } from '../../lib/types'
import { Shell } from '../../components/Shell'
import { MosaicV4 } from '../../components/MosaicV4'
import { EraStrip, type EraItem } from '../../components/EraStrip'
import { RecordsStrip } from '../../components/RecordsStrip'
import { ChevronIcon, SearchIcon } from '../../components/icons'
import { ThemeToggleButton } from '../../components/ThemeToggleButton'
import { DetailIdentity } from './DetailIdentity'
import { CollaboratorRail } from './CollaboratorRail'
import { useMosaicScrollPulse } from '../../hooks/useMosaicScrollPulse'

type Props = {
  detail: MusicianDetail
  /** BFF-flagged suspected duplicate (renders the Antoine UI flag). NOT a
   * dedup — landmine 11. */
  duplicate?: boolean
  /** Editorial "same era" contemporaries (Phase C supplies; absent → the
   * strip hides itself). Era taxonomy is intentionally NOT in the frozen
   * contract. */
  sameEra?: EraItem[]
}

export function DetailView({ detail, duplicate = false, sameEra = [] }: Props) {
  const navigate = useNavigate()
  const railRef = useRef<HTMLDivElement>(null)
  const [pulseId, setPulseId] = useState<string | null>(null)
  const onMosaicTap = useMosaicScrollPulse(railRef, setPulseId)

  const goToMusician = (id: string): void => {
    void navigate(`/musicians/${encodeURIComponent(id)}`)
  }
  const firstName = detail.name.split(' ')[0] ?? detail.name

  return (
    <Shell>
      <header className="hdr">
        <div className="hdr-row">
          <button
            type="button"
            className="ic ic-back"
            aria-label="Back"
            onClick={() => navigate(-1)}
          >
            <ChevronIcon />
          </button>
          <div className="crumb">{detail.name}</div>
          <div className="spacer" />
          <button
            type="button"
            className="ic"
            aria-label="Search"
            onClick={() => navigate('/musicians')}
          >
            <SearchIcon />
          </button>
          <ThemeToggleButton />
        </div>
      </header>

      <main>
        <DetailIdentity d={detail} duplicate={duplicate} />

        <div className="mosaic-h">
          <span>Orbit · who they played with most</span>
          <span className="legend">
            <span className="dot" aria-hidden="true" /> size = records ·
            initials = name
          </span>
        </div>
        <MosaicV4
          collabs={detail.collaborators}
          hero={detail.collaborators.length > 1}
          sparse={detail.collaborators.length <= 2}
          onTap={onMosaicTap}
        />

        <CollaboratorRail
          collaborators={detail.collaborators}
          firstName={firstName}
          pulseId={pulseId}
          onActivate={goToMusician}
          railRef={railRef}
        />

        <EraStrip items={sameEra} onActivate={goToMusician} />

        <RecordsStrip records={detail.records} />

        <footer
          style={{
            padding: '18px 14px 32px',
            fontFamily: 'var(--font-mono)',
            fontSize: 9.5,
            color: 'var(--dim)',
            letterSpacing: '0.06em',
            lineHeight: 1.55,
          }}
        >
          Portraits · attribution rendered per-image where licensed. Source ·
          Jazzlore graph.
        </footer>
      </main>
    </Shell>
  )
}
