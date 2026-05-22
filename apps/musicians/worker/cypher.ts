// Parameterized, READ-ONLY Cypher builders + Aura-row reshapers (Phase C).
//
// Conventions (apps/musicians/CLAUDE.md "BFF / Cypher conventions"):
//  - Every query is PARAMETERIZED ($id, $ids) — never string-interpolated.
//  - Every query is READ-ONLY: MATCH … RETURN only. No CREATE/MERGE/SET/
//    DELETE/REMOVE/CALL{…write}. `assertReadOnly` enforces this at the seam.
//  - The query RETURNs node/edge maps shaped to mirror docs/FRONTEND.md so the
//    FROZEN pure mappers in ../src/lib/map consume them unchanged. We do not
//    reimplement mapping here — only fetch + reshape into the raw fixtures
//    shapes (RawDetailResult / RawCollaboratorRow / RawMusician).

import type {
  RawMusician,
  RawPlayedOn,
  RawRecord,
} from '../src/lib/types'
import type {
  RawCollaboratorRow,
  RawDetailResult,
} from '../src/lib/fixtures'
import type { AuraResult } from './aura'
import { col } from './aura'

// ─── Read-only guard ──────────────────────────────────────────────────────
const WRITE_CLAUSE =
  /\b(CREATE|MERGE|DELETE|REMOVE|DROP|FOREACH)\b|\bSET\b(?!\s+OF\b)/i

/** Throws if a statement contains a write clause. Defense-in-depth: every
 * builder below is read-only by construction; this catches regressions. */
export function assertReadOnly(statement: string): string {
  if (WRITE_CLAUSE.test(statement)) {
    throw new Error(`refusing non-read-only Cypher: ${statement}`)
  }
  return statement
}

// ─── Cypher builders (all read-only, all parameterized) ───────────────────

/** Health probe — trivial count (technical note "/api/health"). */
export function healthCypher(): string {
  return assertReadOnly('MATCH (m:Musician) RETURN count(m) AS n')
}

/** Hydrate the curated picks: only nodes whose id ∈ $ids (faithful — a
 * curated id absent from Neo4j is simply not returned, never errors). */
export function curatedCypher(): string {
  return assertReadOnly(
    'MATCH (m:Musician) WHERE m.id IN $ids RETURN m{.*} AS m',
  )
}

/** The full autosuggest corpus + the external ids the duplicate-observability
 * pass inspects. Duplicates are kept faithfully (landmine 11) — no DISTINCT
 * collapse on external id. */
export function searchIndexCypher(): string {
  return assertReadOnly(
    'MATCH (m:Musician) ' +
      'RETURN m{.id, .name, .aka, .primary_instruments, ' +
      '.wikidata_id, .musicbrainz_id, .discogs_id} AS m',
  )
}

/** Peers "from the same era" — contemporaries who weren't in their bands.
 * Same-genre overlap AND overlapping years-active window (±10y), excluding
 * direct collaborators (musicians sharing any :Record via :PLAYED_ON). The
 * focus musician is also excluded by id. Returns peers ranked by genre
 * overlap, then earliest active year for determinism. Ridden on the detail
 * response as a `sameEra` SIBLING (the frozen `MusicianDetail` contract is
 * intentionally agnostic of era taxonomy — see lib/types.ts). */
