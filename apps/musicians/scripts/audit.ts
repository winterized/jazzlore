// Phase 0 data audit — throwaway, read-only live-Aura introspection.
//
// Reuses the proven `auraQuery` HTTP client (worker/aura.ts). READ-ONLY,
// parameterized Cypher only (MATCH … RETURN …). NEVER CREATE/MERGE/SET/DELETE.
// Batches sensibly so Aura is not hammered. Output is hand-pasted into
// apps/musicians/docs/data-audit.md; this script is itself committed as the
// reproducible audit harness.
//
// Run: pnpm -F @jazzlore/musicians exec jiti apps/musicians/scripts/audit.ts
//   (env: NEO4J_URI/USERNAME/PASSWORD/DATABASE exported from the shell)

import { auraQuery, type AuraCreds, type AuraResult } from '../worker/aura'

function readCreds(): AuraCreds {
  const uri = process.env.NEO4J_URI
  const username = process.env.NEO4J_USERNAME
  const password = process.env.NEO4J_PASSWORD
  const database = process.env.NEO4J_DATABASE
  if (!uri || !username || !password) {
    console.error('Missing NEO4J_URI / NEO4J_USERNAME / NEO4J_PASSWORD')
    process.exit(2)
  }
  return { uri, username, password, database }
}

const creds = readCreds()

function rows(r: AuraResult): Record<string, unknown>[] {
  return r.values.map((row) => {
    const o: Record<string, unknown> = {}
    r.fields.forEach((f, i) => {
      o[f] = row[i]
    })
    return o
  })
}

function J(v: unknown): string {
  return JSON.stringify(v)
}

async function q(
  label: string,
  cypher: string,
  params: Record<string, unknown> = {},
): Promise<Record<string, unknown>[]> {
  const res = await auraQuery(creds, cypher, params)
  const out = rows(res)
  console.log(`\n### ${label}`)
  return out
}

