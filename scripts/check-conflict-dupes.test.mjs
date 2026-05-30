import { test } from 'node:test'
import assert from 'node:assert/strict'

import { findConflictDupes, isConflictDuplicate } from './check-conflict-dupes.mjs'

test('isConflictDuplicate matches the iCloud " N.ext" signature', () => {
  // Real offenders observed in apps/chords/dist
  assert.equal(isConflictDuplicate('favicon 2.svg'), true)
  assert.equal(isConflictDuplicate('registerSW 2.js'), true)
  assert.equal(isConflictDuplicate('index-1UX5rWZt 2.css'), true)
  assert.equal(isConflictDuplicate('workbox-9c191d2f 2.js'), true)
  // Higher conflict counters and multi-digit
  assert.equal(isConflictDuplicate('sw 3.js'), true)
  assert.equal(isConflictDuplicate('config 10.xml'), true)
  // Extensionless conflict copy (e.g. a dir or no-ext file)
  assert.equal(isConflictDuplicate('LICENSE 2'), true)
})

test('isConflictDuplicate rejects legitimate filenames', () => {
  assert.equal(isConflictDuplicate('index.html'), false)
  assert.equal(isConflictDuplicate('favicon.svg'), false)
  // Hyphen-joined numbers are NOT the iCloud signature (no " N" token)
  assert.equal(isConflictDuplicate('icon-192.png'), false)
  assert.equal(isConflictDuplicate('icon-512-maskable.png'), false)
  assert.equal(isConflictDuplicate('apple-touch-icon.png'), false)
  assert.equal(isConflictDuplicate('index-1UX5rWZt.css'), false)
  // A space NOT followed by a bare integer token
  assert.equal(isConflictDuplicate('my file.js'), false)
  assert.equal(isConflictDuplicate('chapter v2.md'), false)
})

test('findConflictDupes filters a list to only the offenders, preserving order', () => {
  const input = [
    'apps/chords/dist/index.html',
    'apps/chords/dist/favicon 2.svg',
    'apps/chords/dist/assets/index-1UX5rWZt.css',
    'apps/chords/dist/assets/index-1UX5rWZt 2.css',
    'apps/chords/dist/icons/icon-192.png',
    'apps/chords/dist/icons/icon-192 2.png',
  ]
  assert.deepEqual(findConflictDupes(input), [
    'apps/chords/dist/favicon 2.svg',
    'apps/chords/dist/assets/index-1UX5rWZt 2.css',
    'apps/chords/dist/icons/icon-192 2.png',
  ])
})

test('findConflictDupes returns [] on a clean list', () => {
  assert.deepEqual(findConflictDupes(['a.js', 'b/c.css', 'dir/icon-192.png']), [])
})
