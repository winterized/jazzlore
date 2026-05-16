import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { StickyHeader, type RootOption, type ChipGroup } from '@jazzlore/ui'
import {
  DEFAULT_ROOTS,
  alternateSpelling,
  formatRoot,
  formatPrimarySymbol,
  isAmbiguous,
  prefersReducedMotion,
  rootFromSlug,
  slugFromRoot,
  type ChordDefinition,
} from '@jazzlore/music-core'
import { useTheme } from '../lib/useTheme'
import ChordRow from '../features/chords/ChordRow'
import { searchChords } from '../lib/searchChords'
import { CURATED_CHORDS } from '../data/curated'
import { CHORD_GROUPS } from '../data/chordGroups'

// Module-scope adapter: keeps packages/ui router-free while giving
// StickyHeader SPA-aware navigation. Identity is stable (not re-created per
// render), which prevents the util-link subtree from re-mounting unnecessarily.
const RouterLink = ({
  href,
  className,
  children,
}: {
  href: string
  className?: string
  children: ReactNode
}) => (
  <Link to={href} className={className}>
    {children}
  </Link>
)

// ─── Body section-divider header ──────────────────────────────────────────────
// Design spec: 11px / 600 / 0.1em uppercase, --jl-text-dim color,
// ::after 1px line. Implemented here as a flex row (label + hr-like span).

function SectionDivider({ label }: { label: string }) {
  return (
    <div
      className={[
        // layout: label + fill line
        'flex items-center gap-3',
        'px-[4px] pt-[18px] pb-[6px]',
      ].join(' ')}
    >
      <span
        className={[
          'shrink-0',
          'text-[11px] font-semibold tracking-[0.1em] uppercase',
          // WCAG 1.4.3 AA: stone-400/600 over the page bg measured
          // 2.36 (light) / 2.58 (dark) — well under 4.5. stone-600/300
          // clears AA while keeping the divider visually subdued.
          'text-stone-600 dark:text-stone-300',
        ].join(' ')}
      >
        {label}
      </span>
      {/* 1px divider line filling the rest of the row (::after equivalent) */}
      <span aria-hidden="true" className="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
    </div>
  )
}

// ─── ChordsPage ───────────────────────────────────────────────────────────────

export default function ChordsPage() {
  const { root: slug } = useParams<{ root: string }>()
  const navigate = useNavigate()
  const root = slug ? rootFromSlug(slug) : null
  const { theme, toggle } = useTheme()

  const options: readonly RootOption[] = useMemo(
    () =>
      DEFAULT_ROOTS.map((value) => {
        const alt = isAmbiguous(value) ? alternateSpelling(value) : null
        return {
          value,
          label: formatRoot(value),
          alternate: alt ? { value: alt, label: formatRoot(alt) } : undefined,
        }
      }),
    [],
  )

  // Per-root derived data. Memoised on [root] so a theme toggle (which
  // re-renders this page) doesn't rebuild the 27-entry map + chip groups,
  // and so the intent is self-documenting. Null branch is never consumed —
  // the component returns <Navigate> when root is null.
  const { rootDisplay, chordById, chipGroups } = useMemo<{
    rootDisplay: string
    chordById: Map<string, ChordDefinition>
    chipGroups: ChipGroup[]
  }>(() => {
    if (!root) return { rootDisplay: '', chordById: new Map(), chipGroups: [] }
    const rd = formatRoot(root)
    const map = new Map(CURATED_CHORDS.map((def) => [def.id, def]))
    // Chip id MUST equal the DOM id on the matching <li> wrapper (see render).
    const groups: ChipGroup[] = CHORD_GROUPS.map((group) => ({
      label: group.label,
      chips: group.chordIds.map((id) => {
        const def = map.get(id)
        return {
          id: `chord-${id}`,
          label: def ? formatPrimarySymbol(rd, def.primarySuffix) : id,
        }
      }),
    }))
    return { rootDisplay: rd, chordById: map, chipGroups: groups }
  }, [root])

  useEffect(() => {
    if (!root) return
    // Restore the previous title on unmount so a future ChordCollectionPage
    // (Phase 9) doesn't inherit the per-root title. Habit before scope.
    const previous = document.title
    document.title = `Chords on ${formatRoot(root)} — Jazzlore`
    return () => {
      document.title = previous
    }
  }, [root])

  // ── Header search ─────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('')
  const searchResults = useMemo(
    () => searchChords(searchQuery, rootDisplay),
    [searchQuery, rootDisplay],
  )
  // Chord cards are always mounted (no accordion) → scroll immediately; the
  // scroll-spy chip updates for free as the page scrolls.
  const handleSearchSelect = useCallback((domId: string) => {
    const el = document.getElementById(domId)
    if (!el) return
    el.scrollIntoView({
      behavior: prefersReducedMotion() ? 'instant' : 'smooth',
      block: 'start',
    })
  }, [])

  if (!root) return <Navigate to="/chords/C" replace />

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <StickyHeader
        title={`${rootDisplay} chords`}
        LinkComponent={RouterLink}
        utilLink={{ label: 'My chord collection', href: '/collection/chords' }}
        theme={theme}
        onThemeToggle={toggle}
        rootOptions={options}
        selectedRoot={root}
        onRootChange={(next) => navigate(`/chords/${slugFromRoot(next)}`)}
        chipGroups={chipGroups}
        chipNavLabel="Chord categories"
        // onChipActivate not needed — chords app has no accordions to expand
        searchResults={searchResults}
        onSearchQueryChange={setSearchQuery}
        onSearchSelect={handleSearchSelect}
        searchLabel="Search chords"
        searchPlaceholder="Search chords…"
      />

      <main className="min-h-screen bg-stone-100 px-[14px] pt-4 pb-[80px] text-stone-900 md:px-[20px] md:pt-6 dark:bg-stone-950 dark:text-stone-100">
        {CHORD_GROUPS.map((group) => (
          <section key={group.label} aria-label={group.label}>
            <SectionDivider label={group.label} />
            {/* Per-group grid: 1 col, → 2 cols at xl (1280px). Each group is
                its own grid so it starts a new row, the divider above spans
                full width, and an odd count leaves one trailing empty cell
                (align-items:start — no fill/stretch, by design). 1-col grid
                with the same gap is byte-identical to the prior flex-col. The
                .chord-card-grid hook + inGrid prop make each half-width card at
                ≥1280 render the 480–767 compact layout (see index.css). */}
            <ul className="chord-card-grid grid grid-cols-1 gap-[8px] md:gap-[10px] xl:grid-cols-2">
              {group.chordIds.map((id) => {
                const def = chordById.get(id)
                if (!def) return null
                return (
                  <li
                    key={id}
                    // id matches chip.id in chipGroups above — scroll-spy anchor
                    id={`chord-${id}`}
                    // scroll-margin-top so chip click-jump lands below the sticky header:
                    // 140px mobile / 220px desktop
                    className="scroll-mt-[140px] md:scroll-mt-[220px]"
                  >
                    <ChordRow rootNote={rootDisplay} definition={def} inGrid />
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </main>
    </>
  )
}
