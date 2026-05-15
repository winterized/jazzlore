import { useEffect, useMemo, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { StickyHeader, type RootOption, type ChipGroup } from '@jazzlore/ui'
import {
  DEFAULT_ROOTS,
  alternateSpelling,
  formatRoot,
  formatPrimarySymbol,
  isAmbiguous,
  rootFromSlug,
  slugFromRoot,
  type ChordDefinition,
} from '@jazzlore/music-core'
import { useTheme } from '../lib/useTheme'
import ChordRow from '../features/chords/ChordRow'
import { CURATED_CHORDS } from '../data/curated'
import { CHORD_GROUPS } from '../data/chordGroups'

// ─── Router-aware link adapter ────────────────────────────────────────────────
// StickyHeader lives in packages/ui which is router-free. This thin adapter
// wires react-router's <Link> so SPA navigation is preserved.

function RouterLink({
  href,
  className,
  children,
}: {
  href: string
  className?: string
  children: ReactNode
}) {
  return (
    <Link to={href} className={className}>
      {children}
    </Link>
  )
}

// ─── Body section-divider header ──────────────────────────────────────────────
// Design spec: 11px / 600 / 0.1em uppercase, --jl-text-dim color,
// ::after 1px line. Implemented here as a flex row (label + hr-like span).

function SectionDivider({ label }: { label: string }) {
  return (
    <div
      className={[
        // layout: label + fill line
        'flex items-center gap-3',
        'pt-[18px] pb-[6px] px-[4px]',
      ].join(' ')}
    >
      <span
        className={[
          'shrink-0',
          'text-[11px] font-semibold uppercase tracking-[0.1em]',
          'text-stone-400 dark:text-stone-600',
        ].join(' ')}
      >
        {label}
      </span>
      {/* 1px divider line filling the rest of the row (::after equivalent) */}
      <span
        aria-hidden="true"
        className="flex-1 h-px bg-stone-200 dark:bg-stone-800"
      />
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
      />

      <main className="min-h-screen bg-stone-100 px-[14px] pb-[80px] pt-4 text-stone-900 dark:bg-stone-950 dark:text-stone-100 md:px-[20px] md:pt-6">
        {CHORD_GROUPS.map((group) => (
          <section key={group.label} aria-label={group.label}>
            <SectionDivider label={group.label} />
            <ul className="flex flex-col gap-[8px] md:gap-[10px]">
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
                    <ChordRow rootNote={rootDisplay} definition={def} />
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
