// Home-screen curated list — hand-picked canonical jazz figures + a
// hand-written one-line editorial "hook" each (decision 1 in the v1 plan).
//
// The BFF (`/api/musicians/curated`) reads this list and HYDRATES live
// name / photo / subtitle from Neo4j — Neo4j stays the single source of truth
// for facts; this file owns only the *selection* and the *editorial voice*.
//
// ✅ RESTORED ICONIC CANON (2026-05-18, live Aura HTTP lookup — see
// docs/data-audit.md §5 + docs/db-feedback.md). USER DECISION: no substitutes —
// the originally-intended 12 iconic figures (Miles Davis, John Coltrane, Bill
// Evans, Thelonious Monk, Bobby Timmons, Charles Mingus, Art Blakey, Herbie
// Hancock, Wayne Shorter, Cannonball Adderley, Sonny Rollins, Wes Montgomery)
// with their original hand-written hooks (kept VERBATIM — each hook was
// authored for that specific musician). The original placeholder
// `wikidata:Q…` ids resolved 0/12; each `id` below is now the REAL Neo4j node
// `id` found via a read-only case-insensitive name lookup against live Aura.
// Every one resolves (smoke: 12/12) — but ALL 12 are currently sparse
// `musicbrainz:` stubs (no bio, no picture, no instruments). When a name had
// multiple nodes the highest-collaboration node was chosen so the card at
// least has a populated graph (recorded in docs/data-audit.md §5).
//
// ⚠️ BY DESIGN FOR v1: these cards render SPARSE — name + hook only, no photo
// and no bio — because the canonical giants are not yet enriched upstream.
// This is an ACCEPTED PRODUCT DECISION, not a frontend bug: the deficiency is
// owned by the Neo4j DB-populator. The full enrichment brief (priority,
// required fields, the duplicate-merge keystone) is in
// `apps/musicians/docs/db-feedback.md`. Once the populator enriches these 12
// (and merges the musicbrainz↔wikidata twin pairs), the same ids hydrate with
// real photos + bios with NO frontend change.
//
// This list is pure data (no React, no fetch) so it is importable from both
// the worker and the frontend.

export interface CuratedPick {
  /** Neo4j node `id`. Currently a sparse `musicbrainz:<uuid>` stub for all 12
   * (upstream enrichment pending — see docs/db-feedback.md). */
  id: string
  /** Hand-written editorial hook line. Kept short — one breath. */
  hook: string
}

export const CURATED: readonly CuratedPick[] = [
  {
    // Miles Davis — sparse stub (pending upstream enrichment)
    id: 'musicbrainz:561d854a-6a28-4aa7-8c99-323e6ce46c2a',
    hook: 'Reinvented jazz five times and never looked back.',
  },
  {
    // John Coltrane — sparse stub (pending upstream enrichment)
    id: 'musicbrainz:b625448e-bf4a-41c3-a421-72ad46cdb831',
    hook: 'Chased one sound so hard it became a kind of prayer.',
  },
  {
    // Bill Evans — sparse stub; highest-collab node of 3 same-name nodes
    id: 'musicbrainz:8c7aa18e-9392-47c7-9d56-97d34d746a8b',
    hook: 'The most lyrical touch the piano trio ever knew.',
  },
  {
    // Thelonious Monk — sparse stub (pending upstream enrichment)
    id: 'musicbrainz:8e8c7417-c905-46b1-b42a-5260b4274ed4',
    hook: 'Wrote the angles everyone else has been rounding off since.',
  },
  {
    // Bobby Timmons — sparse stub (pending upstream enrichment)
    id: 'musicbrainz:ef05197e-aacb-4dbf-9cc4-2a9abee82f03',
    hook: 'Found the church in hard bop and made it swing.',
  },
  {
    // Charles Mingus — sparse stub (pending upstream enrichment)
    id: 'musicbrainz:f3b8e107-abe8-4743-b6a3-4a4ee995e71f',
    hook: 'Composed like a novelist and led like a storm.',
  },
  {
    // Art Blakey — sparse stub (pending upstream enrichment)
    id: 'musicbrainz:601e7466-eaf5-4a91-9909-ffd770b7e04a',
    hook: 'The drummer whose press roll launched a thousand careers.',
  },
  {
    // Herbie Hancock — sparse stub (pending upstream enrichment)
    id: 'musicbrainz:27613b78-1b9d-4ec3-9db5-fa0743465fdd',
    hook: 'Bridged acoustic fire and electric futures without a seam.',
  },
  {
    // Wayne Shorter — sparse stub (pending upstream enrichment)
    id: 'musicbrainz:2379937f-6e0d-46a2-b8ff-633fafd72002',
    hook: 'The composer the composers listened to.',
  },
  {
    // Cannonball Adderley — sparse stub (pending upstream enrichment)
    id: 'musicbrainz:a4c73ebe-b2c7-4f13-b99d-2fe1f9f27da8',
    hook: 'Made the alto sound like a man laughing and weeping at once.',
  },
  {
    // Sonny Rollins — sparse stub (pending upstream enrichment)
    id: 'musicbrainz:3b47247e-5b57-49b6-a0ed-bad80243802a',
    hook: 'Took the tenor to the bridge and came back changed.',
  },
  {
    // Wes Montgomery — sparse stub (pending upstream enrichment)
    id: 'musicbrainz:663f8232-8c46-4851-803f-a91d31593b14',
    hook: 'Played the guitar with his thumb and outran everyone anyway.',
  },
] as const
