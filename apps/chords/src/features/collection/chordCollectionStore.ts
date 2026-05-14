/**
 * chordCollectionStore — persistence layer for saved chords.
 *
 * Wraps `@jazzlore/music-core/storage` (which wraps localStorage) under the
 * key `jazzlore:chords:v1`. Provides a lightweight pub-sub so same-tab
 * components can react to writes without relying on `storage` events (which
 * only fire cross-tab).
 *
 * Storage key note: `read`/`write` from music-core prepend the `jazzlore:`
 * prefix automatically, so we pass only the suffix `'chords:v1'` here. The
 * full key in localStorage is therefore `jazzlore:chords:v1`.
 *
 * Snapshot stability: getSnapshot() returns a stable array reference for
 * useSyncExternalStore consumers. It re-reads from localStorage on demand so
 * tests that call localStorage.clear() get a fresh (empty) snapshot on the
 * next call, while production code only sees a new reference after actual
 * store writes.
 */

import { write } from '@jazzlore/music-core'
import type { ChordId } from '@jazzlore/music-core'

export type SavedChord = {
  /** Root note in Unicode display form, e.g. 'C', 'F♯', 'B♭'. */
  rootNote: string
  /** Stable ASCII chord id, e.g. 'maj7', '7alt'. Matches ChordId union. */
  chordId: ChordId
  /** ISO 8601 timestamp, written at save time. */
  savedAt: string
}

const KEY = 'chords:v1'

// ── Pub-sub ──────────────────────────────────────────────────────────────────
// Same-tab storage events don't fire, so we maintain our own listener set.
// Listeners are notified synchronously after every write.

type Listener = () => void
const listeners = new Set<Listener>()

function notify(): void {
  for (const l of listeners) l()
}

/** Subscribe to collection changes. Returns an unsubscribe function. */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

// ── Snapshot cache ────────────────────────────────────────────────────────────
// useSyncExternalStore requires getSnapshot to return the same reference when
// the store hasn't changed; always calling JSON.parse would produce a new array
// every time, causing infinite re-renders.
//
// We track the last raw JSON string from localStorage. If it hasn't changed,
// we return the same `cachedList` reference. This also means tests that call
// localStorage.clear() get an empty snapshot on the next call (raw becomes null
// → different from the previous raw → re-parses → empty array).

let cachedRaw: string | null = undefined as unknown as string | null
let cachedList: readonly SavedChord[] = []

function readSnapshot(): readonly SavedChord[] {
  const raw = localStorage.getItem('jazzlore:chords:v1')
  if (raw === cachedRaw) return cachedList
  cachedRaw = raw
  if (raw === null) {
    cachedList = []
    return cachedList
  }
  try {
    cachedList = JSON.parse(raw) as SavedChord[]
  } catch {
    cachedList = []
  }
  return cachedList
}

function persist(list: SavedChord[]): void {
  write(KEY, list)
  // After writing, reset cache so the next readSnapshot() call picks up the
  // new raw string and returns the fresh list.
  cachedRaw = undefined as unknown as string | null
  cachedList = list
  // Set cachedRaw to the just-written value so same-reference is returned on
  // the next call without re-parsing.
  cachedRaw = localStorage.getItem('jazzlore:chords:v1')
  notify()
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Return a stable snapshot of all saved chords (ordered by insertion time).
 *
 * Returns the same array reference when the underlying localStorage value
 * hasn't changed, making this safe to pass as the `getSnapshot` argument to
 * useSyncExternalStore.
 */
export function getCollection(): readonly SavedChord[] {
  return readSnapshot()
}

/** Return true when rootNote+chordId pair is already in the collection. */
export function hasChord(rootNote: string, chordId: ChordId): boolean {
  return readSnapshot().some((s) => s.rootNote === rootNote && s.chordId === chordId)
}

/**
 * Append a saved chord. Idempotent: calling twice with the same root+id
 * does not produce a duplicate entry.
 */
export function addChord(rootNote: string, chordId: ChordId): void {
  const current = readSnapshot()
  if (current.some((s) => s.rootNote === rootNote && s.chordId === chordId)) return
  persist([...current, { rootNote, chordId, savedAt: new Date().toISOString() }])
}

/** Remove the matching entry. No-op when the entry is not present. */
export function removeChord(rootNote: string, chordId: ChordId): void {
  const next = readSnapshot().filter((s) => !(s.rootNote === rootNote && s.chordId === chordId))
  persist(next)
}
