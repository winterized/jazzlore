/**
 * Generate the Musicians home-screen widget's bundled content (Pattern d).
 *
 * The widget (jazzlore-ios `MusicianWidget` target) is fully self-contained:
 * it ships its rotation pool inside the app binary, with NO runtime network.
 * This build-time script is the only thing that talks to the BFF — once, from
 * a laptop — to freeze a snapshot of the approved pool into the iOS repo.
 *
 * Inputs:
 *   <ios>/docs/widget-pool.json   the approved pool (from the Phase 0 audit):
 *                                 ids + source ("curated" | "polished").
 *   GET /api/musicians/curated    hand-written editorial hooks (tier-1 fact).
 *   GET /api/musicians/by-ids     name + portrait for the curated tier — the
 *                                 LIGHT endpoint, deliberately used for the
 *                                 greats so we never run the heavy detail
 *                                 query on the highest-degree nodes (Miles,
 *                                 Blakey, …) which times out Aura's 9s budget
 *                                 (issue #155). Curated facts are the hooks,
 *                                 so name + portrait is all we need for them.
 *   GET /api/musicians/:id        polished tier only — name, instruments,
 *                                 era, years, portrait url for the structured
 *                                 fact. These are lower-degree and reliable.
 *
 * Outputs (into the widget target's Resources/):
 *   musicians.json                [{ id, name, fact }] — pool order
 *                                 interleaves curated greats evenly among the
 *                                 polished surprises for cadence. No deep-link
 *                                 path: the widget emits intent
 *                                 (`jazzlore-musicians://musician/<id>`) and
 *                                 the web app owns the route mapping
 *                                 (apps/musicians/src/lib/deepLink.ts).
 *   Portraits.xcassets/<asset>.imageset/portrait.jpg + Contents.json
 *                                 512x512 face-aware square crops, JPEG q80.
 *
 * The Swift side derives the asset name from the id with the SAME rule used
 * here (`assetName`), so musicians.json deliberately omits the image name.
 *
 * The iOS repo is resolved as a sibling of this monorepo; override with
 * IOS_REPO=/path and the BFF origin with BFF=https://…
 *
 * Run: pnpm widget:content
 */

import sharp from 'sharp'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const IOS_REPO = process.env.IOS_REPO ?? resolve(ROOT, '..', 'jazzlore-ios')
const BFF = process.env.BFF ?? 'https://musicians.jazzlore.com'
const POOL_FILE = resolve(IOS_REPO, 'docs/widget-pool.json')
const OUT = resolve(IOS_REPO, 'musicians/ios/App/MusicianWidget/Resources')
const PORTRAITS = resolve(OUT, 'Portraits.xcassets')
const SIZE = 512
const UA = 'JazzloreWidgetContent/1.1 (https://jazzlore.com; +github issues)'

/** Asset-catalog-safe name derived from the canonical id. MUST match the
 * Swift side (`wikidata:Q93341` → `wikidata_Q93341`). */
function assetName(id) {
  return id.replace(/[^A-Za-z0-9]/g, '_')
}

/** Capitalize the first character (matches the BFF's subtitle casing). */
function capitalize(s) {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1)
}

// Targets the BFF only (Cloudflare/Aura) — not rate-limited Wikimedia — so a
// plain linear backoff suffices here; 429-specific handling lives in getBuffer.
async function getJSON(url, tries = 4) {
  let last
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return await r.json()
    } catch (err) {
      last = err
      await new Promise((res) => setTimeout(res, 1500 * (i + 1)))
    }
  }
  throw new Error(`GET failed after ${tries}: ${url} :: ${last}`)
}

const sleep = (ms) => new Promise((res) => setTimeout(res, ms))

async function getBuffer(url, tries = 6) {
  let last
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } })
      // Wikimedia rate-limits (429) under rapid access — back off longer.
      if (r.status === 429) throw new Error('HTTP 429')
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return Buffer.from(await r.arrayBuffer())
    } catch (err) {
      last = err
      await sleep(2000 * (i + 1))
    }
  }
  throw new Error(`portrait fetch failed after ${tries}: ${url} :: ${last}`)
}

/** Tier-1 keeps its hand-written hook; tier-2 gets a structured line
 * "<instrument> · <era> · <birth>–<death>" (§4.6 of the design doc). */
function buildFact(detail, hook) {
  if (hook && hook.trim()) return hook.trim()
  const instrument = Array.isArray(detail.primaryInstruments) && detail.primaryInstruments[0]
    ? capitalize(detail.primaryInstruments[0])
    : undefined
  const era = typeof detail.era === 'string' && detail.era ? capitalize(detail.era) : undefined
  // Deceased → "birth–death"; living (no death year) → "b. birth". Today's
  // pool is all-deceased, but keep the fact line sound if that ever changes.
  const years = detail.deathYear
    ? `${detail.birthYear}–${detail.deathYear}`
    : detail.birthYear
      ? `b. ${detail.birthYear}`
      : undefined
  const fact = [instrument, era, years].filter(Boolean).join(' · ')
  return fact || capitalize(detail.name ?? '')
}

/** Distribute `core` items evenly across the full sequence (Bresenham-style)
 * so a curated great surfaces every few days rather than all up front. */
function interleave(core, surprise) {
  const total = core.length + surprise.length
  const out = []
  const c = [...core]
  const s = [...surprise]
  let acc = 0
  for (let i = 0; i < total; i++) {
    acc += core.length
    if (acc >= total && c.length > 0) {
      acc -= total
      out.push(c.shift())
    } else {
      out.push(s.shift() ?? c.shift())
    }
  }
  return out
}

