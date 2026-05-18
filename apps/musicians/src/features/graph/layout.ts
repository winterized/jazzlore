// Seeded force-directed layout — pure, synchronous, React-free, DOM-free.
//
// Highest-risk #1 / landmine 6: physics is non-deterministic *unless* seeded.
// We do NOT freeze hand-tuned coordinates. Instead we seed everything off
// `hash(focusId)` then let d3-force settle to a fixed point:
//   1. pre-place every node deterministically on a seeded ring (so the very
//      first tick already looks organic, not a tight clump),
//   2. point `simulation.randomSource` at the same seeded stream (jiggle is
//      deterministic too),
//   3. run a fixed number of ticks with `.stop()` + `.tick()` (no RAF, no
//      timers — testable in jsdom and reproducible).
// Same focus id ⇒ identical node/edge positions every run (asserted in tests).

import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from 'd3-force'
import type { GraphData, GraphEdge, GraphNode } from '../../lib/types'
import { seededRandom } from './seed'

/** A laid-out node: the frozen `GraphNode` data + a resolved render radius +
 * a settled position. Positions are viewBox units (see `VIEW`). */
export interface LayoutNode extends SimulationNodeDatum {
  id: string
  name: string
  instrument?: string
  recordCount: number
  focus: boolean
  /** Render radius in viewBox units, derived from `recordCount`. */
  radius: number
  /** Settled position (always defined after `computeLayout`). */
  x: number
  y: number
}

/** A laid-out edge: endpoint ids + the weight + the resolved stroke width. */
export interface LayoutEdge {
  source: string
  target: string
  weight: number
  /** Stroke width in viewBox units, derived from `weight`. */
  strokeWidth: number
  /** True when the collaboration is strong (design: ≥7 shared records). */
  strong: boolean
}

export interface GraphLayout {
  nodes: LayoutNode[]
  edges: LayoutEdge[]
}

/** Fixed SVG coordinate space. The component scales this to the panel via
 * `viewBox` + `preserveAspectRatio`, so layout math is resolution-independent
 * and the seeded baseline is stable regardless of panel pixel size. */
export const VIEW = { width: 600, height: 500 } as const
const CX = VIEW.width / 2
const CY = VIEW.height / 2

/** Strong-collaboration threshold (design legend: "≥7 records"). */
export const STRONG_WEIGHT = 7

/** Node render radius from record count. sqrt keeps *area* ∝ count (a count
 * of 4 is not 4× the disc of a count of 1) and the focus node reads largest. */
export function nodeRadius(recordCount: number, focus: boolean): number {
  const base = focus ? 16 : 7
  const r = base + Math.sqrt(Math.max(0, recordCount)) * (focus ? 2.4 : 3.4)
  return Math.min(focus ? 34 : 26, r)
}

/** Edge stroke width from collaboration weight (design: thicker = stronger). */
export function edgeStrokeWidth(weight: number): number {
  return Math.max(0.6, Math.min(4, weight * 0.55))
}

interface SimLink extends SimulationLinkDatum<LayoutNode> {
  weight: number
}

/**
 * Settle a seeded force-directed layout for `data`, centred on `focusId`.
 *
 * Synchronous and deterministic: identical `(data, focusId)` ⇒ identical
 * output. No RAF/timers (d3 timer is killed via `.stop()` before any tick).
 *
 * @param ticks number of integration steps. ~300 ≈ a fully cooled default
 *   simulation; the caller can lower it for a partially-settled snapshot.
 */
export function computeLayout(
  data: GraphData,
  focusId: string,
  ticks = 320,
): GraphLayout {
  const rng = seededRandom(focusId)

  // Pre-place deterministically: focus pinned dead-centre, others on a seeded
  // golden-angle spiral so the first frame is already spread (no clump pop).
  const golden = Math.PI * (3 - Math.sqrt(5))
  const peripheral = data.nodes.filter((n) => !n.focus)
  const placed = new Map<string, { x: number; y: number }>()
  peripheral.forEach((n, i) => {
    const t = (i + rng()) / Math.max(1, peripheral.length)
    const angle = i * golden + rng() * 0.6
    const ring = 70 + t * 150
    placed.set(n.id, {
      x: CX + Math.cos(angle) * ring,
      y: CY + Math.sin(angle) * ring,
    })
  })

  const simNodes: LayoutNode[] = data.nodes.map((n: GraphNode) => {
    const focus = n.focus
    const seededPos = placed.get(n.id)
    return {
      id: n.id,
      name: n.name,
      instrument: n.instrument,
      recordCount: n.recordCount,
      focus,
      radius: nodeRadius(n.recordCount, focus),
      x: focus ? CX : (seededPos?.x ?? CX),
      y: focus ? CY : (seededPos?.y ?? CY),
      // Pin the focus node to the centre for the whole simulation.
      fx: focus ? CX : null,
      fy: focus ? CY : null,
    }
  })

  const byId = new Map(simNodes.map((n) => [n.id, n]))
  const simLinks: SimLink[] = data.edges
    .filter((e) => byId.has(e.source) && byId.has(e.target))
    .map((e: GraphEdge) => ({
      source: e.source,
      target: e.target,
      weight: e.weight,
    }))

  const sim = forceSimulation<LayoutNode>(simNodes)
    // Seeded jiggle: makes d3-force's internal randomness reproducible too.
    .randomSource(rng)
    .force(
      'link',
      forceLink<LayoutNode, SimLink>(simLinks)
        .id((n) => n.id)
        // Stronger ties sit closer; weaker ties drift out.
        .distance((l) => 140 - Math.min(90, l.weight * 9))
        .strength((l) => Math.min(1, 0.12 + l.weight * 0.04)),
    )
    .force('charge', forceManyBody<LayoutNode>().strength(-220).distanceMax(360))
    .force('centre', forceCenter<LayoutNode>(CX, CY).strength(0.06))
    .force(
      'collide',
      forceCollide<LayoutNode>((n) => n.radius + 10).strength(0.85),
    )
    // Gentle pull to centre keeps the cloud framed without freezing it.
    .force('x', forceX<LayoutNode>(CX).strength(0.045))
    .force('y', forceY<LayoutNode>(CY).strength(0.045))
    .stop()

  // Synchronous settle — no animation frames, no d3 internal timer.
  sim.tick(ticks)

  const layoutNodes: LayoutNode[] = simNodes.map((n) => ({
    ...n,
    x: n.x ?? CX,
    y: n.y ?? CY,
  }))

  const layoutEdges: LayoutEdge[] = simLinks.map((l) => {
    const source = typeof l.source === 'object' ? l.source.id : String(l.source)
    const target = typeof l.target === 'object' ? l.target.id : String(l.target)
    return {
      source,
      target,
      weight: l.weight,
      strokeWidth: edgeStrokeWidth(l.weight),
      strong: l.weight >= STRONG_WEIGHT,
    }
  })

  return { nodes: layoutNodes, edges: layoutEdges }
}
