import { describe, expect, it } from 'vitest'
import type { GraphData, GraphNode, GraphEdge } from '../../lib/types'
import { GRAPH_NODE_CAP, capGraphNodes } from './capGraph'

const focus = (over: Partial<GraphNode> = {}): GraphNode => ({
  id: 'focus',
  name: 'Miles Davis',
  instrument: 'trumpet',
  recordCount: 113,
  focus: true,
  ...over,
})

const collab = (i: number): GraphNode => ({
  id: `c${i}`,
  name: `Collab ${i}`,
  instrument: 'piano',
  recordCount: 50 - i, // descending sort already applied (cypher orders DESC)
  focus: false,
})

function build(n: number): GraphData {
  const nodes: GraphNode[] = [focus(), ...Array.from({ length: n }, (_, i) => collab(i))]
  const edges: GraphEdge[] = nodes
    .filter((node) => !node.focus)
    .map<GraphEdge>((node) => ({
      source: 'focus',
      target: node.id,
      weight: node.recordCount,
    }))
  return { nodes, edges }
}

describe('capGraphNodes', () => {
  it('returns the input unchanged when below the cap', () => {
    const g = build(GRAPH_NODE_CAP - 5)
    expect(capGraphNodes(g)).toBe(g) // same reference (fast path)
  })

  it('returns the input unchanged when exactly at the cap', () => {
    const g = build(GRAPH_NODE_CAP)
    expect(capGraphNodes(g)).toBe(g)
  })

  it('keeps focus + top N collaborators in source order when above the cap', () => {
    // 1304 collaborators is the audit-observed Miles value.
    const g = build(1304)
    const out = capGraphNodes(g)
    expect(out.nodes).toHaveLength(GRAPH_NODE_CAP + 1) // focus + 30 collabs
    expect(out.nodes[0]?.focus).toBe(true)
    expect(out.nodes[1]?.id).toBe('c0') // top of the sharedCount-DESC list
    expect(out.nodes[GRAPH_NODE_CAP]?.id).toBe('c29')
  })

  it('drops the long-tail collaborators that fall past the cap', () => {
    const g = build(50)
    const out = capGraphNodes(g)
    const survivingIds = new Set(out.nodes.map((n) => n.id))
    expect(survivingIds.has('c29')).toBe(true)
    expect(survivingIds.has('c30')).toBe(false)
    expect(survivingIds.has('c49')).toBe(false)
  })

  it('filters edges to only those whose endpoints both survive the cap', () => {
    const g = build(50)
    const out = capGraphNodes(g)
    const survivingIds = new Set(out.nodes.map((n) => n.id))
    // Every surviving edge must touch only kept nodes (no orphan edges).
    for (const e of out.edges) {
      expect(survivingIds.has(e.source)).toBe(true)
      expect(survivingIds.has(e.target)).toBe(true)
    }
    // 30 collaborators kept → 30 edges (one per focus↔collab in this fixture).
    expect(out.edges).toHaveLength(GRAPH_NODE_CAP)
  })

  it('respects a custom max parameter', () => {
    const g = build(20)
    const out = capGraphNodes(g, 5)
    expect(out.nodes).toHaveLength(6) // focus + 5
    expect(out.edges).toHaveLength(5)
  })

  it('returns the input unchanged when no focus node is present (defensive)', () => {
    const g: GraphData = {
      nodes: [collab(0), collab(1)],
      edges: [],
    }
    expect(capGraphNodes(g)).toBe(g)
  })

  it('locates the focus by flag, not by index 0 (contract guard)', () => {
    // Today mapGraphData puts focus at index 0, but the helper uses
    // findIndex(n => n.focus === true) — pin that contract so a future
    // refactor optimising to nodes[0] doesn't silently drop the focus when
    // upstream ordering changes.
    const collabs = Array.from({ length: 10 }, (_, i) => collab(i))
    const f = focus()
    const nodes: GraphNode[] = [...collabs.slice(0, 5), f, ...collabs.slice(5)]
    const edges: GraphEdge[] = collabs.map((n) => ({
      source: f.id,
      target: n.id,
      weight: n.recordCount,
    }))
    const out = capGraphNodes({ nodes, edges }, 3)
    // Focus must be first in the output even though it was at index 5 in input.
    expect(out.nodes[0]?.id).toBe('focus')
    expect(out.nodes[0]?.focus).toBe(true)
    expect(out.nodes).toHaveLength(4) // focus + 3
  })
})
