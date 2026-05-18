// Live-Aura integration smoke (Phase C mandatory manual gate).
//
// CLAUDE.md live-Aura-smoke rule: "Before any Phase C commit that changes
// Cypher or Aura-response parsing, run the Aura smoke against live Aura
// locally and record the result in the PR. Not CI, not every commit — a
// mandatory manual gate for declaring Phase C green."
//
// Reads NEO4J_URI/USERNAME/PASSWORD from the process env or a local
// `.dev.vars` (KEY=VALUE lines, gitignored — landmine 12). Exercises the
// SAME read-only Cypher builders + Aura client + reshapers the BFF uses, then
// prints counts so the operator can eyeball that live Aura is reachable and
// the parsing is correct against real data.
//
// Run:  pnpm -F @jazzlore/musicians tsx apps/musicians/scripts/aura-smoke.ts
//   or: node --experimental-strip-types apps/musicians/scripts/aura-smoke.ts
//
// ⚠️ BLOCKER (2026-05-18): live Aura is currently UNREACHABLE (Neo4j MCP
// returns DatabaseNotFound; Phase 0 blocked + escalated to the user). This
// script is written ready-to-run; the live smoke is PENDING and gates Phase C
// final-green / merge.

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { auraQuery, type AuraCreds } from '../worker/aura'
import {
  curatedCypher,
  detailCypher,
  healthCypher,
  reshapeCount,
  reshapeDetail,
  reshapeMusicianRows,
  searchIndexCypher,
} from '../worker/cypher'
import { detectDuplicates } from '../worker/duplicates'
import { mapMusicianDetail, mapSearchCorpus } from '../src/lib/map'
import { CURATED } from '../src/data/curated'

function loadDevVars(): Record<string, string> {
  try {
    const path = resolve(import.meta.dirname, '../../../.dev.vars')
    const out: Record<string, string> = {}
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && m[1] && m[2] !== undefined) {
        out[m[1]] = m[2].replace(/^["']|["']$/g, '')
      }
    }
    return out
  } catch {
    return {}
  }
}

function readCreds(): AuraCreds {
  const file = loadDevVars()
  const uri = process.env.NEO4J_URI ?? file.NEO4J_URI
  const username = process.env.NEO4J_USERNAME ?? file.NEO4J_USERNAME
  const password = process.env.NEO4J_PASSWORD ?? file.NEO4J_PASSWORD
  const database = process.env.NEO4J_DATABASE ?? file.NEO4J_DATABASE
  if (!uri || !username || !password) {
    console.error(
      'Missing NEO4J_URI / NEO4J_USERNAME / NEO4J_PASSWORD ' +
        '(set them in the env or repo-root .dev.vars).',
    )
    process.exit(2)
  }
  return { uri, username, password, database }
}

async function main(): Promise<void> {
  const creds = readCreds()
  console.log('→ Aura smoke against', creds.uri)

  const health = await auraQuery(creds, healthCypher())
  console.log('  health: musicianCount =', reshapeCount(health))

  const corpusRes = await auraQuery(creds, searchIndexCypher())
  const rows = reshapeMusicianRows(corpusRes)
  const corpus = mapSearchCorpus(rows)
  console.log('  search-index: corpus entries =', corpus.length)
  const dupes = detectDuplicates(rows)
  console.log('  duplicate groups (faithful, NOT deduped) =', dupes.length)
  for (const d of dupes.slice(0, 10)) {
    console.log(`    ${d.idType}:${d.externalId} → ${d.nodeIds.join(', ')}`)
  }

  const curatedRes = await auraQuery(creds, curatedCypher(), {
    ids: CURATED.map((p) => p.id),
  })
  const curatedRows = reshapeMusicianRows(curatedRes)
  console.log(
    `  curated: ${curatedRows.length}/${CURATED.length} picks resolved`,
  )
  const missing = CURATED.filter(
    (p) => !curatedRows.some((m) => m.id === p.id),
  ).map((p) => p.id)
  if (missing.length > 0) {
    console.log('    ⚠ unresolved curated ids (reconcile in Phase 0):', missing)
  }

  const sample = curatedRows[0]?.id ?? rows[0]?.id
  if (sample) {
    const detailRes = await auraQuery(creds, detailCypher(), { id: sample })
    const raw = reshapeDetail(detailRes)
    if (raw) {
      const d = mapMusicianDetail(raw)
      console.log(
        `  detail(${sample}): "${d.name}" — ${d.collaborators.length} collaborators, ${d.records.length} records`,
      )
    } else {
      console.log(`  detail(${sample}): no node returned`)
    }
  }

  console.log('✓ Aura smoke OK')
}

main().catch((err) => {
  console.error('✗ Aura smoke FAILED:', err)
  process.exit(1)
})