export function peersByEraCypher(): string {
  return assertReadOnly(
    `MATCH (m:Musician {id: $id})
     // NULL gate: a focus musician with no recorded active window gives the
     // year-filter nothing to anchor on (coalesce defaults would otherwise
     // open the window to all eras). Return zero peers — EraStrip self-hides
     // on []. Diagnosed 2026-05-20: Antoine (years_active_* both NULL) was
     // paired with Benny Goodman / Sinatra under the open-window behavior.
     WHERE m.years_active_start IS NOT NULL
       AND m.years_active_end   IS NOT NULL
     WITH m,
          coalesce(m.genres, []) AS genres,
          m.years_active_start AS yas,
          m.years_active_end   AS yae
     MATCH (p:Musician)
     WHERE p.id <> m.id
       AND any(g IN coalesce(p.genres, []) WHERE g IN genres)
       // coalesce defaults: missing years_active_* → peer is EXCLUDED.
       // "Still active" (end = NULL) gets 0 >= yas - 10, which is false for
       // any focus with yas > 10. This is intentional: the false-positive risk
       // of silently including peers with no recorded active window outweighs
       // the false-negative of excluding sparse records. To relax to half-open
       // intervals (e.g. still-active peers included), swap the defaults to
       // coalesce(p.years_active_start, yas - 10) / coalesce(yae, 9999).
       AND coalesce(p.years_active_start, 9999) <= coalesce(yae, 9999) + 10
       AND coalesce(p.years_active_end,    0)    >= coalesce(yas, 0)    - 10
       AND NOT EXISTS {
             MATCH (m)-[:PLAYED_ON]->(:Record)<-[:PLAYED_ON]-(p)
           }
     RETURN p.id                  AS id,
            p.name                AS name,
            p.primary_instruments AS primary_instruments,
            p.picture_url         AS picture_url,
            p.picture_license     AS picture_license,
            p.picture_attribution AS picture_attribution,
            size([g IN coalesce(p.genres, []) WHERE g IN genres]) AS overlap
     ORDER BY overlap DESC, coalesce(p.years_active_start, 9999) ASC
     LIMIT $limit`,
  )
}

/** One-shot detail aggregation: focus node, the records it played on (+ its
 * own edge), and every collaborator (shared record + that collaborator's
 * edge). One page load = one BFF call (server-side aggregation).
 *
 * Collaborators are returned **sorted by shared-record count DESC, then
 * name ASC** for a stable, meaningful "Where to go from here" order — the
 * frozen mapper (`lib/map.ts`) preserves array order, so the cypher is
 * the source of truth for ranking. `count(DISTINCT sr)` matches the
 * mapper's `distinctRecordIds.size` dedup (counts distinct shared records,
 * not edge-tuples). Ties break alphabetically by name. */
export function detailCypher(): string {
  return assertReadOnly(
    `MATCH (m:Musician {id: $id})
     OPTIONAL MATCH (m)-[fe:PLAYED_ON]->(r:Record)
     WITH m, collect(DISTINCT {record: r{.*}, edge: properties(fe)}) AS records
     OPTIONAL MATCH (m)-[:PLAYED_ON]->(sr:Record)<-[ce:PLAYED_ON]-(c:Musician)
     WHERE c.id <> m.id
     WITH m, records, c,
          collect(DISTINCT {record: sr{.*}, edge: properties(ce)}) AS shared,
          count(DISTINCT sr) AS sharedCount
     ORDER BY c IS NULL, sharedCount DESC, c.name ASC
     WITH m, records,
          collect(CASE WHEN c IS NULL THEN NULL
                  ELSE {musician: c{.*}, sharedRecords: shared} END) AS collabs
     RETURN m{.*} AS m, records,
            [x IN collabs WHERE x IS NOT NULL] AS collaborators`,
  )
}

// ─── Aura-row → frozen raw-fixture-shape reshapers ────────────────────────
// These ONLY reshape; the pure mapping (raw → domain) stays in ../src/lib/map.

function asObject(v: unknown): Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {}
}

/** A raw node map from Aura → RawMusician (cast: the Cypher returns the
 * docs/FRONTEND.md property names 1:1; field-name reconciliation is Phase 0,
 * localized to this cast + the frozen fixtures, per lib/README). */
export function toRawMusician(v: unknown): RawMusician {
  return asObject(v) as unknown as RawMusician
}

function toRawRecord(v: unknown): RawRecord {
  return asObject(v) as unknown as RawRecord
}

function toRawPlayedOn(v: unknown): RawPlayedOn {
  return asObject(v) as unknown as RawPlayedOn
}

function toRecordEdgePair(v: unknown): { record: RawRecord; edge: RawPlayedOn } {
  const o = asObject(v)
  return { record: toRawRecord(o.record), edge: toRawPlayedOn(o.edge) }
}

