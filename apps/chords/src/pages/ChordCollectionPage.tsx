/**
 * ChordCollectionPage — /collection/chords
 *
 * Renders every chord the user has starred. Subscribes to chordCollectionStore
 * so the list updates in real-time when the user unstars a chord on this page.
 *
 * Defensive: a stored chordId that is no longer in CURATED_CHORDS (e.g. after
 * a data migration) is silently skipped rather than crashing.
 *
 * Print: a <PrintDensity> control in the page header lets the user pick a
 * density level (compact / medium / expanded) before printing. The chosen level
 * is stored in localStorage and applied as data-density on the <main> element
 * so print.css selectors can hide/show card body elements accordingly.
 */

import { useEffect, useState, useSyncExternalStore } from 'react'
import { Link } from 'react-router'
import { ThemeToggle, isNativeApp } from '@jazzlore/ui'
import { read, write } from '@jazzlore/music-core'
import { useTheme } from '../lib/useTheme'
import { getCollection, subscribe } from '../features/collection/chordCollectionStore'
import PrintDensityControl, { type PrintDensity } from '../features/collection/PrintDensity'
import ChordRow from '../features/chords/ChordRow'
import { CURATED_CHORDS } from '../data/curated'

/** Pass only the suffix to read/write — music-core's storage helpers prepend
 *  the `jazzlore:` namespace automatically. Full key in localStorage:
 *  `jazzlore:chords-print-density:v1`. Distinct from the chord collection key. */
const DENSITY_KEY = 'chords-print-density:v1'

function readDensity(): PrintDensity {
  const stored = read<PrintDensity>(DENSITY_KEY)
  return stored === 'compact' || stored === 'expanded' ? stored : 'medium'
}

export default function ChordCollectionPage() {
  // useSyncExternalStore keeps the collection in sync with the store without
  // triggering the "setState in effect" lint rule.
  const saved = useSyncExternalStore(subscribe, getCollection)
  const { theme, toggle: toggleTheme } = useTheme()
  const [density, setDensity] = useState<PrintDensity>(readDensity)

  const handleDensityChange = (next: PrintDensity): void => {
    setDensity(next)
    write(DENSITY_KEY, next)
  }

  useEffect(() => {
    const previous = document.title
    document.title = 'My chord collection — Jazzlore'
    return () => {
      document.title = previous
    }
  }, [])

  return (
    <main
      // Safe-area insets (issue #131): this page renders its own <main> and is
      // NOT wrapped by StickyHeader, so it must lift content past the notch /
      // home indicator itself. Horizontal padding keeps p-4/md:p-8 (1rem/2rem);
      // top+bottom add env(safe-area-inset-*) — a no-op (0px) in non-notched
      // browsers, so web/desktop layout is unchanged.
      className="min-h-screen bg-stone-100 px-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-[calc(1rem+env(safe-area-inset-bottom,0px))] text-stone-900 md:px-8 md:pt-[calc(2rem+env(safe-area-inset-top,0px))] md:pb-[calc(2rem+env(safe-area-inset-bottom,0px))] dark:bg-stone-950 dark:text-stone-100"
      data-density={density}
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">My chord collection</h1>
        <div className="no-print flex items-center gap-3">
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
        <>
          {/* Print toolbar — hidden inside the Capacitor native shell, where
              window.print() is a silent no-op in WKWebView (#135). The density
              control is hidden with it: it only configures print output, so on
              native it would be orphaned dead UI. */}
          {!isNativeApp() && (
            <div className="no-print mb-4 flex flex-wrap items-center gap-4">
              <PrintDensityControl density={density} onChange={handleDensityChange} />
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-md border border-stone-300 px-3 py-1 text-sm hover:bg-stone-50 dark:border-stone-700 dark:hover:bg-stone-800"
              >
                Print collection
              </button>
            </div>
          )}

          <ul className="print-grid flex flex-col gap-4">
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
        </>
      )}
    </main>
  )
}
