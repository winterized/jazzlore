import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { isSaved, listSaved, save, unsave } from './collectionStore'

describe('collectionStore', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it('save+list+isSaved roundtrip', () => {
    save({ rootNote: 'C', scaleId: 'dorian' })
    expect(isSaved('C', 'dorian')).toBe(true)
    expect(listSaved()).toEqual([
      expect.objectContaining({ rootNote: 'C', scaleId: 'dorian' }),
    ])
  })

  it('unsave removes a row', () => {
    save({ rootNote: 'Bb', scaleId: 'altered' })
    unsave('Bb', 'altered')
    expect(isSaved('Bb', 'altered')).toBe(false)
  })

  it('save is idempotent (no duplicates)', () => {
    save({ rootNote: 'C', scaleId: 'dorian' })
    save({ rootNote: 'C', scaleId: 'dorian' })
    expect(listSaved()).toHaveLength(1)
  })
})