async function main(): Promise<void> {
  console.log('# Phase 0 audit raw output')
  console.log('Aura:', creds.uri, 'db:', creds.database)

  // ── 1. Sanity counts (one batched query) ────────────────────────────────
  const counts = await q(
    'Sanity counts',
    `MATCH (m:Musician) WITH count(m) AS musicians
     MATCH (r:Record) WITH musicians, count(r) AS records
     MATCH ()-[p:PLAYED_ON]->() RETURN musicians, records, count(p) AS playedOn`,
  )
  console.log(J(counts))

  // ── 2. Duplicate report — shared external ids across distinct node ids ──
  for (const [idType, field] of [
    ['wikidata', 'wikidata_id'],
    ['musicbrainz', 'musicbrainz_id'],
    ['discogs', 'discogs_id'],
  ] as const) {
    const dup = await q(
      `Duplicate groups by ${idType} (${field})`,
      `MATCH (m:Musician)
       WHERE m.${field} IS NOT NULL AND trim(m.${field}) <> ''
       WITH m.${field} AS ext, collect(DISTINCT m.id) AS ids,
            collect(DISTINCT m.name) AS names
       WHERE size(ids) > 1
       RETURN ext, ids, names ORDER BY size(ids) DESC, ext`,
    )
    console.log(`count=${dup.length}`)
    console.log(J(dup))
  }

  // name + aka collision (case-insensitive). aka is a list; explode it.
  const nameDup = await q(
    'Duplicate groups by exact lowercased name (>1 distinct node id)',
    `MATCH (m:Musician)
     WITH toLower(trim(m.name)) AS nm, collect(DISTINCT m.id) AS ids,
          collect(DISTINCT m.name) AS names
     WHERE size(ids) > 1
     RETURN nm, ids, names ORDER BY size(ids) DESC, nm`,
  )
  console.log(`count=${nameDup.length}`)
  console.log(J(nameDup))

  // name<->aka cross collision: build a (lowered token -> ids) index in one
  // pass over (name ∪ aka), report tokens spanning >1 distinct node id whose
  // members are NOT already a pure exact-name group. Cheap: single scan, no
  // cartesian self-join (the (a),(b) form timed out at 9s on 26k nodes).
  const akaDup = await q(
    'Name<->aka token collisions (>1 distinct node id)',
    `MATCH (m:Musician)
     WITH m, [toLower(trim(m.name))] +
          [x IN coalesce(m.aka, []) WHERE trim(x) <> '' | toLower(trim(x))]
          AS toks
     UNWIND toks AS tok
     WITH tok, collect(DISTINCT m.id) AS ids, collect(DISTINCT m.name) AS names
     WHERE size(ids) > 1
     RETURN tok, ids, names ORDER BY size(ids) DESC, tok`,
  )
  console.log(`count=${akaDup.length}`)
  console.log(J(akaDup))

  // ── 3. 50 highest-collaboration-count musicians ─────────────────────────
  // collaboration count = distinct co-musicians via shared records.
  const top = await q(
    'Top 50 by distinct collaborator count',
    `MATCH (m:Musician)-[:PLAYED_ON]->(:Record)<-[:PLAYED_ON]-(c:Musician)
     WHERE c.id <> m.id
     WITH m, count(DISTINCT c) AS collabs
     ORDER BY collabs DESC
     LIMIT 50
     RETURN m.id AS id, m.name AS name, collabs,
            m.bio_summary IS NOT NULL AND trim(coalesce(m.bio_summary,'')) <> '' AS bio,
            m.picture_url IS NOT NULL AND trim(coalesce(m.picture_url,'')) <> '' AS pic,
            m.picture_license IS NOT NULL AND trim(coalesce(m.picture_license,'')) <> '' AS picLic,
            m.picture_attribution IS NOT NULL AND trim(coalesce(m.picture_attribution,'')) <> '' AS picAttr,
            m.birth_year IS NOT NULL AS birth,
            m.death_year IS NOT NULL AS death,
            m.primary_instruments IS NOT NULL AND size(coalesce(m.primary_instruments,[])) > 0 AS instr,
            m.genres IS NOT NULL AND size(coalesce(m.genres,[])) > 0 AS genres,
            m.nationality IS NOT NULL AND trim(coalesce(m.nationality,'')) <> '' AS nat,
            m.wikipedia_url IS NOT NULL AND trim(coalesce(m.wikipedia_url,'')) <> '' AS wiki`,
  )
  console.log(`count=${top.length}`)
  console.log(J(top))

  // ── 4. Curated reconciliation — resolve canonical names to real ids ─────
  // Intended canonical musicians inferred from curated.ts hooks (in order).
  const intended = [
    'Miles Davis',
    'John Coltrane',
    'Bill Evans',
    'Thelonious Monk',
    'Bobby Timmons',
    'Charles Mingus',
    'Art Blakey',
    'Herbie Hancock',
    'Wayne Shorter',
    'Cannonball Adderley',
    'Sonny Rollins',
    'Wes Montgomery',
  ]
  for (const nm of intended) {
    const cands = await q(
      `Curated match candidates: "${nm}"`,
      `MATCH (m:Musician)
       WHERE toLower(m.name) = toLower($nm)
          OR (m.aka IS NOT NULL AND any(x IN m.aka WHERE toLower(trim(x)) = toLower($nm)))
       OPTIONAL MATCH (m)-[:PLAYED_ON]->(:Record)<-[:PLAYED_ON]-(c:Musician)
       WHERE c.id <> m.id
       WITH m, count(DISTINCT c) AS collabs
       RETURN m.id AS id, m.name AS name, collabs,
              m.bio_summary IS NOT NULL AND trim(coalesce(m.bio_summary,'')) <> '' AS bio,
              m.picture_url IS NOT NULL AND trim(coalesce(m.picture_url,'')) <> '' AS pic,
              m.wikidata_id AS wd, m.musicbrainz_id AS mb
       ORDER BY collabs DESC`,
      { nm },
    )
    console.log(`count=${cands.length}`)
    console.log(J(cands))
  }

  console.log('\n✓ audit complete')
}

main().catch((err: unknown) => {
  console.error('✗ audit FAILED:', err)
  process.exit(1)
})
