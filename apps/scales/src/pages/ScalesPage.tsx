import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { StickyHeader, type ChipGroup, type RootOption } from '@jazzlore/ui'
import ScaleList, { type GroupId } from '../features/scales/ScaleList'
import { CURATED_SCALES, GROUPS } from '../features/scales/data/curated'
import {
  DEFAULT_ROOTS,
  alternateSpelling,
  formatRoot,
  isAmbiguous,
  prefersReducedMotion,
  rootFromSlug,
  slugFromRoot,
} from '@jazzlore/music-core'
import { searchScales } from '../lib/searchScales'
import { useTheme } from '../lib/useTheme'

// Module-scope adapter: keeps packages/ui router-free while giving
// StickyHeader SPA-aware navigation. Identity is stable (not re-created per
// render), which prevents the chip row from re-mounting unnecessarily.
const RouterLink = ({
  href,
  className,
  children,
}: {
  href: string
  className?: string
  children: React.ReactNode
}) => (
  <Link to={href} className={className}>
    {children}
  </Link>
)

// Initial expanded state derived from GROUPS — computed once outside the
// component so it does not trigger memo-churn on every render.
const initialExpanded = Object.fromEntries(
  GROUPS.map((g) => [g.id, g.defaultExpanded]),
) as Record<GroupId, boolean>

export default function ScalesPage() {
  const { root: slug } = useParams<{ root: string }>()
  const navigate = useNavigate()
  const root = slug ? rootFromSlug(slug) : null
  const { theme, toggle } = useTheme()

  const [expanded, setExpanded] = useState<Record<GroupId, boolean>>(initialExpanded)

  const handleExpandedChange = useCallback((groupId: GroupId, next: boolean) => {
    setExpanded((prev) => ({ ...prev, [groupId]: next }))
  }, [])

  const rootOptions: readonly RootOption[] = useMemo(
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

  // Single unlabelled chip group — StickyHeader omits empty group labels.
  // The chip shows the short form (g.chip, e.g. "m7♭5"); the section header
  // carries the full label.
  const chipGroups: ChipGroup[] = useMemo(
    () => [
      {
        label: '',
        chips: GROUPS.map((g) => ({ id: `group-${g.id}`, label: g.chip })),
      },
    ],
    [],
  )

  const handleChipActivate = useCallback((chipId: string) => {
    // chipId is "group-<groupId>" — strip the prefix to get the groupId.
    const groupId = chipId.replace(/^group-/, '') as GroupId
    // Expand-only: if already open, stay open (no toggle-off per handoff).
    // Functional update form — no closure over `expanded`, so deps array is [].
    setExpanded((prev) => (prev[groupId] ? prev : { ...prev, [groupId]: true }))
  }, [])

  // ── Header search ─────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('')
  const searchResults = useMemo(() => searchScales(searchQuery), [searchQuery])

  // `scale-<id>` → its group, so a search hit can expand the (maybe collapsed)
  // accordion before we scroll to the row.
  const scaleGroup = useMemo(
    () => new Map(CURATED_SCALES.map((s) => [`scale-${s.id}`, s.group])),
    [],
  )

  // Pending scroll target lives in a ref (no setState in the effect); a tick
  // bumped from the handler (an event — lint-clean) drives the effect, and so
  // does `expanded` (the group just opened → the row mounts).
  const pendingScrollRef = useRef<string | null>(null)
  const [scrollTick, setScrollTick] = useState(0)

  const handleSearchSelect = useCallback(
    (domId: string) => {
      const grp = scaleGroup.get(domId)
      if (grp) setExpanded((prev) => (prev[grp] ? prev : { ...prev, [grp]: true }))
      pendingScrollRef.current = domId
      setScrollTick((t) => t + 1)
    },
    [scaleGroup],
  )

  useEffect(() => {
    const id = pendingScrollRef.current
    if (!id) return
    const el = document.getElementById(id)
    if (!el) return // group not expanded/rendered yet — the next run gets it
    el.scrollIntoView({
      behavior: prefersReducedMotion() ? 'instant' : 'smooth',
      block: 'start',
    })
    pendingScrollRef.current = null
  }, [scrollTick, expanded])

  if (!root) return <Navigate to="/scales/C" replace />

  return (
    <>
      <StickyHeader
        title={`${formatRoot(root)} scales`}
        LinkComponent={RouterLink}
        utilLink={{ label: 'My scales', href: '/collection/scales' }}
        theme={theme}
        onThemeToggle={toggle}
        rootOptions={rootOptions}
        selectedRoot={root}
        onRootChange={(next) => navigate(`/scales/${slugFromRoot(next)}`)}
        chipGroups={chipGroups}
        chipNavLabel="Scale categories"
        onChipActivate={handleChipActivate}
        searchResults={searchResults}
        onSearchQueryChange={setSearchQuery}
        onSearchSelect={handleSearchSelect}
        searchLabel="Search scales"
        searchPlaceholder="Search scales…"
        installAppName="Scales"
        installAppIconHref="/icons/icon-192.png"
        installAppAccent="#6f8caa"
      />
      <main className="min-h-screen bg-stone-100 p-4 text-stone-900 dark:bg-stone-950 dark:text-stone-100 md:p-8">
        <ScaleList
          root={root}
          expanded={expanded}
          onExpandedChange={handleExpandedChange}
        />
      </main>
    </>
  )
}
