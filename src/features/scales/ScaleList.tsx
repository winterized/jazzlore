import { useMemo, useState } from 'react'
import { CURATED_SCALES, FAMILIES, type Family, type ScaleDefinition } from './data/curated'
import { notesForScale } from '../../lib/music'
import ScaleRow from './ScaleRow'

type Props = { root: string }

export default function ScaleList({ root }: Props) {
  const [expanded, setExpanded] = useState<Record<Family, boolean>>(
    () =>
      Object.fromEntries(FAMILIES.map((f) => [f.id, f.defaultExpanded])) as Record<
        Family,
        boolean
      >,
  )

  const grouped = useMemo(() => {
    const map = new Map<Family, readonly ScaleDefinition[]>()
    for (const family of FAMILIES) {
      map.set(
        family.id,
        CURATED_SCALES.filter((s) => s.family === family.id),
      )
    }
    return map
  }, [])

  return (
    <div className="space-y-4">
      {FAMILIES.map((family) => {
        const isOpen = expanded[family.id]
        const scales = grouped.get(family.id) ?? []
        const panelId = `family-${family.id}`
        return (
          <section key={family.id}>
            <button
              type="button"
              onClick={() =>
                setExpanded((p) => ({ ...p, [family.id]: !p[family.id] }))
              }
              aria-expanded={isOpen}
              aria-controls={panelId}
              className="flex w-full items-center justify-between rounded-md bg-stone-100 px-4 py-2 text-left font-medium hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700"
            >
              <span>
                {family.label}{' '}
                <span className="text-stone-600 dark:text-stone-400">({scales.length})</span>
              </span>
              <span aria-hidden="true">{isOpen ? '▾' : '▸'}</span>
            </button>
            {isOpen && (
              <div id={panelId} className="mt-2 space-y-3">
                {scales.map((scale) => (
                  <ScaleRow
                    key={scale.id}
                    scale={scale}
                    root={root}
                    notes={notesForScale(root, scale)}
                  />
                ))}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
