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

import { lazy, Suspense, useMemo } from 'react'
import { useNavigate } from 'react-router'
import {
  defaultSource,
  useBffResource,
  type DataSource,
} from '../../hooks/useMusicianData'
import { capGraphNodes } from './capGraph'

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
  /** BFF seam. Defaults to the real fetch-backed source; tests inject the
   * fixture source. */
  source?: DataSource
}

export function GraphPanelSlot({
  focusId,
  name,
  source = defaultSource,
}: Props) {
  const navigate = useNavigate()
  const state = useBffResource(
    () => source.graph(focusId),
    [source, focusId],
  )

  // Always call useMemo (Rules of Hooks). Pre-cap the graph BEFORE the
  // ready-gate guard returns; on non-ready states the result is unused.
  // Cap is a no-op (returns same reference) when collaborators ≤ cap.
  // Audit CRIT-C: Miles had 1,304 SVG circles in a 600×500 viewBox without
  // this cap; see ./capGraph.ts for rationale + GRAPH_NODE_CAP.
  const cappedGraph = useMemo(
    () => (state.kind === 'ready' ? capGraphNodes(state.data.graph) : null),
    [state],
  )

  if (state.kind !== 'ready' || cappedGraph === null) {
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
        data={cappedGraph}
        focusId={focusId}
        onSelectNode={select}
      />
    </Suspense>
  )
}
