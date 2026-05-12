import { Navigate, useParams } from 'react-router'
import { rootFromSlug } from '../features/scales/logic/url'

const prettyRoot = (root: string) => root.replace('b', '♭').replace('#', '♯')

export default function ScalesPage() {
  const { root: slug } = useParams<{ root: string }>()
  const root = slug ? rootFromSlug(slug) : null

  if (!root) {
    return <Navigate to="/scales/C" replace />
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{prettyRoot(root)} scales</h1>
    </main>
  )
}