function toCollaboratorRow(v: unknown): RawCollaboratorRow {
  const o = asObject(v)
  const shared = Array.isArray(o.sharedRecords) ? o.sharedRecords : []
  return {
    musician: toRawMusician(o.musician),
    sharedRecords: shared.map(toRecordEdgePair),
  }
}

/** Reshape the single `detailCypher` row into the frozen `RawDetailResult`
 * the pure `mapMusicianDetail` / `mapGraphData` consume. Returns null when
 * the musician id is absent (→ 404). */
export function reshapeDetail(result: AuraResult): RawDetailResult | null {
  const row = result.values[0]
  if (row === undefined) return null
  const m = col(result, row, 'm')
  if (m === null || typeof m !== 'object') return null
  const records = col(result, row, 'records')
  const collaborators = col(result, row, 'collaborators')
  return {
    musician: toRawMusician(m),
    records: (Array.isArray(records) ? records : []).map(toRecordEdgePair),
    collaborators: (Array.isArray(collaborators) ? collaborators : []).map(
      toCollaboratorRow,
    ),
  }
}

/** Reshape an `m{…}`-per-row result into `RawMusician[]` (curated hydration
 * + search corpus). Faithful: no dedup, original order preserved. */
export function reshapeMusicianRows(result: AuraResult): RawMusician[] {
  return result.values
    .map((row) => col(result, row, 'm'))
    .filter((m): m is object => m !== null && typeof m === 'object')
    .map(toRawMusician)
}

/** A peer row from `peersByEraCypher` shaped into the EraStrip `EraItem`
 * contract (see src/components/EraStrip.tsx). `photo` is a presence boolean
 * derived from `picture_url`; `portrait` carries the real `{url, license,
 * attribution}` sibling so EraStrip can render the duotone portrait (audit
 * HIGH-5 / Wave 1 PR4c). `instrument` falls back to `undefined` when no
 * primary instrument is recorded. `hint` is intentionally omitted here —
 * EraStrip tolerates it; an editorial hint may be derived later by the BFF. */
export interface PeerEraItem {
  id: string
  name: string
  instrument?: string
  hint?: string
  photo: boolean
  /** Real portrait + legal attribution (CLAUDE.md image-attribution rule).
   * Omitted when the peer has no `picture_url`. */
  portrait?: { url?: string; license?: string; attribution?: string }
}

/** Reshape a `peersByEraCypher` result into `PeerEraItem[]`. Rows with a
 * missing/non-string `id` or `name` are dropped (defensive; Cypher RETURN
 * shape is stable, but the AuraResult value tuples are `unknown`). */
export function reshapePeerEra(result: AuraResult): PeerEraItem[] {
  return result.values.flatMap((row) => {
    const id = col(result, row, 'id')
    const name = col(result, row, 'name')
    if (typeof id !== 'string' || typeof name !== 'string') return []
    const instruments = col(result, row, 'primary_instruments')
    const instrument =
      Array.isArray(instruments) && typeof instruments[0] === 'string'
        ? instruments[0]
        : undefined
    const picture = col(result, row, 'picture_url')
    const photo = typeof picture === 'string' && picture.length > 0
    const item: PeerEraItem = { id, name, photo }
    if (instrument !== undefined) item.instrument = instrument

    // Portrait sibling: carry url + license + attribution when present, so
    // EraStrip can render the duotone photo with its legal caption (audit
    // HIGH-5; same shape as ByIdsItem.portrait + the frozen ImageAttribution).
    if (photo) {
      const license = col(result, row, 'picture_license')
      const attribution = col(result, row, 'picture_attribution')
      const portrait: PeerEraItem['portrait'] = { url: picture as string }
      if (typeof license === 'string' && license.length > 0)
        portrait.license = license
      if (typeof attribution === 'string' && attribution.length > 0)
        portrait.attribution = attribution
      item.portrait = portrait
    }
    return [item]
  })
}

/** Read the single integer from a `RETURN count(m) AS n` health result. */
export function reshapeCount(result: AuraResult): number {
  const row = result.values[0]
  if (row === undefined) return 0
  const n = col(result, row, 'n')
  return typeof n === 'number' && Number.isFinite(n) ? n : 0
}

// ─── Batch by-ids ──────────────────────────────────────────────────────────

