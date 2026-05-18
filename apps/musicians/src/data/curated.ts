// Home-screen curated list — hand-picked canonical jazz figures + a
// hand-written one-line editorial "hook" each (decision 1 in the v1 plan).
//
// The BFF (`/api/musicians/curated`) reads this list and HYDRATES live
// name / photo / subtitle from Neo4j — Neo4j stays the single source of truth
// for facts; this file owns only the *selection* and the *editorial voice*.
//
// ⚠️ RECONCILE-WITH-PHASE-0 (data audit, currently BLOCKED — Aura unreachable
// via MCP). The `id` values below are PLAUSIBLE Wikidata-anchored ids in the
// canonical `wikidata:Q…` form the schema uses (docs/FRONTEND.md). They are
// NOT yet verified against the live graph. Every id here MUST be reconciled to
// a real Neo4j node `id` during Phase 0 / the data audit before launch — a
// curated pick whose id is absent from Neo4j is silently dropped by the
// hydration query (see worker/endpoints.ts curated handler), so a stale id
// means a missing card, not a crash. This list is pure data (no React, no
// fetch) so it is importable from both the worker and the frontend.

export interface CuratedPick {
  /** Neo4j node `id` (canonical `wikidata:Q…`). Reconcile in Phase 0. */
  id: string
  /** Hand-written editorial hook line. Kept short — one breath. */
  hook: string
}

export const CURATED: readonly CuratedPick[] = [
  {
    id: 'wikidata:Q93341',
    hook: 'Reinvented jazz five times and never looked back.',
  },
  {
    id: 'wikidata:Q7346',
    hook: 'Chased one sound so hard it became a kind of prayer.',
  },
  {
    id: 'wikidata:Q244674',
    hook: 'The most lyrical touch the piano trio ever knew.',
  },
  {
    id: 'wikidata:Q190089',
    hook: 'Wrote the angles everyone else has been rounding off since.',
  },
  {
    id: 'wikidata:Q379938',
    hook: 'Found the church in hard bop and made it swing.',
  },
  {
    id: 'wikidata:Q186144',
    hook: 'Composed like a novelist and led like a storm.',
  },
  {
    id: 'wikidata:Q272203',
    hook: 'The drummer whose press roll launched a thousand careers.',
  },
  {
    id: 'wikidata:Q190048',
    hook: 'Bridged acoustic fire and electric futures without a seam.',
  },
  {
    id: 'wikidata:Q345494',
    hook: 'The composer the composers listened to.',
  },
  {
    id: 'wikidata:Q319880',
    hook: 'Made the alto sound like a man laughing and weeping at once.',
  },
  {
    id: 'wikidata:Q215300',
    hook: 'Took the tenor to the bridge and came back changed.',
  },
  {
    id: 'wikidata:Q319714',
    hook: 'Played the guitar with his thumb and outran everyone anyway.',
  },
] as const
