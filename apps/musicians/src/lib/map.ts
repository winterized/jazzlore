// Neo4j-row → UI mappers (Phase B frozen contract).
//
// Pure, React-free, fetch-free. Maps raw Aura HTTP Query API rows (shapes per
// docs/FRONTEND.md, see fixtures.ts) into the domain types C/D/E consume.
//
// Invariants (do not weaken downstream):
//  - `photo` is derived SOLELY from `picture_url` presence — never a name
//    heuristic (landmine 10).
//  - Duplicates are rendered FAITHFULLY: NO client-side / mapper-level dedup
//    (landmine 11). The BFF (Phase C) — not this module — logs the structured
//    duplicate warning.
//  - Collaborator order is the order the BFF supplies; the mapper never
//    re-sorts or de-duplicates it.
//  - Sparse is the norm: every "may be absent" field degrades gracefully
//    (optional scalar → undefined; list → []).
//
// Reconcile-with-Phase-0: see ./README.md. If the live audit corrects field
// names, edit fixtures.ts + the raw→domain field reads here; types.ts (the
// C/D/E contract) and the function signatures should not need to change.

import type {
  Collaborator,
  CuratedCard,
  GraphData,
  GraphEdge,
  GraphNode,
  ImageAttribution,
  MusicianDetail,
  PlayedOnRole,
  RawMusician,
  RawPlayedOn,
  RawRecord,
  RecordRef,
  SearchCorpusEntry,
} from './types'
import type { RawCollaboratorRow, RawDetailResult } from './fixtures'

/** Non-empty trimmed string, else undefined. Aura may send "" or absent. */
function str(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined
  const t = v.trim()
  return t === '' ? undefined : t
}

function num(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined
}

function list(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === 'string' && x.trim() !== '')
}

/** Roles that make a musician the record's primary (display) artist. */
const LEADER_ROLES: ReadonlySet<PlayedOnRole> = new Set<PlayedOnRole>([
  'leader',
  'co-leader',
])

function portraitOf(m: RawMusician): ImageAttribution {
  return {
    url: str(m.picture_url),
    license: str(m.picture_license),
    attribution: str(m.picture_attribution),
  }
}

/** `photo` is TRUE iff the node carries a non-empty picture_url. Never a name
 * heuristic. Mirrors `portrait.url` presence. */
function hasPhoto(m: RawMusician): boolean {
  return str(m.picture_url) !== undefined
}

/**
 * Map one record + its (optional) `:PLAYED_ON` edge. `primaryArtist` is
 * DERIVED (the schema has no primary-artist field): the leader/co-leader on
 * the record, falling back to the caller-supplied `opts.primaryArtist`
 * (typically the focus musician's name, computed by `primaryArtistForRecord`)
 * so deep-links never read "<title> undefined".
 */
export function mapRecordRef(
  record: RawRecord,
  opts: { primaryArtist?: string } = {},
): RecordRef {
  return {
    id: record.id,
    title: record.title,
    primaryArtist: str(opts.primaryArtist),
    type: record.type,
    releaseYear: num(record.release_year),
    recordingYear: num(record.recording_year),
    label: str(record.label),
    catalogNumber: str(record.catalog_number),
    trackCount: num(record.track_count),
    cover: {
      url: str(record.cover_art_url),
      license: str(record.cover_art_license),
    },
    links: {
      wikipediaUrl: str(record.wikipedia_url),
      wikidataId: str(record.wikidata_id),
      musicbrainzId: str(record.musicbrainz_id),
      discogsId: str(record.discogs_id),
    },
  }
}

/** "Defining" shared record = earliest release_year; ties broken by record id
 * for deterministic output. Assumption (reconcile-with-Phase-0): the schema
 * exposes no significance metric, so earliest-defining-record is the stable
 * choice and matches the design's "Most: 'Moanin'' '58" reading. */
function pickTopRecord(
  shared: { record: RawRecord }[],
): { title: string; year?: number } | undefined {
  let best: RawRecord | undefined
  for (const { record } of shared) {
    if (best === undefined) {
      best = record
      continue
    }
    const a = num(record.release_year)
    const b = num(best.release_year)
    if (a !== undefined && b !== undefined) {
      if (a < b || (a === b && record.id < best.id)) best = record
    } else if (a !== undefined && b === undefined) {
      best = record
    } else if (a === undefined && b === undefined && record.id < best.id) {
      best = record
    }
  }
  if (best === undefined) return undefined
  return { title: best.title, year: num(best.release_year) }
}

/** Map one collaborator row. `sharedRecordCount` = DISTINCT shared records. */
export function mapCollaborator(row: RawCollaboratorRow): Collaborator {
  const distinctRecordIds = new Set(
    row.sharedRecords.map((s) => s.record.id),
  )
  return {
    id: row.musician.id,
    name: row.musician.name,
    instrument: list(row.musician.primary_instruments)[0],
    relationship: undefined,
    sharedRecordCount: distinctRecordIds.size,
    topRecord: pickTopRecord(row.sharedRecords),
    photo: hasPhoto(row.musician),
    // Tier-2 direct artist URLs (same provenance as the detail page's
    // `links.*ArtistUrl`); ConnRow prefers these over a name search.
    spotifyArtistUrl: str(row.musician.spotify_artist_url),
    appleArtistUrl: str(row.musician.apple_artist_url),
  }
}

/** Pick a record's primary (display) artist among the focus musician + the
 * collaborator edges: the leader/co-leader, else the focus musician's name
 * (faithful fallback so deep-links are well-formed). */
