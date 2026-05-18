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

/** Read the single integer from a `RETURN count(m) AS n` health result. */
export function reshapeCount(result: AuraResult): number {
  const row = result.values[0]
  if (row === undefined) return 0
  const n = col(result, row, 'n')
  return typeof n === 'number' && Number.isFinite(n) ? n : 0
}
