// GraphView — desktop force-directed collaboration graph (Phase E).
//
// Self-contained: props `{ data, focusId, onSelectNode? }`. Hand-rolled
// React + SVG (NOT canvas — needs focusable a11y nodes + CSS-var theming).
// d3-force is seeded from `hash(focusId)` (landmine 6: seed, don't freeze)
// and settled synchronously; clicking/selecting a node re-centres with the
// 900ms ease-in-out tween (`useRecentre`); reduced-motion snaps.
//
// Lazy-loadable: default export so the Phase-D page can `React.lazy(() =>
// import('./features/graph/GraphView'))` — d3-force then lands in the async
// chunk, keeping initial JS ≤ 100 KB gz.

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import type { GraphData } from '../../lib/types'
import { computeLayout, VIEW, type GraphLayout } from './layout'
import { useRecentre } from './useRecentre'
import GraphScene from './GraphScene'
import { GRAPH_CSS } from './graphView.css'

export interface GraphViewProps {
  /** The collaboration graph (post-mapper `/api/musicians/:id/graph`). */
  data: GraphData
  /** Canonical id of the focus / centre musician (seeds the layout). */
  focusId: string
  /** Called when a node is selected (click / Enter / Space). The consumer
   * owns navigation; GraphView always re-centres on the new focus too. */
  onSelectNode?: (id: string) => void
}

const ZOOM_STEP = 1.25
const ZOOM_MIN = 0.4
const ZOOM_MAX = 3

function focusName(data: GraphData, id: string): string {
  return data.nodes.find((n) => n.id === id)?.name ?? 'musician'
}

export default function GraphView({
  data,
  focusId,
  onSelectNode,
}: GraphViewProps) {
  const [activeId, setActiveId] = useState(focusId)
  const [zoom, setZoom] = useState(1)
  // Layout toggle: "settled" (cooled) vs "loose" (partial settle, more
  // organic spread). Both seeded, both deterministic.
  const [loose, setLoose] = useState(false)

  const ticks = loose ? 90 : 320
  const layout = useMemo<GraphLayout>(
    () => computeLayout(data, activeId, ticks),
    [data, activeId, ticks],
  )
  const frame = useRecentre(layout)

  const select = useCallback(
    (id: string) => {
      if (id !== activeId) setActiveId(id)
      onSelectNode?.(id)
    },
    [activeId, onSelectNode],
  )

  const refit = useCallback(() => setZoom(1), [])
  const zoomIn = useCallback(
    () => setZoom((z) => Math.min(ZOOM_MAX, z * ZOOM_STEP)),
    [],
  )
  const zoomOut = useCallback(
    () => setZoom((z) => Math.max(ZOOM_MIN, z / ZOOM_STEP)),
    [],
  )

  // Arrow-key roving: Tab reaches the SVG group; arrows move focus between
  // node <g>s in DOM order (color-not-sole-signal already covered by labels).
  const svgRef = useRef<SVGSVGElement>(null)
  const onSvgKey = useCallback((ev: KeyboardEvent<SVGSVGElement>) => {
    if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') return
    const root = svgRef.current
    if (!root) return
    const nodes = Array.from(
      root.querySelectorAll<SVGGElement>('g.mu-gnode'),
    )
    const current = document.activeElement as Element | null
    const idx = nodes.findIndex((n) => n === current)
    const nextIdx =
      ev.key === 'ArrowRight'
        ? (idx + 1 + nodes.length) % nodes.length
        : (idx - 1 + nodes.length) % nodes.length
    const target = nodes[nextIdx]
    if (target) {
      ev.preventDefault()
      target.focus()
    }
  }, [])

  const half = { x: VIEW.width / 2, y: VIEW.height / 2 }
  const vb = {
    w: VIEW.width / zoom,
    h: VIEW.height / zoom,
  }
  const viewBox = `${half.x - vb.w / 2} ${half.y - vb.h / 2} ${vb.w} ${vb.h}`
  const name = focusName(data, activeId)

  return (
    <div className="mu-graph">
      <style>{GRAPH_CSS}</style>
      <div className="mu-graph-bar">
        <div className="mu-ttl">
          Graph view · <b>{name}</b>
        </div>
        <div className="mu-graph-ctrls" role="group" aria-label="Graph controls">
          <button type="button" aria-label="Zoom out" onClick={zoomOut}>
            −
          </button>
          <button type="button" aria-label="Zoom in" onClick={zoomIn}>
            +
          </button>
          <button type="button" aria-label="Refit graph" onClick={refit}>
            ⤢
          </button>
          <button
            type="button"
            aria-label="Toggle layout density"
            aria-pressed={loose}
            onClick={() => setLoose((v) => !v)}
          >
            ●
          </button>
        </div>
      </div>

      <svg
        ref={svgRef}
        className="mu-graph-svg"
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        role="application"
        aria-label={`Collaboration graph centred on ${name}. Use Tab and arrow keys to move between musicians, Enter or Space to re-centre.`}
        onKeyDown={onSvgKey}
      >
        <GraphScene frame={frame} selectedId={activeId} onSelect={select} />
      </svg>

      <div className="mu-graph-legend" aria-hidden="true">
        <span className="mu-lk">
          <span className="mu-dot" /> Node size = records together
        </span>
        <span className="mu-lk">
          <span className="mu-lin" /> Heavier edge = stronger collaboration
        </span>
        <span className="mu-lk">Select a node to re-centre.</span>
      </div>

      <p className="mu-sr-only" role="status" aria-live="polite">
        Graph centred on {name}.
      </p>
    </div>
  )
}
