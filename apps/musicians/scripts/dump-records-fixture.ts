// Dump real mapped musician-detail fixtures for the Records-project visual
// gates (P5/P6/P7). Queries live Aura with the SAME detailCypher + reshaper +
// mapper the BFF uses, so the JSON is byte-for-byte the new /api/musicians/:id
// contract (D2 ordering + cover/album fields). Writes one file per id to
// /tmp/records-fixtures/<id>.json — NOT committed; the capture spec reads them
// and skips when absent. Run:
//   pnpm dlx tsx apps/musicians/scripts/dump-records-fixture.ts [id ...]
// Default ids: Miles, Coltrane, Bill Evans (pianist).

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { auraQuery, type AuraCreds } from '../worker/aura'
import { detailCypher, reshapeDetail } from '../worker/cypher'
import { mapMusicianDetail } from '../src/lib/map'

function loadDevVars(): Record<string, string> {
  try {
    const path = resolve(import.meta.dirname, '../../../.dev.vars')
    const out: Record<string, string> = {}
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && m[1] && m[2] !== undefined) out[m[1]] = m[2].replace(/^["']|["']$/g, '')
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
    throw new Error('Missing NEO4J_URI/USERNAME/PASSWORD (env or .dev.vars)')
  }
  return { uri, username, password, database }
}

const DEFAULT_IDS = ['wikidata:Q93341', 'wikidata:Q7346', 'wikidata:Q208205']

async function main(): Promise<void> {
  const creds = readCreds()
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_IDS
  const outDir = '/tmp/records-fixtures'
  mkdirSync(outDir, { recursive: true })
  for (const id of ids) {
    const res = await auraQuery(creds, detailCypher(), { id })
    const raw = reshapeDetail(res)
    if (!raw) {
      console.log(`  ${id}: no node`)
      continue
    }
    const detail = mapMusicianDetail(raw)
    const withCover = detail.records.filter((r) => r.cover.url).length
    const withApple = detail.records.filter((r) => r.appleAlbumUrl).length
    const safe = id.replace(/[:/]/g, '_')
    writeFileSync(resolve(outDir, `${safe}.json`), JSON.stringify(detail, null, 2))
    console.log(
      `  wrote ${safe}.json — ${detail.name}: ${detail.records.length} records (cover ${withCover}, apple ${withApple})`,
    )
    console.log(
      `    top 5: ${detail.records.slice(0, 5).map((r) => `${r.title} '${String(r.releaseYear ?? '').slice(-2)}`).join(' | ')}`,
    )
  }
}

main().catch((err) => {
  console.error('dump FAILED:', err)
  process.exit(1)
})
