// Records-project ordering bake-off (P6 taste gate). Read-only: queries live
// Aura once per musician (raw detail with edges), then ranks records under
// several graph-derived strategies and prints the top 8 side by side so
// Aurélien can pick the importance signal from evidence (not a code change).
//
// Signals available per record WITHOUT new data:
//   • focus edge role  → is this the musician's OWN album (leader/co-leader)?
//   • collabCount      → distinct collaborators on the record (roster size)
//   • release_year, type
//
// Run: pnpm dlx tsx apps/musicians/scripts/analyze-ordering.ts

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { auraQuery, type AuraCreds } from '../worker/aura'
import { detailCypher, reshapeDetail } from '../worker/cypher'
import type { RawRecord } from '../src/lib/types'

const LEADER = new Set(['leader', 'co-leader'])

function creds(): AuraCreds {
  const file: Record<string, string> = {}
  try {
    for (const line of readFileSync(resolve(import.meta.dirname, '../../../.dev.vars'), 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && m[1] && m[2] !== undefined) file[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch {
    /* env fallback below */
  }
  const uri = process.env.NEO4J_URI ?? file.NEO4J_URI
  const username = process.env.NEO4J_USERNAME ?? file.NEO4J_USERNAME
  const password = process.env.NEO4J_PASSWORD ?? file.NEO4J_PASSWORD
  if (!uri || !username || !password) throw new Error('missing creds')
  return { uri, username, password, database: process.env.NEO4J_DATABASE ?? file.NEO4J_DATABASE }
}

interface Row {
  rec: RawRecord
  isLeader: boolean
  collab: number
  year: number
  notable: boolean
}

const num = (v: unknown): number => (typeof v === 'number' ? v : 99999)
const byYearTitle = (a: Row, b: Row): number =>
  a.year - b.year || String(a.rec.title).localeCompare(String(b.rec.title))

const STRATEGIES: { name: string; cmp: (a: Row, b: Row) => number }[] = [
  {
    name: 'A · D2 approved (collab desc, year asc)',
    cmp: (a, b) => b.collab - a.collab || byYearTitle(a, b),
  },
  {
    name: 'B · leader-first (own albums), year asc',
    cmp: (a, b) => Number(b.isLeader) - Number(a.isLeader) || byYearTitle(a, b),
  },
  {
    name: 'C · leader-first, then collab desc, year asc',
    cmp: (a, b) =>
      Number(b.isLeader) - Number(a.isLeader) || b.collab - a.collab || byYearTitle(a, b),
  },
  {
    name: 'D · notable (has Wikipedia/Wikidata) first, year asc',
    cmp: (a, b) => Number(b.notable) - Number(a.notable) || byYearTitle(a, b),
  },
  {
    name: 'E · notable first, leader, year asc',
    cmp: (a, b) =>
      Number(b.notable) - Number(a.notable) ||
      Number(b.isLeader) - Number(a.isLeader) ||
      byYearTitle(a, b),
  },
]

const IDS = ['wikidata:Q93341', 'wikidata:Q7346', 'wikidata:Q208205']

async function main(): Promise<void> {
  const c = creds()
  for (const id of IDS) {
    const raw = reshapeDetail(await auraQuery(c, detailCypher(), { id }))
    if (!raw) {
      console.log(`\n${id}: no node`)
      continue
    }
    // collabCount per record id = distinct collaborators whose sharedRecords list it.
    const collabByRecord = new Map<string, number>()
    for (const col of raw.collaborators) {
      const seen = new Set<string>()
      for (const s of col.sharedRecords) seen.add(s.record.id)
      for (const rid of seen) collabByRecord.set(rid, (collabByRecord.get(rid) ?? 0) + 1)
    }
    const rows: Row[] = raw.records
      .filter((r) => r.record.title)
      .map((r) => ({
        rec: r.record,
        isLeader: r.edge.role !== undefined && LEADER.has(r.edge.role),
        collab: collabByRecord.get(r.record.id) ?? 0,
        year: num(r.record.release_year),
        notable: Boolean(r.record.wikipedia_url ?? r.record.wikidata_id),
      }))
    const notableCount = rows.filter((r) => r.notable).length
    console.log(
      `\n══════ ${raw.musician.name} (${rows.length} records, ${notableCount} notable / wiki-linked) ══════`,
    )
    for (const s of STRATEGIES) {
      const top = [...rows].sort(s.cmp).slice(0, 8)
      console.log(`\n  ${s.name}`)
      for (const t of top) {
        const tag = `${t.isLeader ? 'L' : ' '} c${String(t.collab).padStart(2)}`
        console.log(`    [${tag}] ${String(t.year)}  ${t.rec.title}`)
      }
    }
  }
}

main().catch((e) => {
  console.error('FAILED:', e)
  process.exit(1)
})
