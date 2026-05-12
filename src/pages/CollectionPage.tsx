import { useState } from 'react'
import { listSaved } from '../features/collection/collectionStore'
import PrintDensity from '../features/collection/PrintDensity'
import ScaleRow from '../features/scales/ScaleRow'
import { CURATED_SCALES } from '../features/scales/data/curated'
import { notesForScale } from '../lib/music'

export default function CollectionPage() {
  const saved = listSaved()
  const [included, setIncluded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(saved.map((s) => [`${s.rootNote}-${s.scaleId}`, true])),
  )

  const toggle = (key: string): void =>
    setIncluded((prev) => ({ ...prev, [key]: !(prev[key] ?? true) }))

  return (
    <main className="min-h-screen bg-stone-50 p-4 text-stone-900 dark:bg-stone-950 dark:text-stone-100 md:p-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight md:text-4xl">My scales</h1>

      {saved.length === 0 ? (
        <p className="text-stone-500 dark:text-stone-400">
          No saved scales yet — star a scale from the scales page to save it here.
        </p>
      ) : (
        <>
          <div className="no-print mb-4 flex flex-wrap items-center gap-4">
            <PrintDensity />
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-md border border-stone-300 px-3 py-1 text-sm hover:bg-stone-50 dark:border-stone-700 dark:hover:bg-stone-800"
            >
              Print selected
            </button>
          </div>

          <div className="print-grid space-y-3">
            {saved.map(({ rootNote, scaleId }) => {
              const key = `${rootNote}-${scaleId}`
              const scale = CURATED_SCALES.find((s) => s.id === scaleId)
              if (!scale) return null
              const isIncluded = included[key] ?? true
              return (
                <div key={key} className="scale-row" data-print-include={String(isIncluded)}>
                  <label className="no-print mb-2 flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={isIncluded}
                      onChange={() => toggle(key)}
                      aria-label={`Include ${scale.name} on ${rootNote} in print`}
                    />
                    Include in print
                  </label>
                  <ScaleRow
                    scale={scale}
                    root={rootNote}
                    notes={notesForScale(rootNote, scale)}
                  />
                </div>
              )
            })}
          </div>
        </>
      )}
    </main>
  )
}