function primaryArtistForRecord(
  recordId: string,
  focus: RawMusician,
  focusEdge: RawPlayedOn | undefined,
  collaborators: RawCollaboratorRow[],
): string {
  if (focusEdge?.role !== undefined && LEADER_ROLES.has(focusEdge.role)) {
    return focus.name
  }
  for (const c of collaborators) {
    for (const s of c.sharedRecords) {
      if (
        s.record.id === recordId &&
        s.edge.role !== undefined &&
        LEADER_ROLES.has(s.edge.role)
      ) {
        return c.musician.name
      }
    }
  }
  return focus.name
}

/** Map the full `/api/musicians/:id` detail result. */
export function mapMusicianDetail(result: RawDetailResult): MusicianDetail {
  const m = result.musician
  return {
    id: m.id,
    name: m.name,
    aka: list(m.aka),
    primaryInstruments: list(m.primary_instruments),
    allInstruments: list(m.all_instruments),
    birthYear: num(m.birth_year),
    birthDate: str(m.birth_date),
    birthPlace: str(m.birth_place),
    deathYear: num(m.death_year),
    deathDate: str(m.death_date),
    deathPlace: str(m.death_place),
    yearsActiveStart: num(m.years_active_start),
    yearsActiveEnd: num(m.years_active_end),
    nationality: str(m.nationality),
    genres: list(m.genres),
    era: undefined, // Phase B does not invent an era taxonomy (left to C).
    bioSummary: str(m.bio_summary),
    portrait: portraitOf(m),
    photo: hasPhoto(m),
    links: {
      wikipediaUrl: str(m.wikipedia_url),
      wikidataId: str(m.wikidata_id),
      musicbrainzId: str(m.musicbrainz_id),
      discogsId: str(m.discogs_id),
      // Tier-2 Listen fallback URLs. Absent when the populator's MB lookup
      // didn't resolve a streaming-service relationship; the frontend
      // resolver then drops to tier-3 (disambiguated search).
      spotifyArtistUrl: str(m.spotify_artist_url),
      appleArtistUrl: str(m.apple_artist_url),
    },
    // Faithful order, no dedup.
    collaborators: result.collaborators.map(mapCollaborator),
    records: result.records.map(({ record, edge }) =>
      mapRecordRef(record, {
        primaryArtist: primaryArtistForRecord(
          record.id,
          m,
          edge,
          result.collaborators,
        ),
      }),
    ),
  }
}

/** Map raw musician rows → the client-side autosuggest corpus. Duplicates are
 * kept faithfully (landmine 11) — same order, same length. */
export function mapSearchCorpus(rows: RawMusician[]): SearchCorpusEntry[] {
  return rows.map((m) => ({
    id: m.id,
    name: m.name,
    aka: list(m.aka),
    primaryInstrument: list(m.primary_instruments)[0],
    era: undefined, // Phase B does not invent an era taxonomy (left to C).
  }))
}

/** Hydrate a hand-picked curated entry (repo id+hook) with the live musician
 * node fetched from Neo4j (name/photo/subtitle). */
export function mapCuratedCard(
  pick: { id: string; hook: string },
  m: RawMusician,
): CuratedCard {
  return {
    id: pick.id,
    name: m.name,
    hook: pick.hook,
    subtitle: list(m.primary_instruments)[0],
    photo: hasPhoto(m),
    portrait: portraitOf(m),
  }
}

/** Build the desktop graph: focus node (total record count) + one node per
 * collaborator, edges weighted by shared-record count. Duplicates rendered
 * faithfully (no dedup). */
export function mapGraphData(result: RawDetailResult): GraphData {
  const focus = result.musician
  const focusNode: GraphNode = {
    id: focus.id,
    name: focus.name,
    instrument: list(focus.primary_instruments)[0],
    recordCount: new Set(result.records.map((r) => r.record.id)).size,
    focus: true,
  }
  const nodes: GraphNode[] = [focusNode]
  const edges: GraphEdge[] = []
  for (const c of result.collaborators) {
    const weight = new Set(c.sharedRecords.map((s) => s.record.id)).size
    nodes.push({
      id: c.musician.id,
      name: c.musician.name,
      instrument: list(c.musician.primary_instruments)[0],
      recordCount: weight,
      focus: false,
    })
    edges.push({ source: focus.id, target: c.musician.id, weight })
  }
  return { nodes, edges }
}

/** Map one row of the shared-records query (the focus + collab pair both
 * play on `record`) into a `RecordRef`. Same leader-precedence rule as
 * `primaryArtistForRecord` but specialised to a pair: if either side carries
 * a LEADER role on the record, that side wins; otherwise fall back to the
 * focus musician (the page the user is reading from). */
export function mapSharedRecord(
  raw: { record: RawRecord; focusEdge?: RawPlayedOn; collabEdge?: RawPlayedOn },
  ctx: { focusName: string; collabName: string },
): RecordRef {
  const focusIsLeader =
    raw.focusEdge?.role !== undefined && LEADER_ROLES.has(raw.focusEdge.role)
  const collabIsLeader =
    raw.collabEdge?.role !== undefined && LEADER_ROLES.has(raw.collabEdge.role)
  // Focus wins when both are leaders OR neither is (the page-author bias —
  // when ambiguous, the user's "you're on Miles's page" mental model holds).
  const primaryArtist =
    collabIsLeader && !focusIsLeader ? ctx.collabName : ctx.focusName
  return mapRecordRef(raw.record, { primaryArtist })
}
