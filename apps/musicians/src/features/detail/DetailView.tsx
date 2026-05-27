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

import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import type { MusicianDetail } from '../../lib/types'
import { isWaking } from '../../lib/types'
import {
  defaultSource,
  type DataSource,
  type MusicianMinimal,
} from '../../hooks/useMusicianData'
import { Shell } from '../../components/Shell'
import { MosaicV4 } from '../../components/MosaicV4'
import { EraStrip, type EraItem } from '../../components/EraStrip'
import { RecordsStrip } from '../../components/RecordsStrip'
import { ChevronIcon, SearchIcon } from '../../components/icons'
import { ThemeToggleButton } from '../../components/ThemeToggleButton'
import { DetailIdentity } from './DetailIdentity'
import { CollaboratorRail, HEADLINER_CAP } from './CollaboratorRail'
import { MoreAboutSheet } from './MoreAboutSheet'
import { SharedRecordsSheet } from './SharedRecordsSheet'
import { useTailPortraits } from './useTailPortraits'
import { useMosaicScrollPulse } from '../../hooks/useMosaicScrollPulse'
import { useIsDesktop } from '../../hooks/useIsDesktop'
import { GraphPanelSlot } from '../graph/GraphPanelSlot'

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
  /** BFF seam for the desktop graph slot. Defaults to the real fetch-backed
   * source; tests inject the fixture source. */
  source?: DataSource
}

export function DetailView({
  detail,
  duplicate = false,
  sameEra = [],
  bioFull,
  source = defaultSource,
}: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const railRef = useRef<HTMLDivElement>(null)
  const [pulseId, setPulseId] = useState<string | null>(null)
  const onMosaicTap = useMosaicScrollPulse(railRef, setPulseId)
  // Holds the collab id whose "+N more" the user clicked, NULL when no
  // sheet is open. Owned here (not inside CollaboratorRail/ConnRow) so the
  // SharedRecordsSheet portals at the page level — same idiom as
  // MoreAboutSheet's `#about` hash, minus the URL plumbing (the "+N more"
  // sheet is an in-page disclosure, not deep-linkable).
  const [sharedRecordsCollabId, setSharedRecordsCollabId] = useState<string | null>(null)
  // Desktop enrichment only: the graph (and its heavy lazy d3-force chunk)
  // is never even requested on phones — the mobile detail screen IS the
  // product (CLAUDE.md "desktop adds the graph panel").
  const isDesktop = useIsDesktop()

  /** Portraits keyed by collaborator id, fetched via the batch byIds endpoint.
   * Populated asynchronously after the detail renders; collaborators without a
   * resolved portrait keep their monogram fallback. */
  const [collabPortraits, setCollabPortraits] = useState<
    Record<string, MusicianMinimal>
  >({})

  useEffect(() => {
    // Cover the UNION of the two consumers: MosaicV4 (TILE_CAP=14) and
    // CollaboratorRail headliners (HEADLINER_CAP=16). max(14, 16) = 16.
    // Tail rows beyond the headliner section are text-only and don't
    // need portraits. Must stay ≤ BY_IDS_CAP (20) in the worker — sending
    // 24 returned HTTP 400 'too-many-ids' (observed on prod Curtis Fuller).
    const ids = detail.collaborators.slice(0, 16).map((c) => c.id)
    if (ids.length === 0) return
    let live = true
    void source.byIds(ids).then((r) => {
      if (!live) return
      if (isWaking(r)) return
      const map: Record<string, MusicianMinimal> = {}
      for (const item of r.items) map[item.id] = item
      setCollabPortraits(map)
    }).catch(() => {
      // Best-effort: a failed byIds quietly keeps monogram fallbacks.
    })
    return () => {
      live = false
    }
    // Re-run when the focus musician changes (navigating between detail pages).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail.id, source])

  // Tail-photo enrichment (issue #85). The hook owns the per-chunk
  // request set + the `byIds` calls; CollaboratorRail fires the
  // observer-driven prefetch signals.
  const { requestTailChunk } = useTailPortraits(
    detail,
    source,
    collabPortraits,
    setCollabPortraits,
    HEADLINER_CAP,
  )

  const goToMusician = (id: string): void => {
    void navigate(`/musicians/${encodeURIComponent(id)}`)
  }
  const firstName = detail.name.split(' ')[0] ?? detail.name

  // The "More about" sheet is the `#about` hash on this route (locked
  // decision 3): link-addressable, Back closes it (history).
  //
  // Close is hash-aware. When `#about` was pushed in-app (the disclosure
  // `<a href="#about">` adds a history entry) there is a prior entry, so
  // `navigate(-1)` keeps browser-Back and the in-app close symmetric.
  // But a direct/bookmarked/reloaded `…/musicians/<id>#about` is the FIRST
  // history entry — React Router stamps it `key === 'default'` — and a
  // `navigate(-1)` there pops AWAY from the detail page entirely (the
  // link-addressable promise broken). In that case replace the hash so a
  // deep-linked sheet closes to its OWN detail page.
  const sheetOpen = location.hash === '#about'
  const isDeepLink = location.key === 'default'
  const closeSheet = (): void => {
    if (isDeepLink) {
      void navigate({ hash: '' }, { replace: true })
    } else {
      void navigate(-1)
    }
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

      <div className="desk-detail">
       <main className="desk-rail">
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
          portraits={collabPortraits}
        />

        <CollaboratorRail
          collaborators={detail.collaborators}
          firstName={firstName}
          pulseId={pulseId}
          onActivate={goToMusician}
          onShowSharedRecords={setSharedRecordsCollabId}
          railRef={railRef}
          portraits={collabPortraits}
          onExpand={() => {
            // Prefetch chunks 0 AND 1 immediately on expand so rows 1–16
            // load with photos AND rows 17–32 are already on the wire
            // before the user scrolls into them.
            requestTailChunk(0)
            requestTailChunk(1)
          }}
          onTailChunkReached={(idx) => {
            // The user just reached chunk `idx`; prefetch chunk `idx + 1`
            // so the next screenful's photos are present before the user
            // scrolls to them. `requestedChunks` dedup makes repeated
            // firings safe.
            requestTailChunk(idx + 1)
          }}
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

       {isDesktop && (
         <aside
           className="desk-graph"
           aria-label={`Collaboration graph for ${detail.name}`}
         >
           <GraphPanelSlot
             focusId={detail.id}
             name={detail.name}
             source={source}
           />
         </aside>
       )}
      </div>

      {sheetOpen && paras.length > 0 && (
        <MoreAboutSheet
          name={detail.name}
          paragraphs={paras}
          attribution="Bio · Jazzlore staff, drawn from Wikipedia & MusicBrainz."
          onClose={closeSheet}
        />
      )}
      {sharedRecordsCollabId !== null && (
        <SharedRecordsSheet
          focusId={detail.id}
          collabId={sharedRecordsCollabId}
          collabName={
            detail.collaborators.find((c) => c.id === sharedRecordsCollabId)
              ?.name ?? ''
          }
          source={source}
          onClose={() => setSharedRecordsCollabId(null)}
        />
      )}
    </Shell>
  )
}
