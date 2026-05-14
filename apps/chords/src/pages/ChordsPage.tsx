import { useEffect, useMemo } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { RootPicker, ThemeToggle, type RootOption } from '@jazzlore/ui'
import {
  DEFAULT_ROOTS,
  alternateSpelling,
  formatRoot,
  isAmbiguous,
  rootFromSlug,
  slugFromRoot,
} from '@jazzlore/music-core'
import { useTheme } from '../lib/useTheme'
import ChordRow from '../features/chords/ChordRow'
import { CURATED_CHORDS } from '../data/curated'

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

  useEffect(() => {
    if (root) {
      document.title = `Chords on ${formatRoot(root)} — Jazzlore`
    }
  }, [root])

  if (!root) return <Navigate to="/chords/C" replace />

  return (
    <main
      lang="en"
      className="min-h-screen bg-stone-100 p-4 text-stone-900 dark:bg-stone-950 dark:text-stone-100 md:p-8"
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          {formatRoot(root)} chords
        </h1>
        <div className="flex items-center gap-3">
          <Link
            to="/collection/chords"
            className="rounded-md border border-stone-300 px-3 py-1 text-sm hover:bg-stone-200 dark:border-stone-700 dark:hover:bg-stone-800"
          >
            My chord collection
          </Link>
          <ThemeToggle theme={theme} onToggle={toggle} />
        </div>
      </div>
      <RootPicker
        options={options}
        selected={root}
        onSelect={(next) => navigate(`/chords/${slugFromRoot(next)}`)}
      />
      <ul className="mt-8 flex flex-col gap-4">
        {CURATED_CHORDS.map((def) => (
          <li key={def.id}>
            <ChordRow rootNote={formatRoot(root)} definition={def} />
          </li>
        ))}
      </ul>
    </main>
  )
}
