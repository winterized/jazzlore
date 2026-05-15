import { useCallback, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { StickyHeader, type ChipGroup, type RootOption } from '@jazzlore/ui'
import ScaleList, { type FamilyId } from '../features/scales/ScaleList'
import { FAMILIES } from '../features/scales/data/curated'
import {
  DEFAULT_ROOTS,
  alternateSpelling,
  formatRoot,
  isAmbiguous,
  rootFromSlug,
  slugFromRoot,
} from '@jazzlore/music-core'
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

  const handleChipActivate = useCallback(
    (chipId: string) => {
      // chipId is "group-<familyId>" — strip the prefix to get the familyId.
      const familyId = chipId.replace(/^group-/, '') as FamilyId
      // Expand-only: if already open, stay open (no toggle-off per handoff).
      if (!expanded[familyId]) {
        setExpanded((prev) => ({ ...prev, [familyId]: true }))
      }
    },
    [expanded],
  )

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
