// Jazzlore Musicians — frozen domain contract (Phase B).
//
// These types ARE the contract every downstream phase (C BFF, D mobile reader,
// E desktop graph) codes against. Pure data shapes: no React, no fetch, no
// runtime. Optionality is modelled faithfully from `docs/FRONTEND.md` — the
// schema marks the great majority of fields "may be absent", so under
// `strict` + `noUncheckedIndexedAccess` optional fields are `?: T` (callers
// must narrow `T | undefined`). Sparse musicians are the norm, not the edge.
//
// Reconcile-with-Phase-0: see `./README.md`. Phase 0 (live Aura audit) may
// confirm or correct exact field names; that reconciliation is intended to be
// a localized change to `map.ts` plus the raw-row types below, not a contract
// reshape for C/D/E.

// ─── Raw Neo4j shapes (Aura HTTP Query API row payloads) ──────────────────
// Mirrors `docs/FRONTEND.md` property tables 1:1. Every "may be absent" field
// is optional. Aura returns absent properties as missing keys (not null), but
// we tolerate `null` defensively in the mapper.

export interface RawMusician {
  id: string
  name: string
  aka?: string[]
  primary_instruments?: string[]
  all_instruments?: string[]
  birth_year?: number
  birth_date?: string
  birth_place?: string
  death_year?: number
  death_date?: string
  death_place?: string
  years_active_start?: number
  years_active_end?: number
  nationality?: string
  genres?: string[]
  picture_url?: string
  picture_license?: string
  picture_attribution?: string
  wikipedia_url?: string
  wikidata_id?: string
  musicbrainz_id?: string
  discogs_id?: string
  /** Pre-P0 ids whose canonical survivor IS this node. The populator's
   * P0 duplicate-merge collapsed `musicbrainz:` twins into `wikidata:`
   * survivors and recorded the old ids here (every alias is the
   * `musicbrainz:` form, never `wikidata:` → `wikidata:`). The BFF's
   * `detailCypher` widens MATCH on this list so legacy / shared URLs
   * still resolve to the survivor (`apps/musicians/worker/cypher.ts`
   * detailCypher; closes issue #84). Source-of-truth alias map:
   * `JazzDBPopulator/data/id_aliases.jsonl` (3,436 entries). */
  also_known_as_ids?: string[]
  bio_summary?: string
  /** Spotify artist-page deep-link (tier-2 Listen fallback). Sourced from
   * MusicBrainz URL relationships by the populator (`streaming_ids.jsonl`).
   * Absent on the long-tail; absent when the populator's MB lookup yielded
   * nothing. */
  spotify_artist_url?: string
  /** Apple Music artist-page deep-link (tier-2 Listen fallback). Same shape +
   * provenance as `spotify_artist_url`; Apple coverage from MB is lower
   * (~30% vs Spotify's ~50% per the populator's resolver stats). */
  apple_artist_url?: string
}

export type RecordType =
  | 'album'
  | 'ep'
  | 'single'
  | 'compilation'
  | 'live'
  | 'soundtrack'
  | 'other'

export interface RawRecord {
  id: string
  title: string
  type?: RecordType
  secondary_types?: string[]
  is_various_artists?: boolean
  release_year?: number
  recording_year?: number
  recording_location?: string
  label?: string
  catalog_number?: string
  producer?: string[]
  engineer?: string[]
  track_count?: number
  cover_art_url?: string
  cover_art_license?: string
  wikipedia_url?: string
  wikidata_id?: string
  musicbrainz_id?: string
  discogs_id?: string
}

export type PlayedOnRole =
  | 'leader'
  | 'co-leader'
  | 'sideman'
  | 'guest'
  | 'vocalist'
  | 'composer'
  | 'arranger'

export interface RawPlayedOn {
  instruments?: string[]
  role?: PlayedOnRole
  // FRONTEND.md: literal string "all" OR a list of track numbers.
  tracks?: 'all' | number[]
}

// ─── Domain / UI types (what C produces and D/E consume) ──────────────────

/** Image-attribution inputs carried verbatim from Neo4j. The caption builder
 * (`attribution.ts`) decides whether a caption renders; the spec's legal rule
 * is "render whenever ANY of these is non-empty". */
export interface ImageAttribution {
  url?: string
  license?: string
  attribution?: string
}

/** A record a musician shaped. `primaryArtist` is DERIVED (see map.ts /
 * README reconcile note) — the schema has no explicit primary-artist field;
 * it's the leader/co-leader on the record, falling back to a caller-supplied
 * name so deep-links never read "<title> undefined". */
export interface RecordRef {
  id: string
  title: string
  primaryArtist?: string
  type?: RecordType
  releaseYear?: number
  recordingYear?: number
  label?: string
  catalogNumber?: string
  trackCount?: number
  cover: ImageAttribution
  links: {
    wikipediaUrl?: string
    wikidataId?: string
    musicbrainzId?: string
    discogsId?: string
  }
}

/** A musician derived as a collaborator of the focus musician: they share at
 * least one `:Record` via `:PLAYED_ON`. Aggregated server-side (Phase C). */
