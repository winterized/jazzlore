// Cap the desktop force-graph at the top-N collaborators by record count.
//
// Audit CRIT-C / Wave 1 PR5: the live graph was rendering 1,304 SVG circles
// for Miles and 1,562 for Wayne in 600×500 SVG units — pairwise overlap
// rate ~100%, unreadable. The frozen `lib/map.ts mapGraphData` consumes the
// already-cypher-sorted collaborator list (sharedRecordCount DESC since
// PR #55), so cap on the consumer side without touching the frozen mapper.
// The non-headliner long tail still lives in the rail below the graph; the
// graph is the visual, the rail is the list.
//
// Pure helper — no side effects, no React, no force-layout. Easy to test.

import type { GraphData } from '../../lib/types'

/** Maximum non-focus nodes the desktop graph will render. The focus node is
 * always kept (it's the centre of the layout). 30 is chosen for legibility
 * at the 600×500 SVG viewBox + 800×800 px panel, with a comfortable margin
 * above the rail's HEADLINER_CAP=16 — the rail handles the long tail. */
export const GRAPH_NODE_CAP = 30

/**
 * Returns a new {nodes, edges} keeping the focus + the top `max` non-focus
 * nodes in source order (caller pre-sorts; this helper does NOT re-sort).
 * Edges are filtered to only those whose endpoints both survive — defensive
 * across topology changes; today every edge has source=focus, target=collab.
 *
 * If `max` is ≥ the non-focus count, the input is returned unchanged
 * (same reference — callers can fast-path on identity).
 */
export function capGraphNodes(
  graph: GraphData,
  max: number = GRAPH_NODE_CAP,
): GraphData {
  const focusIdx = graph.nodes.findIndex((n) => n.focus === true)
  // Defensive: no focus → don't transform. The graph view's layout seeds on
  // the focus, so we shouldn't paper over data shape mismatches here.
  if (focusIdx < 0) return graph

  const focus = graph.nodes[focusIdx]
  if (!focus) return graph

  const collaborators = graph.nodes.filter((n) => !n.focus)
  if (collaborators.length <= max) return graph

  const keptCollabs = collaborators.slice(0, max)
  const keptIds = new Set<string>([focus.id, ...keptCollabs.map((n) => n.id)])

  const nodes = [focus, ...keptCollabs]
  const edges = graph.edges.filter(
    (e) => keptIds.has(e.source) && keptIds.has(e.target),
  )
  return { nodes, edges }
}
