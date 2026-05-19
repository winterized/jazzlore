import { describe, expect, it } from 'vitest'
import {
  computeLayout,
  edgeStrokeWidth,
  nodeRadius,
  STRONG_WEIGHT,
  VIEW,
} from './layout'
import { hashId, mulberry32, seededRandom } from './seed'
import {
  ANTOINE_LIKE,
  BOBBY_LIKE,
  DENSITY_FIXTURES,
  MILES_LIKE,
} from './fixtures'
import type { GraphData } from '../../lib/types'

/** Round positions so float-noise across runs of the SAME seeded input is
 * still asserted as equal (it is bit-stable here, but rounding documents the
 * tolerance the seeded baseline is compared at). */
const snap = (l: { nodes: { id: string; x: number; y: number }[] }) =>
  l.nodes
    .map((n) => `${n.id}:${n.x.toFixed(3)},${n.y.toFixed(3)}`)
    .sort()
    .join('|')

describe('seed', () => {
  it('hashId is stable and 32-bit', () => {
    expect(hashId('wikidata:Q93341')).toBe(hashId('wikidata:Q93341'))
    expect(hashId('a')).not.toBe(hashId('b'))
    expect(hashId('wikidata:Q93341')).toBeGreaterThanOrEqual(0)
    expect(hashId('wikidata:Q93341')).toBeLessThan(2 ** 32)
  })

  it('mulberry32 is deterministic for a seed and yields [0,1)', () => {
    const a = mulberry32(123)
    const b = mulberry32(123)
    for (let i = 0; i < 50; i++) {
      const v = a()
      expect(v).toBe(b())
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('different focus ids seed different streams', () => {
    expect(seededRandom('wikidata:Q93341')()).not.toBe(
      seededRandom('wikidata:Q379938')(),
    )
  })
})

describe('encodings', () => {
  it('node radius grows with record count and focus reads largest', () => {
    expect(nodeRadius(0, false)).toBeLessThan(nodeRadius(10, false))
    expect(nodeRadius(5, true)).toBeGreaterThan(nodeRadius(5, false))
    // Clamped, never unbounded.
    expect(nodeRadius(9999, false)).toBeLessThanOrEqual(26)
    expect(nodeRadius(9999, true)).toBeLessThanOrEqual(34)
    // Guards a negative count (noUncheckedIndexedAccess defensiveness).
    expect(nodeRadius(-3, false)).toBeGreaterThan(0)
  })

  it('edge stroke width grows with weight and is clamped', () => {
    expect(edgeStrokeWidth(1)).toBeLessThan(edgeStrokeWidth(6))
    expect(edgeStrokeWidth(0)).toBeGreaterThanOrEqual(0.6)
    expect(edgeStrokeWidth(9999)).toBeLessThanOrEqual(4)
  })
})

describe('computeLayout — determinism (landmine 6)', () => {
  it('same (data, focusId) → byte-identical positions across runs', () => {
    const a = computeLayout(MILES_LIKE, MILES_LIKE.nodes[0]!.id)
    const b = computeLayout(MILES_LIKE, MILES_LIKE.nodes[0]!.id)
    expect(snap(a)).toBe(snap(b))
  })

  it('is stable across a fresh module-state run (no shared mutation)', () => {
    const focus = BOBBY_LIKE.nodes[0]!.id
    const runs = [0, 1, 2, 3].map(() => snap(computeLayout(BOBBY_LIKE, focus)))
    expect(new Set(runs).size).toBe(1)
  })

  it('different focus ids produce different layouts (seeded, not frozen)', () => {
    const miles = computeLayout(MILES_LIKE, MILES_LIKE.nodes[0]!.id)
    // Re-centre onto a collaborator: a different seed ⇒ a different settle.
    const other = computeLayout(MILES_LIKE, MILES_LIKE.nodes[3]!.id)
    expect(snap(miles)).not.toBe(snap(other))
  })

  it('pins the focus node dead-centre', () => {
    const { nodes } = computeLayout(MILES_LIKE, MILES_LIKE.nodes[0]!.id)
    const focus = nodes.find((n) => n.focus)!
    expect(focus.x).toBeCloseTo(VIEW.width / 2, 5)
    expect(focus.y).toBeCloseTo(VIEW.height / 2, 5)
  })

  it('settles every node to a finite position at all densities', () => {
    for (const { data } of DENSITY_FIXTURES) {
      const { nodes, edges } = computeLayout(data, data.nodes[0]!.id)
      expect(nodes).toHaveLength(data.nodes.length)
      for (const n of nodes) {
        expect(Number.isFinite(n.x)).toBe(true)
        expect(Number.isFinite(n.y)).toBe(true)
      }
      expect(edges).toHaveLength(data.edges.length)
    }
  })

  it('marks strong collaborations on the edge layout', () => {
    const strongData: GraphData = {
      nodes: [
        { id: 'f', name: 'Focus', recordCount: 9, focus: true },
        { id: 'w', name: 'Weak', recordCount: 1, focus: false },
        { id: 's', name: 'Strong', recordCount: 9, focus: false },
      ],
      edges: [
        { source: 'f', target: 'w', weight: 2 },
        { source: 'f', target: 's', weight: STRONG_WEIGHT + 1 },
      ],
    }
    const { edges } = computeLayout(strongData, 'f')
    expect(edges.find((e) => e.target === 'w')!.strong).toBe(false)
    expect(edges.find((e) => e.target === 's')!.strong).toBe(true)
  })

  it('drops edges that reference an unknown node id', () => {
    const data: GraphData = {
      nodes: [{ id: 'f', name: 'F', recordCount: 1, focus: true }],
      edges: [{ source: 'f', target: 'ghost', weight: 1 }],
    }
    expect(computeLayout(data, 'f').edges).toHaveLength(0)
  })

  it('a partial-settle tick count differs from the cooled layout', () => {
    const focus = ANTOINE_LIKE.nodes[0]!.id
    const partial = computeLayout(ANTOINE_LIKE, focus, 12)
    const cooled = computeLayout(ANTOINE_LIKE, focus, 320)
    // Still deterministic for the SAME tick count.
    expect(snap(computeLayout(ANTOINE_LIKE, focus, 12))).toBe(snap(partial))
    expect(snap(partial)).not.toBe(snap(cooled))
  })
})