async function main() {
  // The pool is an APPROVAL MANIFEST (which ids + their tier); the BFF stays
  // the source of truth for names/facts/portraits so a re-run picks up any
  // upstream data fix. (We deliberately re-fetch rather than read the pool's
  // cached fields.)
  const pool = JSON.parse(readFileSync(POOL_FILE, 'utf8')).musicians
  if (!Array.isArray(pool) || pool.length === 0) {
    throw new Error(`empty/invalid pool at ${POOL_FILE}`)
  }
  for (const m of pool) {
    if (typeof m.id !== 'string' || (m.source !== 'curated' && m.source !== 'polished')) {
      throw new Error(`invalid pool entry (needs string id + curated|polished source): ${JSON.stringify(m)}`)
    }
  }
  // assetName must be injective across the pool — a collision would silently
  // overwrite one musician's portrait with another's. Fail fast.
  const names = pool.map((m) => assetName(m.id))
  if (new Set(names).size !== names.length) {
    throw new Error('asset-name collision: two pool ids sanitize to the same asset name')
  }

  // Hand-written editorial hooks for the curated tier.
  const curated = await getJSON(`${BFF}/api/musicians/curated`)
  const hookById = new Map((curated.curated ?? []).map((c) => [c.id, c.hook]))

  // Curated greats: name + portrait via the LIGHT by-ids endpoint (≤20 ids /
  // call), so the heavy detail query never runs on the highest-degree nodes
  // (issue #155). Their fact is the hook, so this is all we need.
  const curatedIds = pool.filter((m) => m.source === 'curated').map((m) => m.id)
  const byIds = new Map()
  for (let i = 0; i < curatedIds.length; i += 20) {
    const chunk = curatedIds.slice(i, i + 20)
    const res = await getJSON(`${BFF}/api/musicians/by-ids?ids=${encodeURIComponent(chunk.join(','))}`)
    for (const item of res.items ?? []) byIds.set(item.id, item)
  }

  // Fresh clean asset catalog.
  rmSync(PORTRAITS, { recursive: true, force: true })
  mkdirSync(PORTRAITS, { recursive: true })
  writeFileSync(
    resolve(PORTRAITS, 'Contents.json'),
    JSON.stringify({ info: { author: 'xcode', version: 1 } }, null, 2) + '\n',
  )

  const records = []
  const failures = []
  for (const entry of pool) {
    try {
      // Curated → by-ids (light, fact=hook); polished → detail (needs era/years).
      let name
      let url
      let fact
      if (entry.source === 'curated') {
        const item = byIds.get(entry.id)
        if (!item) throw new Error('not returned by by-ids')
        name = item.name
        url = item.portrait?.url
        fact = buildFact({ name, primaryInstruments: [item.primaryInstrument] }, hookById.get(entry.id))
      } else {
        const detail = await getJSON(`${BFF}/api/musicians/${entry.id}`)
        name = detail.name
        url = detail?.portrait?.url
        fact = buildFact(detail, hookById.get(entry.id))
      }
      if (!url) throw new Error('no portrait url')

      const asset = assetName(entry.id)
      const imageset = resolve(PORTRAITS, `${asset}.imageset`)
      mkdirSync(imageset, { recursive: true })
      const buf = await getBuffer(url)
      await sharp(buf)
        .resize(SIZE, SIZE, { fit: 'cover', position: sharp.strategy.attention })
        .jpeg({ quality: 80, mozjpeg: true })
        .toFile(resolve(imageset, 'portrait.jpg'))
      writeFileSync(
        resolve(imageset, 'Contents.json'),
        JSON.stringify(
          {
            images: [{ filename: 'portrait.jpg', idiom: 'universal' }],
            info: { author: 'xcode', version: 1 },
          },
          null,
          2,
        ) + '\n',
      )

      records.push({
        source: entry.source,
        record: {
          id: entry.id,
          name,
          fact,
        },
      })
      process.stdout.write(`  ✓ ${name}\n`)
    } catch (err) {
      failures.push({ id: entry.id, error: String(err) })
      process.stdout.write(`  ✗ ${entry.id}: ${err}\n`)
    }
    // Be polite to Wikimedia between portrait downloads (avoids HTTP 429).
    await sleep(350)
  }

  if (failures.length > 0) {
    throw new Error(
      `aborting — ${failures.length} musician(s) failed; the bundled pool must be complete:\n` +
        failures.map((f) => `    ${f.id}: ${f.error}`).join('\n'),
    )
  }

  const core = records.filter((r) => r.source === 'curated').map((r) => r.record)
  const surprise = records.filter((r) => r.source !== 'curated').map((r) => r.record)
  const ordered = interleave(core, surprise)

  writeFileSync(resolve(OUT, 'musicians.json'), JSON.stringify(ordered, null, 2) + '\n')
  process.stdout.write(
    `\nwrote ${ordered.length} musicians (${core.length} curated + ${surprise.length} polished)\n` +
      `  → ${resolve(OUT, 'musicians.json')}\n` +
      `  → ${PORTRAITS}/<asset>.imageset (512² JPEG)\n`,
  )
}

main().catch((err) => {
  process.stderr.write(`\nFATAL: ${err.message}\n`)
  process.exit(1)
})
