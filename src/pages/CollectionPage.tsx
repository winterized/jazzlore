import { listSaved } from '../features/collection/collectionStore'
import ScaleRow from '../features/scales/ScaleRow'
import { CURATED_SCALES } from '../features/scales/data/curated'
import { notesForScale } from '../lib/music'

export default function CollectionPage() {
  const saved = listSaved()

  return (
    <main className="min-h-screen bg-stone-50 p-4 text-stone-900 dark:bg-stone-950 dark:text-stone-100 md:p-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight md:text-4xl">My scales</h1>

      {saved.length === 0 ? (
        <p className="text-stone-500 dark:text-stone-400">
          No saved scales yet — star a scale from the scales page to save it here.
        </p>
      ) : (
        <div className="space-y-3">
          {saved.map(({ rootNote, scaleId }) => {
            const scale = CURATED_SCALES.find((s) => s.id === scaleId)
            if (!scale) return null
            return (
              <ScaleRow
                key={`${rootNote}-${scaleId}`}
                scale={scale}
                root={rootNote}
                notes={notesForScale(rootNote, scale)}
              />
            )
          })}
        </div>
      )}
    </main>
  )
}
