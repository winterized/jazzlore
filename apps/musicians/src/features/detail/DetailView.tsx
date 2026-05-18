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
import { useLocation, useNavigate } from 'react-router'
import type { MusicianDetail } from '../../lib/types'
import { Shell } from '../../components/Shell'
import { MosaicV4 } from '../../components/MosaicV4'
import { EraStrip, type EraItem } from '../../components/EraStrip'
import { RecordsStrip } from '../../components/RecordsStrip'
import { ChevronIcon, SearchIcon } from '../../components/icons'
import { ThemeToggleButton } from '../../components/ThemeToggleButton'
import { DetailIdentity } from './DetailIdentity'
import { CollaboratorRail } from './CollaboratorRail'
import { MoreAboutSheet } from './MoreAboutSheet'
import { useMosaicScrollPulse } from '../../hooks/useMosaicScrollPulse'

/** Split the frozen `bioSummary` into display paragraphs. The contract froze
 * only `bioSummary` (no `bioFull`); the sheet shows the summary, the page may
 * pass richer paragraphs once the BFF supplies them. */
function bioParagraphs(d: MusicianDetail, extra?: string[]): string[] {
  if (extra && extra.length > 0) return extra
  if (!d.bioSummary) return []
  return d.bioSummary
    .split(/(?<=\.)\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter(Boolean)
}

type Props = {
  detail: MusicianDetail
  /** BFF-flagged suspected duplicate (renders the Antoine UI flag). NOT a
   * dedup — landmine 11. */
  duplicate?: boolean
  /** Editorial "same era" contemporaries (Phase C supplies; absent → the
   * strip hides itself). Era taxonomy is intentionally NOT in the frozen
   * contract. */
  sameEra?: EraItem[]
  /** Richer long-form bio paragraphs for the "More about" sheet, when the
   * BFF supplies them. Falls back to splitting `bioSummary`. */
  bioFull?: string[]
}

export function DetailView({
  detail,
  duplicate = false,
  sameEra = [],
  bioFull,
}: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const railRef = useRef<HTMLDivElement>(null)
  const [pulseId, setPulseId] = useState<string | null>(null)
  const onMosaicTap = useMosaicScrollPulse(railRef, setPulseId)

  const goToMusician = (id: string): void => {
    void navigate(`/musicians/${encodeURIComponent(id)}`)
  }
  const firstName = detail.name.split(' ')[0] ?? detail.name

  // The "More about" sheet is the `#about` hash on this route (locked
  // decision 3): link-addressable, Back closes it (history). Closing pops
  // the hash so browser Back and the in-app close are the same operation.
  const sheetOpen = location.hash === '#about'
  const closeSheet = (): void => {
    void navigate(-1)
  }
  const paras = bioParagraphs(detail, bioFull)

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

      {sheetOpen && paras.length > 0 && (
        <MoreAboutSheet
          name={detail.name}
          paragraphs={paras}
          attribution="Bio · Jazzlore staff, drawn from Wikipedia & MusicBrainz."
          onClose={closeSheet}
        />
      )}
    </Shell>
  )
}
