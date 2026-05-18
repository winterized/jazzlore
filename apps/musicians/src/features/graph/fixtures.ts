// Phase-E own fixtures — `GraphData`-shaped (the C→E contract), NOT raw Neo4j
// rows. The frozen `src/lib/fixtures.ts` is RAW-row shaped for mapper TDD and
// must not be touched; the graph view consumes the post-mapper `GraphData`
// (what `/api/musicians/:id/graph` returns), so it gets its own fixtures here.
//
// Three densities, matching the design's stress-test set, used to tune the
// settle feel "alive, not stuttery" before finalizing (highest-risk #1):
//   - MILES_LIKE   → 56 collaborators (abundance)
//   - BOBBY_LIKE   → 14 collaborators (the common happy path)
//   - ANTOINE_LIKE →  2 collaborators (sparse)
//
// Deterministic generators (seeded counts) so the fixtures themselves are
// stable inputs to the seeded-layout determinism tests.

import type { GraphData, GraphEdge, GraphNode } from '../../lib/types'

const INSTRUMENTS = [
  'trumpet',
  'tenor saxophone',
  'alto saxophone',
  'piano',
  'double bass',
  'drums',
  'guitar',
  'trombone',
  'vibraphone',
  'flugelhorn',
]

/** Build a focus + N peripheral collaborators all linked to the focus. Counts
 * and instruments are derived from the index so the fixture is fully fixed. */
function makeGraph(
  focusId: string,
  focusName: string,
  focusInstrument: string,
  focusRecordCount: number,
  peripheralCount: number,
): GraphData {
  const focus: GraphNode = {
    id: focusId,
    name: focusName,
    instrument: focusInstrument,
    recordCount: focusRecordCount,
    focus: true,
  }
  const nodes: GraphNode[] = [focus]
  const edges: GraphEdge[] = []

  for (let i = 0; i < peripheralCount; i++) {
    const id = `${focusId}::collab-${i}`
    // Deterministic-but-varied record/weight spread (no RNG needed).
    const shared = 1 + ((i * 7 + 3) % 11)
    nodes.push({
      id,
      name: `Collaborator ${i + 1}`,
      instrument: INSTRUMENTS[i % INSTRUMENTS.length],
      recordCount: shared,
      focus: false,
    })
    edges.push({ source: focusId, target: id, weight: shared })
  }
  return { nodes, edges }
}

/** Abundance — Miles-like: 1 focus + 56 collaborators (≈ design's Miles set). */
export const MILES_LIKE: GraphData = makeGraph(
  'wikidata:Q93341',
  'Miles Davis',
  'trumpet',
  48,
  56,
)

/** Common happy path — Bobby-like: 1 focus + 14 collaborators. */
export const BOBBY_LIKE: GraphData = makeGraph(
  'wikidata:Q379938',
  'Bobby Timmons',
  'piano',
  12,
  14,
)

/** Sparse — Antoine-like: 1 focus + 2 collaborators (no bio/portrait upstream;
 * irrelevant to the graph, which only needs id/name/instrument/count). */
export const ANTOINE_LIKE: GraphData = makeGraph(
  'wikidata:Q2856321',
  'Antoine Hervé',
  'piano',
  3,
  2,
)

/** All three, smallest→largest, for sweep tests of the settle at each scale. */
export const DENSITY_FIXTURES: ReadonlyArray<{
  label: string
  data: GraphData
}> = [
  { label: 'antoine-like (2)', data: ANTOINE_LIKE },
  { label: 'bobby-like (14)', data: BOBBY_LIKE },
  { label: 'miles-like (56)', data: MILES_LIKE },
]
