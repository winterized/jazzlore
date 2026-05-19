// Home-screen curated list — hand-picked canonical jazz figures + a
// hand-written one-line editorial "hook" each (decision 1 in the v1 plan).
//
// The BFF (`/api/musicians/curated`) reads this list and HYDRATES live
// name / photo / subtitle from Neo4j — Neo4j stays the single source of truth
// for facts; this file owns only the *selection* and the *editorial voice*.
//
// ✅ CANONICAL IDS RE-PINNED (2026-05-19, post P0 duplicate-merge, per the
// authoritative DB-populator hand-off). The canonical id scheme is now
// `wikidata:Q…` post-enrichment: `musicbrainz:<uuid>` was only ever the
// pre-enrichment placeholder, the P0 merge (698 pairs) made the `wikidata:`
// node the survivor of each musicbrainz↔wikidata twin, and **ids are stable
// from here**. Each `id` below is the canonical survivor; the hand-written
// hooks are kept VERBATIM (each was authored for that specific musician).
//
// Old→new mapping: `data/id_aliases.jsonl` in the populator repo is the
// authoritative old→new map (761 `{old_id,new_id,name}` lines), and every
// surviving node carries an `also_known_as_ids` list so legacy
// `musicbrainz:` URLs still resolve:
//   MATCH (m:Musician) WHERE $oldId IN m.also_known_as_ids RETURN m
//
// Enrichment status: the 12 curated picks + the top-50 sidemen are enriched
// this pass (real name / photo / bio / instruments hydrate with NO frontend
// change). The full top-2,000 enrichment is a later populator run, so some
// NON-curated detail pages may still render sparse — that sparse state is
// handled by design (Antoine-style absent-field rendering), not a bug.
//
// This list is pure data (no React, no fetch) so it is importable from both
// the worker and the frontend.

export interface CuratedPick {
  /** Canonical Neo4j node `id` — `wikidata:Q…` post-enrichment (the P0 merge
   * made the `wikidata:` node the survivor; ids stable from here). Legacy
   * `musicbrainz:` ids still resolve via each node's `also_known_as_ids`. */
  id: string
  /** Hand-written editorial hook line. Kept short — one breath. */
  hook: string
}

export const CURATED: readonly CuratedPick[] = [
  {
    // Miles Davis (wikidata:Q93341) — canonical survivor, enriched this pass
    id: 'wikidata:Q93341',
    hook: 'Reinvented jazz five times and never looked back.',
  },
  {
    // John Coltrane (wikidata:Q7346) — canonical survivor, enriched this pass
    id: 'wikidata:Q7346',
    hook: 'Chased one sound so hard it became a kind of prayer.',
  },
  {
    // Bill Evans the PIANIST (wikidata:Q208205, 1929–1980) — the iconic trio
    // pianist. The previously-pinned musicbrainz:8c7aa18e… was Bill Evans the
    // SAXOPHONIST (wikidata:Q862106), a different person. Q862106 still carries
    // ~112 mis-attributed collaboration edges (an upstream MusicBrainz issue,
    // tracked as populator repo issue #2, not yet split) — that over-connection
    // is a known upstream data artifact, not ours to fix; Q208205 is the
    // correct node for this curated card.
    id: 'wikidata:Q208205',
    hook: 'The most lyrical touch the piano trio ever knew.',
  },
  {
    // Thelonious Monk (wikidata:Q109612) — canonical survivor, enriched this pass
    id: 'wikidata:Q109612',
    hook: 'Wrote the angles everyone else has been rounding off since.',
  },
  {
    // Bobby Timmons (wikidata:Q132341) — canonical survivor, enriched this pass
    id: 'wikidata:Q132341',
    hook: 'Found the church in hard bop and made it swing.',
  },
  {
    // Charles Mingus (wikidata:Q107432) — canonical survivor, enriched this pass
    id: 'wikidata:Q107432',
    hook: 'Composed like a novelist and led like a storm.',
  },
  {
    // Art Blakey (wikidata:Q311715) — canonical survivor, enriched this pass
    id: 'wikidata:Q311715',
    hook: 'The drummer whose press roll launched a thousand careers.',
  },
  {
    // Herbie Hancock (wikidata:Q105875) — canonical survivor, enriched this pass
    id: 'wikidata:Q105875',
    hook: 'Bridged acoustic fire and electric futures without a seam.',
  },
  {
    // Wayne Shorter (wikidata:Q317161) — canonical survivor, enriched this pass
    id: 'wikidata:Q317161',
    hook: 'The composer the composers listened to.',
  },
  {
    // Cannonball Adderley (wikidata:Q110477) — canonical survivor, enriched this pass
    id: 'wikidata:Q110477',
    hook: 'Made the alto sound like a man laughing and weeping at once.',
  },
  {
    // Sonny Rollins (wikidata:Q299208) — canonical survivor, enriched this pass
    id: 'wikidata:Q299208',
    hook: 'Took the tenor to the bridge and came back changed.',
  },
  {
    // Wes Montgomery (wikidata:Q298601) — canonical survivor, enriched this pass
    id: 'wikidata:Q298601',
    hook: 'Played the guitar with his thumb and outran everyone anyway.',
  },
] as const
