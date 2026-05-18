// GraphPanelSlot — D-owned bridge from the mobile-reader lane to Phase E's
// desktop graph. The ONLY file under features/graph/ that Phase D may edit;
// it imports Phase E exclusively through its PUBLIC API.
//
// d3-force is heavy (perf budget: initial JS ≤ 100 KB gz). React.lazy keeps
// the whole graph chunk — and d3-force with it — out of the initial bundle;
// it loads only when a desktop reader actually reveals the panel. Graph data
// comes from the same mockable BFF seam as the detail screen (the frozen
// `/api/musicians/:id/graph` envelope), so the panel and the rail always
// describe one consistent collaboration neighbourhood.

import { lazy, Suspense } from 'react'
import { useNavigate } from 'react-router'
import { fixtureSource, useBffResource } from '../../hooks/useMusicianData'

// Resolves the default export (GraphView) — d3-force lands in this async
// chunk, never the initial bundle. PUBLIC API only (features/graph/index.ts).
const GraphView = lazy(() => import('../graph'))

function GraphLoading({ name }: { name: string }) {
  return (
    <div
      className="desk-graph-loading"
      role="status"
      aria-label="Loading the collaboration graph"
    >
      <p>Drawing {name}&rsquo;s collaboration graph…</p>
    </div>
  )
}

type Props = {
  /** Canonical id of the focus musician (seeds the layout). */
  focusId: string
  /** Focus musician name — for the loading + empty copy only. */
  name: string
}

export function GraphPanelSlot({ focusId, name }: Props) {
  const navigate = useNavigate()
  const state = useBffResource(
    () => fixtureSource.graph(focusId),
    [focusId],
  )

  if (state.kind !== 'ready') {
    // Cold-Aura / error here is non-fatal: the detail screen is the product,
    // the graph is desktop enrichment. Keep the calm loading affordance
    // rather than escalating the whole page to the waking screen.
    return <GraphLoading name={name} />
  }

  const select = (id: string): void => {
    if (id !== focusId) {
      void navigate(`/musicians/${encodeURIComponent(id)}`)
    }
  }

  return (
    <Suspense fallback={<GraphLoading name={name} />}>
      <GraphView
        key={focusId}
        data={state.data.graph}
        focusId={focusId}
        onSelectNode={select}
      />
    </Suspense>
  )
}
