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
     WITH m,
          coalesce(m.genres, []) AS genres,
          m.years_active_start AS yas,
          m.years_active_end   AS yae
     MATCH (p:Musician)
     WHERE p.id <> m.id
       AND any(g IN coalesce(p.genres, []) WHERE g IN genres)
       AND coalesce(p.years_active_start, 9999) <= coalesce(yae, 9999) + 10
       AND coalesce(p.years_active_end,    0)    >= coalesce(yas, 0)    - 10
       AND NOT EXISTS {
             MATCH (m)-[:PLAYED_ON]->(:Record)<-[:PLAYED_ON]-(p)
           }
     RETURN p.id                  AS id,
            p.name                AS name,
            p.primary_instruments AS primary_instruments,
            p.picture_url         AS picture_url,
            size([g IN coalesce(p.genres, []) WHERE g IN genres]) AS overlap
     ORDER BY overlap DESC, coalesce(p.years_active_start, 9999) ASC
     LIMIT $limit`,
  )
}

/** One-shot detail aggregation: focus node, the records it played on (+ its
 * own edge), and every collaborator (shared record + that collaborator's
 * edge). One page load = one BFF call (server-side aggregation). */
export function detailCypher(): string {
  return assertReadOnly(
    `MATCH (m:Musician {id: $id})
     OPTIONAL MATCH (m)-[fe:PLAYED_ON]->(r:Record)
     WITH m, collect(DISTINCT {record: r{.*}, edge: properties(fe)}) AS records
     OPTIONAL MATCH (m)-[:PLAYED_ON]->(sr:Record)<-[ce:PLAYED_ON]-(c:Musician)
     WHERE c.id <> m.id
     WITH m, records, c,
          collect(DISTINCT {record: sr{.*}, edge: properties(ce)}) AS shared
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
 * derived from `picture_url`. `instrument` falls back to `undefined` when no
 * primary instrument is recorded. `hint` is intentionally omitted here —
 * EraStrip tolerates it; an editorial hint may be derived later by the BFF. */
export interface PeerEraItem {
  id: string
  name: string
  instrument?: string
  hint?: string
  photo: boolean
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
