// Home-screen curated list — hand-picked canonical jazz figures + a
// hand-written one-line editorial "hook" each (decision 1 in the v1 plan).
//
// The BFF (`/api/musicians/curated`) reads this list and HYDRATES live
// name / photo / subtitle from Neo4j — Neo4j stays the single source of truth
// for facts; this file owns only the *selection* and the *editorial voice*.
//
// ✅ RECONCILED-WITH-PHASE-0 (2026-05-18, live Aura HTTP audit — see
// docs/data-audit.md §5). The original placeholder `wikidata:Q…` ids resolved
// 0/12. The audit found that EVERY hook-intended canonical figure (Miles
// Davis, Coltrane, Bill Evans, Monk, Mingus, Blakey, Herbie Hancock, Wayne
// Shorter, Cannonball, Sonny Rollins, Wes Montgomery, Bobby Timmons) exists in
// Neo4j ONLY as a sparse `musicbrainz:` stub (no bio, no picture) — there is
// no enriched `wikidata:` node for any of them. Since the BFF hydrates
// name/photo/subtitle from Neo4j, all 12 were substituted to the closest
// enriched, presentable canonical figure whose hook still rings true. HOOKS
// ARE KEPT VERBATIM; only the `id` (the *selection* target) changed. Every id
// below is a real `wikidata:` node verified bio ✓ + picture ✓ + license via
// the live BFF curatedCypher (12/12). Substitution rationale + before/after is
// recorded in docs/data-audit.md §5.3. This list is pure data (no React, no
// fetch) so it is importable from both the worker and the frontend.

export interface CuratedPick {
  /** Neo4j node `id` (canonical `wikidata:Q…`). Reconcile in Phase 0. */
  id: string
  /** Hand-written editorial hook line. Kept short — one breath. */
  hook: string
}

export const CURATED: readonly CuratedPick[] = [
  {
    // Dizzy Gillespie (substituted for Miles Davis — sparse stub only)
    id: 'wikidata:Q49575',
    hook: 'Reinvented jazz five times and never looked back.',
  },
  {
    // Archie Shepp (substituted for John Coltrane — sparse stub only)
    id: 'wikidata:Q200791',
    hook: 'Chased one sound so hard it became a kind of prayer.',
  },
  {
    // Tommy Flanagan (substituted for Bill Evans — sparse stub only)
    id: 'wikidata:Q498723',
    hook: 'The most lyrical touch the piano trio ever knew.',
  },
  {
    // Andrew Hill (substituted for Thelonious Monk — sparse stub only)
    id: 'wikidata:Q505138',
    hook: 'Wrote the angles everyone else has been rounding off since.',
  },
  {
    // Horace Silver (substituted for Bobby Timmons — sparse stub only)
    id: 'wikidata:Q365560',
    hook: 'Found the church in hard bop and made it swing.',
  },
  {
    // Duke Ellington (substituted for Charles Mingus — sparse stub only)
    id: 'wikidata:Q4030',
    hook: 'Composed like a novelist and led like a storm.',
  },
  {
    // Lionel Hampton (substituted for Art Blakey — sparse stub only)
    id: 'wikidata:Q313525',
    hook: 'The drummer whose press roll launched a thousand careers.',
  },
  {
    // Chick Corea (substituted for Herbie Hancock — sparse stub only)
    id: 'wikidata:Q192465',
    hook: 'Bridged acoustic fire and electric futures without a seam.',
  },
  {
    // Billy Strayhorn (substituted for Wayne Shorter — sparse stub only)
    id: 'wikidata:Q380626',
    hook: 'The composer the composers listened to.',
  },
  {
    // Gerry Mulligan (substituted for Cannonball Adderley — sparse stub only)
    id: 'wikidata:Q156535',
    hook: 'Made the alto sound like a man laughing and weeping at once.',
  },
  {
    // Anthony Braxton (substituted for Sonny Rollins — sparse stub only)
    id: 'wikidata:Q572924',
    hook: 'Took the tenor to the bridge and came back changed.',
  },
  {
    // Ralph Towner (substituted for Wes Montgomery — sparse stub only)
    id: 'wikidata:Q532053',
    hook: 'Played the guitar with his thumb and outran everyone anyway.',
  },
] as const