export interface Collaborator {
  id: string
  name: string
  /** primary_instruments[0] when present; UI shows this + relationship. */
  instrument?: string
  /** Free-text relationship line (e.g. "Messengers frontline, 1958–60"); the
   * schema has no such field — left optional, populated editorially / by the
   * BFF if/when derivable. */
  relationship?: string
  /** Count of DISTINCT shared records (collaboration strength). */
  sharedRecordCount: number
  /** The "defining" shared record. Assumption (reconcile-with-Phase-0):
   * earliest `release_year` shared record, ties broken by record id for
   * determinism. The schema exposes no significance metric. */
  topRecord?: { title: string; year?: number }
  /** `picture_url` presence ONLY — never a name heuristic (landmine 10). */
  photo: boolean
}

/** Full musician detail — the `/api/musicians/:id` payload shape. Sparse by
 * default: nearly everything past `id`/`name` may be absent. */
export interface MusicianDetail {
  id: string
  name: string
  aka: string[]
  primaryInstruments: string[]
  allInstruments: string[]
  birthYear?: number
  birthDate?: string
  birthPlace?: string
  deathYear?: number
  deathDate?: string
  deathPlace?: string
  yearsActiveStart?: number
  yearsActiveEnd?: number
  nationality?: string
  genres: string[]
  /** Pre-computed editorial era label (e.g. "Hard bop"). NOT a Neo4j field —
   * the BFF may set it from genres/years; Phase B does not invent a taxonomy
   * (left to C). Absent until then. */
  era?: string
  bioSummary?: string
  portrait: ImageAttribution
  /** `picture_url` presence ONLY (landmine 10). Mirrors `portrait.url`. */
  photo: boolean
  links: {
    wikipediaUrl?: string
    wikidataId?: string
    musicbrainzId?: string
    discogsId?: string
    /** Spotify artist-page deep-link (tier-2 Listen fallback). Sourced from
     * MB URL relationships by the populator. Absent on the long-tail and
     * any musician the populator's MB lookup didn't resolve. */
    spotifyArtistUrl?: string
    /** Apple Music artist-page deep-link (tier-2 Listen fallback). Same
     * shape + provenance as `spotifyArtistUrl`. */
    appleArtistUrl?: string
  }
  /** Ranked collaborators (BFF aggregates + orders; the mapper preserves the
   * order it is given — no client/mapper dedup, landmine 11). */
  collaborators: Collaborator[]
  /** Records the musician shaped. */
  records: RecordRef[]
}

/** A home-screen curated card: hand-picked id + hand-written hook from
 * `src/data/curated.ts`, hydrated with live name/photo from Neo4j (Phase C). */
export interface CuratedCard {
  id: string
  name: string
  /** Hand-written editorial hook line (from the repo curated list). */
  hook: string
  /** primary_instruments[0] + era line, when known. */
  subtitle?: string
  photo: boolean
  portrait: ImageAttribution
}

/** One row of the client-side autosuggest corpus
 * (`/api/musicians/search-index`). Small, slow-changing, matched client-side
 * with accent-folding (`fold.ts`). Duplicates are NOT removed (landmine 11). */
export interface SearchCorpusEntry {
  id: string
  name: string
  aka: string[]
  primaryInstrument?: string
  era?: string
}

// ─── Desktop graph ────────────────────────────────────────────────────────

export interface GraphNode {
  id: string
  name: string
  instrument?: string
  /** Node size encoding = record count (shared with the focus musician, or
   * total for the focus node). */
  recordCount: number
  /** True for the focus / centre musician of this graph. */
  focus: boolean
}

export interface GraphEdge {
  source: string
  target: string
  /** Edge thickness encoding = collaboration strength (shared record count). */
  weight: number
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

// ─── BFF response envelopes ───────────────────────────────────────────────
// One page load = one BFF call. Each endpoint returns `Ok<T>` on success or
// the shared `Waking` 503 shape when Aura is cold (AbortController ~9s).

/** Aura is paused/cold (auto-pauses after 3 days idle; first request 20–40s).
 * The BFF aborts ~9s and returns this with HTTP 503. The frontend renders the
 * designed calm "waking up" state + retry countdown. */
export interface WakingResponse {
  status: 'waking'
  /** Seconds the client should wait before retrying. */
  retryAfter: number
}

export interface CuratedResponse {
  curated: CuratedCard[]
}

export type MusicianDetailResponse = MusicianDetail

export interface GraphResponse {
  graph: GraphData
}

export interface SearchIndexResponse {
  corpus: SearchCorpusEntry[]
}

export interface HealthResponse {
  status: 'ok'
  musicianCount: number
}

/** Any successful endpoint payload OR the cold-Aura 503 shape. Discriminate
 * on the HTTP status / the `"status":"waking"` tag. */
export type BffResponse<T> = T | WakingResponse

/** Narrowing helper for the union above. Pure, no side effects. */
export function isWaking(r: unknown): r is WakingResponse {
  return (
    typeof r === 'object' &&
    r !== null &&
    (r as { status?: unknown }).status === 'waking'
  )
}
