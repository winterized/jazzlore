/**
 * ChordCollectionPage — /collection/chords
 *
 * Renders every chord the user has starred. Subscribes to chordCollectionStore
 * so the list updates in real-time when the user unstars a chord on this page.
 *
 * Defensive: a stored chordId that is no longer in CURATED_CHORDS (e.g. after
 * a data migration) is silently skipped rather than crashing.
 */

import { useEffect, useSyncExternalStore } from 'react'
import { Link } from 'react-router'
import { ThemeToggle } from '@jazzlore/ui'
import { useTheme } from '../lib/useTheme'
import { getCollection, subscribe } from '../features/collection/chordCollectionStore'
import ChordRow from '../features/chords/ChordRow'
import { CURATED_CHORDS } from '../data/curated'

export default function ChordCollectionPage() {
  // useSyncExternalStore keeps the collection in sync with the store without
  // triggering the "setState in effect" lint rule.
  const saved = useSyncExternalStore(subscribe, getCollection)
  const { theme, toggle: toggleTheme } = useTheme()

  useEffect(() => {
    const previous = document.title
    document.title = 'My chord collection — Jazzlore'
    return () => {
      document.title = previous
    }
  }, [])

  return (
    <main className="min-h-screen bg-stone-100 p-4 text-stone-900 dark:bg-stone-950 dark:text-stone-100 md:p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">My chord collection</h1>
        <div className="flex items-center gap-3">
          <Link
            to="/chords/C"
            className="rounded-md border border-stone-300 px-3 py-1 text-sm hover:bg-stone-200 dark:border-stone-700 dark:hover:bg-stone-800"
          >
            ← Chords
          </Link>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      </div>

      {saved.length === 0 ? (
        <p className="text-stone-600 dark:text-stone-400">
          No saved chords yet —{' '}
          <Link to="/chords/C" className="underline hover:text-stone-900 dark:hover:text-stone-100">
            browse chords
          </Link>{' '}
          and star the ones you want to collect.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {saved.map(({ rootNote, chordId }) => {
            const definition = CURATED_CHORDS.find((c) => c.id === chordId)
            // Defensive: skip chords removed from the curated list.
            if (!definition) return null
            const key = `${rootNote}-${chordId}`
            return (
              <li key={key}>
                <ChordRow rootNote={rootNote} definition={definition} />
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
