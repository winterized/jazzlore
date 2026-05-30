#!/usr/bin/env node
// Guard against iCloud Drive conflict-duplicate files ("<name> 2.ext").
//
// The working tree lives under ~/Documents, which is iCloud-synced. On sync
// conflicts iCloud spawns "<name> 2.ext" copies. In build output (e.g.
// apps/chords/dist) these get bundled verbatim by the native iOS wrapper's
// `make <app>` into the .ipa — dead, unreferenced junk shipped to the App
// Store. See GH #137. Run `pnpm check:dupes` before `make <app>`; clean-rebuild
// the offending app's dist if this flags anything.
//
// Pure helpers (isConflictDuplicate / findConflictDupes) are unit-tested via
// `node --test scripts/check-conflict-dupes.test.mjs`.

import { readdirSync } from 'node:fs'
import { join, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

// iCloud signature: a space, then a bare integer counter (" 2", " 10"),
// optionally followed by a single extension, at the end of the basename.
// Deliberately does NOT match hyphen-joined numbers (icon-192.png) or "v2".
const CONFLICT_RE = / \d+(\.[^.]+)?$/

/** True when a basename matches the iCloud conflict-duplicate signature. */
export function isConflictDuplicate(name) {
  return CONFLICT_RE.test(name)
}

/** Filter a list of paths to those whose basename is a conflict duplicate. */
export function findConflictDupes(paths) {
  return paths.filter((p) => isConflictDuplicate(basename(p)))
}

// Directories never worth scanning: deps, git internals, and OMC's local tool
// state (its own " 2" files are transient and never shipped).
const SKIP_DIRS = new Set(['node_modules', '.git', '.omc'])

/** Recursively collect every file path under `root` (excluding SKIP_DIRS). */
function walk(root) {
  const out = []
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue
      out.push(...walk(join(root, entry.name)))
    } else {
      out.push(join(root, entry.name))
    }
  }
  return out
}

function main() {
  const repoRoot = fileURLToPath(new URL('..', import.meta.url))
  const dupes = findConflictDupes(walk(repoRoot)).map((p) => p.slice(repoRoot.length))

  if (dupes.length === 0) {
    console.log('✓ no iCloud conflict-duplicate files found')
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
