import { Navigate, useNavigate, useParams } from 'react-router'
import RootPicker from '../features/scales/RootPicker'
import { formatRoot } from '../features/scales/logic/spelling'
import { rootFromSlug, slugFromRoot } from '../features/scales/logic/url'

export default function ScalesPage() {
  const { root: slug } = useParams<{ root: string }>()
  const navigate = useNavigate()
  const root = slug ? rootFromSlug(slug) : null

  if (!root) return <Navigate to="/scales/C" replace />

  return (
    <main className="min-h-screen bg-stone-50 p-4 text-stone-900 dark:bg-stone-950 dark:text-stone-100 md:p-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight md:text-4xl">
        {formatRoot(root)} scales
      </h1>
      <RootPicker
        selected={root}
        onSelect={(next) => navigate(`/scales/${slugFromRoot(next)}`)}
      />
    </main>
  )
}
