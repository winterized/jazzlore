import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  addChord,
  getCollection,
  hasChord,
  removeChord,
  subscribe,
} from './chordCollectionStore'

describe('chordCollectionStore', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  // 1. Empty by default after a fresh load
  it('returns an empty collection by default', () => {
    expect(getCollection()).toEqual([])
  })

  // 2. addChord persists; getCollection returns the new entry
  it('addChord persists and getCollection returns the entry', () => {
    addChord('C', 'maj7')
    const col = getCollection()
    expect(col).toHaveLength(1)
    expect(col[0]).toMatchObject({ rootNote: 'C', chordId: 'maj7' })
    expect(typeof col[0]?.savedAt).toBe('string')
  })

  // 3. addChord is idempotent (same root+chordId pair doesn't duplicate)
  it('addChord is idempotent — duplicate does not create a second entry', () => {
    addChord('C', 'maj7')
    addChord('C', 'maj7')
    expect(getCollection()).toHaveLength(1)
  })

  // 4. removeChord removes the matching entry
  it('removeChord removes the matching entry', () => {
    addChord('B♭', 'm7')
    removeChord('B♭', 'm7')
    expect(hasChord('B♭', 'm7')).toBe(false)
    expect(getCollection()).toHaveLength(0)
  })

  // 5. hasChord works correctly for present and absent entries
  it('hasChord is true for saved entries and false for others', () => {
    addChord('F♯', '7alt')
    expect(hasChord('F♯', '7alt')).toBe(true)
    expect(hasChord('F♯', 'maj7')).toBe(false)
    expect(hasChord('C', '7alt')).toBe(false)
  })

  // 6. subscribe fires the listener on writes; cleanup function unsubscribes
  it('subscribe fires listener on addChord and removeChord', () => {
    const listener = vi.fn()
    const unsubscribe = subscribe(listener)

    addChord('C', '7')
    expect(listener).toHaveBeenCalledTimes(1)

    removeChord('C', '7')
    expect(listener).toHaveBeenCalledTimes(2)

    unsubscribe()
    addChord('C', 'maj')
    // Listener should NOT fire after unsubscribe
    expect(listener).toHaveBeenCalledTimes(2)
  })

  // 7. Persistence across "reloads" (re-import the store after writing data)
  it('persists data across module re-reads (same localStorage)', () => {
    addChord('C', 'maj7')
    addChord('B♭', 'm7')
    // Simulate a "reload" by reading again without clearing localStorage
    const snapshot = getCollection()
    expect(snapshot).toHaveLength(2)
    expect(snapshot.map((s) => s.chordId)).toEqual(['maj7', 'm7'])
  })

  // 8. Corruption resilience: invalid JSON → empty collection
  it('treats corrupt localStorage value as an empty collection', () => {
    localStorage.setItem('jazzlore:chords:v1', '{ not valid json }}}')
    expect(getCollection()).toEqual([])
  })

  // Edge: removeChord is a no-op when entry is not present
  it('removeChord is a no-op when entry is absent', () => {
    addChord('C', 'maj7')
    removeChord('C', 'm7') // different chordId — should not throw
    expect(getCollection()).toHaveLength(1)
  })

  // Edge: multiple distinct entries coexist
  it('stores multiple entries with different roots and chordIds', () => {
    addChord('C', 'maj7')
    addChord('F♯', '7alt')
    addChord('B♭', 'm7')
    const col = getCollection()
    expect(col).toHaveLength(3)
    expect(col.map((s) => `${s.rootNote}-${s.chordId}`)).toEqual([
      'C-maj7',
      'F♯-7alt',
      'B♭-m7',
    ])
  })
})