/** Minimal musician shape for the `/api/musicians/by-ids` batch endpoint.
 * Intentionally leaner than MusicianDetail — only what the portrait-render
 * consumers (JourneyDetailPage, DetailView mosaic/rail) need. */
export interface ByIdsItem {
  id: string
  name: string
  photo: boolean
  portrait: { url?: string; license?: string; attribution?: string }
  primaryInstrument?: string
}

/** Batch-fetch minimal musician data for up to N (N ≤ 20) ids.
 * Returns one row per MATCHED id (unresolved ids are silently absent). */
export function byIdsCypher(): string {
  return assertReadOnly(
    `MATCH (m:Musician) WHERE m.id IN $ids
     RETURN m.id                  AS id,
            m.name                AS name,
            m.picture_url         AS picture_url,
            m.picture_license     AS picture_license,
            m.picture_attribution AS picture_attribution,
            m.primary_instruments AS primary_instruments`,
  )
}

// ─── Polished-pool ids ────────────────────────────────────────────────────

/** All musician ids that are "polished" — the subset (~200, per audit) with
 * BOTH a bio summary AND a portrait AND a coherent active-years window.
 * Used by Random Jump (Wave 1 / PR6 / audit Quality #1, #17) to avoid
 * dropping first-time users on sparse musicians.
 *
 * The `years_active_*` clauses address the audit's CANONICAL symptom: Big
 * Joe Turner had a `picture_url` and a `bio_summary` (sparse but present)
 * but `years_active_end IS NULL`, so the page rendered "1911-present"
 * though he died in 1985. A bio + portrait alone are NOT enough — without
 * coherent years the page still teaches "this site is half-built".
 *
 * Read-only, no params; returns ids in stable name-ASC order so the random
 * pick is deterministic across page-cache hits. */
export function polishedIdsCypher(): string {
  return assertReadOnly(
    `MATCH (m:Musician)
     WHERE m.bio_summary         IS NOT NULL AND m.bio_summary <> ''
       AND m.picture_url         IS NOT NULL AND m.picture_url <> ''
       AND m.years_active_start  IS NOT NULL
       AND m.years_active_end    IS NOT NULL
     RETURN m.id AS id
     ORDER BY m.name ASC`,
  )
}

/** Reshape a `polishedIdsCypher` result into `string[]`. Rows with a
 * missing/non-string `id` are dropped defensively. */
export function reshapePolishedIds(result: AuraResult): string[] {
  return result.values.flatMap((row) => {
    const id = col(result, row, 'id')
    return typeof id === 'string' ? [id] : []
  })
}

/** Reshape a `byIdsCypher` result into `ByIdsItem[]`. Rows missing id or
 * name are dropped defensively. */
export function reshapeByIds(result: AuraResult): ByIdsItem[] {
  return result.values.flatMap((row) => {
    const id = col(result, row, 'id')
    const name = col(result, row, 'name')
    if (typeof id !== 'string' || typeof name !== 'string') return []
    const pictureUrl = col(result, row, 'picture_url')
    const pictureLicense = col(result, row, 'picture_license')
    const pictureAttribution = col(result, row, 'picture_attribution')
    const primaryInstruments = col(result, row, 'primary_instruments')

    const url =
      typeof pictureUrl === 'string' && pictureUrl.length > 0
        ? pictureUrl
        : undefined
    const photo = url !== undefined

    const portrait: ByIdsItem['portrait'] = {}
    if (url !== undefined) portrait.url = url
    if (typeof pictureLicense === 'string' && pictureLicense.length > 0)
      portrait.license = pictureLicense
    if (
      typeof pictureAttribution === 'string' &&
      pictureAttribution.length > 0
    )
      portrait.attribution = pictureAttribution

    const primaryInstrument =
      Array.isArray(primaryInstruments) &&
      typeof primaryInstruments[0] === 'string' &&
      primaryInstruments[0].length > 0
        ? primaryInstruments[0]
        : undefined

    const item: ByIdsItem = { id, name, photo, portrait }
    if (primaryInstrument !== undefined) item.primaryInstrument = primaryInstrument
    return [item]
  })
}
