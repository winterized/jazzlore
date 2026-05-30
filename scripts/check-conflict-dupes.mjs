#!/usr/bin/env node
// Guard against iCloud Drive conflict-duplicate files ("<name> 2.ext").
//
// The working tree lives under ~/Documents, which is iCloud-synced. On sync
// conflicts iCloud spawns "<name> 2.ext" copies. In build output (apps/*/dist)
// these get bundled verbatim by the native iOS wrapper's `make <app>` into the
// .ipa — dead, unreferenced junk shipped to the App Store. See GH #137. Run
// `pnpm check:dupes` before `make <app>`; clean-rebuild the offending app's
// dist if this flags anything.
//
// Scope is deliberately limited to apps/*/dist — the only surface `make <app>`
// bundles. Scanning the whole repo would flag legitimately-numbered source
// files (e.g. a "figure 2.svg" doc asset), which are NOT iCloud dupes.
//
// Pure helpers (isConflictDuplicate / findConflictDupes) are unit-tested via
// `node --test scripts/check-conflict-dupes.test.mjs`.

import { readdirSync, existsSync } from 'node:fs'
import { join, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

// iCloud signature: a space, then a bare integer counter (" 2", " 10"),
// optionally followed by a single extension, at the end of the basename.
// Deliberately does NOT match hyphen-joined numbers (icon-192.png) or "v2".
// iCloud inserts the counter before the LAST dot, so "index-1UX5rWZt 2.css"
// and "archive.tar 2.gz" both match.
const CONFLICT_RE = / \d+(\.[^.]+)?$/

/** True when a basename matches the iCloud conflict-duplicate signature. */
export function isConflictDuplicate(name) {
  return CONFLICT_RE.test(name)
}

/** Filter a list of paths to those whose basename is a conflict duplicate. */
export function findConflictDupes(paths) {
  return paths.filter((p) => isConflictDuplicate(basename(p)))
}

/** Recursively collect every file path under `root`. Unreadable dirs are skipped. */
function walk(root) {
  const out = []
  let entries
  try {
    entries = readdirSync(root, { withFileTypes: true })
  } catch (err) {
    console.warn(`skipped ${root}: ${err.code ?? err.message}`)
    return out
  }
  for (const entry of entries) {
    const full = join(root, entry.name)
    // isDirectory() is false for symlinks, so symlinked dirs are treated as
    // files and never recursed — no symlink-loop risk.
    if (entry.isDirectory()) out.push(...walk(full))
    else out.push(full)
  }
  return out
}

function main() {
  const repoRoot = fileURLToPath(new URL('..', import.meta.url))
  const appsDir = join(repoRoot, 'apps')

  // Every apps/<app>/dist that has been built. `make <app>` copies these
  // verbatim, so they are the only surface that can leak dupes into an .ipa.
  const distRoots = readdirSync(appsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => join(appsDir, e.name, 'dist'))
    .filter((p) => existsSync(p))

  const dupes = findConflictDupes(distRoots.flatMap(walk)).map((p) => p.slice(repoRoot.length))

  if (dupes.length === 0) {
    console.log('✓ no iCloud conflict-duplicate files in apps/*/dist')
    return
  }

  console.error(
    `✖ found ${dupes.length} iCloud conflict-duplicate file(s) — these would be bundled by \`make <app>\` (GH #137):`,
  )
  for (const d of dupes) console.error(`  ${d}`)
  console.error(
    '\nClean-rebuild the affected app (e.g. `rm -rf apps/chords/dist && pnpm build:chords`) and re-run.',
  )
  process.exit(1)
}

// Only run the filesystem scan when executed directly, not when imported by the test.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
