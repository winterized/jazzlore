import { useMemo } from 'react'
import { notesForScale } from '@jazzlore/music-core'
import { CURATED_SCALES, GROUPS, type CuratedScale, type ScaleGroup } from './data/curated'
import ScaleRow from './ScaleRow'

export type GroupId = ScaleGroup

type Props = {
  root: string
  expanded: Record<GroupId, boolean>
  onExpandedChange: (groupId: GroupId, next: boolean) => void
}

export default function ScaleList({ root, expanded, onExpandedChange }: Props) {
  const grouped = useMemo(() => {
    const map = new Map<ScaleGroup, readonly CuratedScale[]>()
    for (const group of GROUPS) {
      map.set(
        group.id,
        CURATED_SCALES.filter((s) => s.group === group.id).sort(
          (a, b) => a.groupOrder - b.groupOrder,
        ),
      )
    }
    return map
  }, [])

  return (
    <div className="space-y-4">
      {GROUPS.map((group) => {
        const isOpen = expanded[group.id]
        const scales = grouped.get(group.id) ?? []
        const panelId = `group-panel-${group.id}`
        return (
          <section key={group.id} aria-label={group.label}>
            <h2
              id={`group-${group.id}`}
              className="text-base scroll-mt-[140px] md:scroll-mt-[220px]"
            >
              <button
                type="button"
                onClick={() => onExpandedChange(group.id, !isOpen)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className="flex w-full items-center justify-between rounded-md bg-stone-200 px-4 py-2 text-left font-medium hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700"
              >
                <span>
                  {group.label}{' '}
                  <span className="text-stone-600 dark:text-stone-400">
                    ({scales.length})
                  </span>
                </span>
                <span aria-hidden="true">{isOpen ? '▾' : '▸'}</span>
              </button>
            </h2>
            {isOpen && (
              // Per-group grid: 1 col, → 2 cols at xl (1280px) — shared
              // breakpoint with chords for cross-site consistency. The group
              // header (<h2>) is above this panel so it spans full width; an
              // odd count leaves one trailing empty cell (align-items:start,
              // by design). gap-3 == the prior space-y-3 rhythm in 1 col.
              <div id={panelId} className="mt-2 grid grid-cols-1 gap-3 xl:grid-cols-2">
                {scales.map((scale) => (
                  // Per-scale scroll anchor for header search. Layout-inert
                  // (scroll-margin-top only) so it is not a new grid styling
                  // concern; the grid cell is this wrapper.
                  <div
                    key={scale.id}
                    id={`scale-${scale.id}`}
                    className="scroll-mt-[140px] md:scroll-mt-[220px]"
                  >
                    <ScaleRow
                      scale={scale}
                      root={root}
                      notes={notesForScale(root, scale)}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
