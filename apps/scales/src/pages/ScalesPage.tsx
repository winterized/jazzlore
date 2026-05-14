import { Link, Navigate, useNavigate, useParams } from 'react-router'
import ThemeToggle from '../components/ThemeToggle'
import RootPicker from '../features/scales/RootPicker'
import ScaleList from '../features/scales/ScaleList'
import { formatRoot, rootFromSlug, slugFromRoot } from '@jazzlore/music-core'

export default function ScalesPage() {
  const { root: slug } = useParams<{ root: string }>()
  const navigate = useNavigate()
  const root = slug ? rootFromSlug(slug) : null

  if (!root) return <Navigate to="/scales/C" replace />

  return (
    <main className="min-h-screen bg-stone-100 p-4 text-stone-900 dark:bg-stone-950 dark:text-stone-100 md:p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          {formatRoot(root)} scales
        </h1>
        <div className="flex items-center gap-3">
          <Link
            to="/collection/scales"
            className="rounded-md border border-stone-300 px-3 py-1 text-sm hover:bg-stone-200 dark:border-stone-700 dark:hover:bg-stone-800"
          >
            My scales
          </Link>
          <ThemeToggle />
        </div>
      </div>
      <RootPicker
        selected={root}
        onSelect={(next) => navigate(`/scales/${slugFromRoot(next)}`)}
      />
      <div className="mt-8">
        <ScaleList root={root} />
      </div>
    </main>
  )
}
