/**
 * Musicians initial-JS budget guard (L1).
 *
 * Standalone, explicitly-invoked (`pnpm bundle:budget`) — NOT wired into the
 * build pipeline, so it can never flake a build: it just inspects an existing
 * `apps/musicians/dist`. Run it AFTER `pnpm build`.
 *
 * Fails (exit 1) if either:
 *   - the initial entry chunk (`dist/assets/index-*.js`) exceeds LIMIT_GZ
 *     (d3-force + graph + heavy fonts must stay dynamically imported), or
 *   - d3-force leaks into that initial chunk (its `alphaDecay` /
 *     `velocityDecay` markers must appear ONLY in the lazy `graph-*.js`).
 */

import { gzipSync } from 'node:zlib'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const assetsDir = join(repoRoot, 'apps/musicians/dist/assets')

// The quality bar is 100 KB gz. The chunk was already 110.6 KB when this
// check joined the gate (2026-10-09), so the gate holds a TEMPORARY 112 KB
// ceiling that stops further growth. The task that brings the chunk under
// 100 KB sets this back to QUALITY_BAR_GZ. See docs/DECISIONS.md.
const QUALITY_BAR_GZ = 100 * 1024
const LIMIT_GZ = 112 * 1024
const D3_MARKERS = ['alphaDecay', 'velocityDecay']

function fail(msg) {
  console.error(`✗ musicians bundle budget: ${msg}`)
  process.exit(1)
}

let files
try {
  files = readdirSync(assetsDir)
} catch {
  fail(`no build output at ${assetsDir} — run \`pnpm build\` first`)
}

const initial = files.find((f) => /^index-.*\.js$/.test(f))
if (!initial) fail('no initial chunk (index-*.js) found in dist/assets')

const initialSrc = readFileSync(join(assetsDir, initial))
const gz = gzipSync(initialSrc).length
const leaked = D3_MARKERS.filter((m) => initialSrc.includes(m))

const graphChunk = files.find((f) => /^graph-.*\.js$/.test(f))
const graphHasD3 =
  graphChunk &&
  D3_MARKERS.some((m) =>
    readFileSync(join(assetsDir, graphChunk)).includes(m),
  )

console.log(
  `musicians initial ${initial}: ${(gz / 1024).toFixed(2)} KB gz ` +
    `(limit ${(LIMIT_GZ / 1024).toFixed(0)} KB) · ` +
    `d3-force in initial: ${leaked.length ? leaked.join(',') : 'none'} · ` +
    `lazy graph chunk: ${graphChunk ?? 'MISSING'}` +
    `${graphChunk ? ` (d3-force present: ${graphHasD3 ? 'yes' : 'no'})` : ''}`,
)

if (gz > LIMIT_GZ) {
  fail(`initial chunk ${(gz / 1024).toFixed(2)} KB gz exceeds the gate's ${(LIMIT_GZ / 1024).toFixed(0)} KB ceiling`)
}
if (gz > QUALITY_BAR_GZ) {
  console.log(
    `! still above the ${(QUALITY_BAR_GZ / 1024).toFixed(0)} KB quality bar; the gate's ${(LIMIT_GZ / 1024).toFixed(0)} KB limit is a temporary ceiling`,
  )
}
if (leaked.length > 0) {
  fail(`d3-force (${leaked.join(', ')}) leaked into the initial chunk`)
}
if (!graphChunk || !graphHasD3) {
  fail('d3-force is not in the lazy graph chunk where it belongs')
}

console.log('✓ musicians bundle budget OK')
