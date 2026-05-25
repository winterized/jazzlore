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
// 🎧 Tier-1 listening data (2026-05-24): each pick carries a hand-picked
// `listen` block — signature track + source record + Spotify/Apple Music
// share URLs. These are hand-curated public catalog URLs (no auth, no
// keys). Editorial picks; some diverge from algorithmic-popular on purpose
// (see `docs/listening-tier2-readiness.md` for the rationale and Tier-2
// automation plan).
//
// This list is pure data (no React, no fetch) so it is importable from both
// the worker and the frontend.

export interface CuratedListenLink {
  /** Display title of the signature track. */
  trackTitle: string
  /** Source record — album title + year — that the chosen recording is from. */
  sourceRecord: string
  /** open.spotify.com/track/<id> share URL. */
  spotify: string
  /** music.apple.com share URL (song deep-link preferred; album-level when
   * Apple Music didn't expose a deep-linkable song URL). */
  apple: string
}

export interface CuratedPick {
  /** Canonical Neo4j node `id` — `wikidata:Q…` post-enrichment (the P0 merge
   * made the `wikidata:` node the survivor; ids stable from here). Legacy
   * `musicbrainz:` ids still resolve via each node's `also_known_as_ids`. */
  id: string
  /** Hand-written editorial hook line. Kept short — one breath. */
  hook: string
  /** Tier-1 hand-picked signature track for the home-screen "Listen" CTA. */
  listen: CuratedListenLink
}

