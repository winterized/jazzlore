import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { StickyHeader, type ChipGroup, type RootOption } from '@jazzlore/ui'
import ScaleList, { type FamilyId } from '../features/scales/ScaleList'
import { CURATED_SCALES, FAMILIES } from '../features/scales/data/curated'
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

// Initial expanded state derived from FAMILIES — computed once outside the
// component so it does not trigger memo-churn on every render.
const initialExpanded = Object.fromEntries(
  FAMILIES.map((f) => [f.id, f.defaultExpanded]),
) as Record<FamilyId, boolean>

export default function ScalesPage() {
  const { root: slug } = useParams<{ root: string }>()
  const navigate = useNavigate()
  const root = slug ? rootFromSlug(slug) : null
  const { theme, toggle } = useTheme()

  const [expanded, setExpanded] = useState<Record<FamilyId, boolean>>(initialExpanded)

  const handleExpandedChange = useCallback((familyId: FamilyId, next: boolean) => {
    setExpanded((prev) => ({ ...prev, [familyId]: next }))
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
  const chipGroups: ChipGroup[] = useMemo(
    () => [
      {
        label: '',
        chips: FAMILIES.map((f) => ({ id: `group-${f.id}`, label: f.label })),
      },
    ],
    [],
  )

  const handleChipActivate = useCallback((chipId: string) => {
    // chipId is "group-<familyId>" — strip the prefix to get the familyId.
    const familyId = chipId.replace(/^group-/, '') as FamilyId
    // Expand-only: if already open, stay open (no toggle-off per handoff).
    // Functional update form — no closure over `expanded`, so deps array is [].
    setExpanded((prev) => (prev[familyId] ? prev : { ...prev, [familyId]: true }))
  }, [])

  // ── Header search ─────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('')
  const searchResults = useMemo(() => searchScales(searchQuery), [searchQuery])

  // `scale-<id>` → its family, so a search hit can expand the (maybe collapsed)
  // accordion before we scroll to the row.
  const scaleFamily = useMemo(
    () => new Map(CURATED_SCALES.map((s) => [`scale-${s.id}`, s.family])),
    [],
  )

  // Pending scroll target lives in a ref (no setState in the effect); a tick
  // bumped from the handler (an event — lint-clean) drives the effect, and so
  // does `expanded` (the family just opened → the row mounts).
  const pendingScrollRef = useRef<string | null>(null)
  const [scrollTick, setScrollTick] = useState(0)

  const handleSearchSelect = useCallback(
    (domId: string) => {
      const fam = scaleFamily.get(domId)
      if (fam) setExpanded((prev) => (prev[fam] ? prev : { ...prev, [fam]: true }))
      pendingScrollRef.current = domId
      setScrollTick((t) => t + 1)
    },
    [scaleFamily],
  )

  useEffect(() => {
    const id = pendingScrollRef.current
    if (!id) return
    const el = document.getElementById(id)
    if (!el) return // family not expanded/rendered yet — the next run gets it
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