export const CURATED: readonly CuratedPick[] = [
  {
    // Miles Davis (wikidata:Q93341) — canonical survivor, enriched this pass
    id: 'wikidata:Q93341',
    hook: 'Reinvented jazz five times and never looked back.',
    listen: {
      trackTitle: 'So What',
      sourceRecord: 'Kind of Blue (1959)',
      spotify: 'https://open.spotify.com/track/7azylXFRsebfrIoAtwfjaB',
      apple: 'https://music.apple.com/us/song/so-what/300865220',
    },
  },
  {
    // John Coltrane (wikidata:Q7346) — canonical survivor, enriched this pass
    id: 'wikidata:Q7346',
    hook: 'Chased one sound so hard it became a kind of prayer.',
    listen: {
      trackTitle: 'A Love Supreme, Pt. I — Acknowledgement',
      sourceRecord: 'A Love Supreme (1965)',
      spotify: 'https://open.spotify.com/track/1W1ELMoK1boorGsH40Ydgf',
      apple: 'https://music.apple.com/us/song/a-love-supreme-part-i-acknowledgement/1443736684',
    },
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
    listen: {
      trackTitle: 'Waltz for Debby',
      sourceRecord: 'Waltz for Debby — Live at the Village Vanguard, 1961',
      spotify: 'https://open.spotify.com/track/6EC51OfUhguCbNp5H5SdGm',
      apple: 'https://music.apple.com/us/song/waltz-for-debby-take-2-live-at-the-village-vanguard-1961/1692921505',
    },
  },
  {
    // Thelonious Monk (wikidata:Q109612) — canonical survivor, enriched this pass
    id: 'wikidata:Q109612',
    hook: 'Wrote the angles everyone else has been rounding off since.',
    listen: {
      // The 1947 Blue Note original — Monk's first recording of his most-
      // covered composition (Nov 21, 1947). Editorial choice over the 1957
      // quartet w/ Coltrane or the 1963 Columbia takes.
      trackTitle: "'Round Midnight",
      sourceRecord: 'Genius of Modern Music, Vol. 1 (1947)',
      spotify: 'https://open.spotify.com/track/132laFkfrF8gqV0QiZp8hS',
      apple: 'https://music.apple.com/us/song/round-midnight/1459444213',
    },
  },
  {
    // Bobby Timmons (wikidata:Q132341) — canonical survivor, enriched this pass
    id: 'wikidata:Q132341',
    hook: 'Found the church in hard bop and made it swing.',
    listen: {
      // Timmons's own trio cut of his composition (with Sam Jones, Jimmy
      // Cobb) on his Riverside leader debut — editorial choice over the
      // better-known Blakey & The Jazz Messengers version on Moanin' (1958).
      trackTitle: "Moanin'",
      sourceRecord: 'This Here Is Bobby Timmons (1960)',
      spotify: 'https://open.spotify.com/track/5U66z6J7VpEA9XV9BpePwh',
      apple: 'https://music.apple.com/us/song/moanin/898527528',
    },
  },
  {
    // Charles Mingus (wikidata:Q107432) — canonical survivor, enriched this pass
    id: 'wikidata:Q107432',
    hook: 'Composed like a novelist and led like a storm.',
    listen: {
      trackTitle: 'Goodbye Pork Pie Hat',
      sourceRecord: 'Mingus Ah Um (1959)',
      spotify: 'https://open.spotify.com/track/5eKnpzuUKdgjAKqEpWtbwD',
      apple: 'https://music.apple.com/us/song/goodbye-pork-pie-hat/282907093',
    },
  },
  {
    // Art Blakey (wikidata:Q311715) — canonical survivor, enriched this pass
    id: 'wikidata:Q311715',
    hook: 'The drummer whose press roll launched a thousand careers.',
    listen: {
      // The studio Blue Note recording with Blakey's iconic press-roll intro
      // (the hook references it directly). "Moanin'" — also iconic with the
      // press roll — is assigned to Timmons (its composer) on this list.
      trackTitle: 'A Night in Tunisia',
      sourceRecord: 'A Night in Tunisia (1960)',
      spotify: 'https://open.spotify.com/track/6DH9qxj2GJi0lU2Y5FDHky',
      apple: 'https://music.apple.com/us/song/a-night-in-tunisia/1440822361',
    },
  },
  {
    // Herbie Hancock (wikidata:Q105875) — canonical survivor, enriched this pass
    id: 'wikidata:Q105875',
    hook: 'Bridged acoustic fire and electric futures without a seam.',
    listen: {
      trackTitle: 'Cantaloupe Island',
      sourceRecord: 'Empyrean Isles (1964)',
      spotify: 'https://open.spotify.com/track/0sCeNwt8xRCMR4NhKpMyBe',
      apple: 'https://music.apple.com/us/song/cantaloupe-island-remastered-1999-rudy-van-gelder-edition/1442306278',
    },
  },
  {
    // Wayne Shorter (wikidata:Q317161) — canonical survivor, enriched this pass
    id: 'wikidata:Q317161',
    hook: 'The composer the composers listened to.',
    listen: {
      // Shorter's own first cut on Adam's Apple (Feb 1966), ~7 months before
      // the Miles Davis Quintet's (faster) Miles Smiles version.
      trackTitle: 'Footprints',
      sourceRecord: "Adam's Apple (1966)",
      spotify: 'https://open.spotify.com/track/0ZqVnW4slMB1bJSAN4ghpe',
      apple: 'https://music.apple.com/us/song/footprints/715539172',
    },
  },
  {
    // Cannonball Adderley (wikidata:Q110477) — canonical survivor, enriched this pass
    id: 'wikidata:Q110477',
    hook: 'Made the alto sound like a man laughing and weeping at once.',
    listen: {
      trackTitle: 'Mercy, Mercy, Mercy',
      sourceRecord: 'Mercy, Mercy, Mercy! Live at "The Club" (1966)',
      spotify: 'https://open.spotify.com/track/2Ge4ycD3TFKsSlabiZqlWW',
      apple: 'https://music.apple.com/us/song/mercy-mercy-mercy-live/723778431',
    },
  },
  {
    // Sonny Rollins (wikidata:Q299208) — canonical survivor, enriched this pass
    id: 'wikidata:Q299208',
    hook: 'Took the tenor to the bridge and came back changed.',
    listen: {
      // The universal Rollins signature. Hook poetically references the
      // Williamsburg-Bridge sabbatical that birthed The Bridge (1962), but
      // St. Thomas from Saxophone Colossus remains the defining track.
      trackTitle: 'St. Thomas',
      sourceRecord: 'Saxophone Colossus (1956)',
      spotify: 'https://open.spotify.com/track/0zQE77yszbyv61M4NboU2u',
      apple: 'https://music.apple.com/us/song/st-thomas/646199695',
    },
  },
  {
    // Wes Montgomery (wikidata:Q298601) — canonical survivor, enriched this pass
    id: 'wikidata:Q298601',
    hook: 'Played the guitar with his thumb and outran everyone anyway.',
    listen: {
      trackTitle: 'Four on Six',
      sourceRecord: 'The Incredible Jazz Guitar of Wes Montgomery (1960)',
      spotify: 'https://open.spotify.com/track/2Mq2Fzc9HBgvsijVFdSXUl',
      apple: 'https://music.apple.com/us/song/four-on-six/1440940107',
    },
  },
] as const

/** Musicians that get a tier-1 hand-picked Listen track but are NOT on the
 * home grid (`CURATED` stays at 12 by design). Combined with `CURATED` at
 * the DetailIdentity Listen-resolver to produce the full tier-1 lookup
 * map. Source: `JazzDBPopulator/data/streaming_overrides.jsonl`. */
export interface ListenExtra {
  id: string
  listen: CuratedListenLink
}

export const LISTEN_EXTRAS: readonly ListenExtra[] = [
  {
    // John Lewis (wikidata:Q353943) — MJQ leader/composer. Tier-1 hand
    // override; both Spotify + Apple were missing in MusicBrainz so the
    // populator owner seeded these by hand post-Stage-1.
    id: 'wikidata:Q353943',
    listen: {
      trackTitle: 'The Bad and the Beautiful',
      sourceRecord: 'The Bad and the Beautiful (1956)',
      spotify: 'https://open.spotify.com/track/4THfJ8Tx9uuFoTjPupXrqE',
      apple: 'https://music.apple.com/us/song/the-bad-and-the-beautiful/310535006',
    },
  },
] as const
