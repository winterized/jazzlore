import { describe, expect, it } from 'vitest'
import { CURATED_SCALES } from '../features/scales/data/curated'
import { notesForScale } from './music'

const findScale = (id: string) => {
  const s = CURATED_SCALES.find((x) => x.id === id)
  if (!s) throw new Error(`scale ${id} missing from curated data`)
  return s
}

describe('notesForScale', () => {
  it('C Ionian → C D E F G A B', () => {
    expect(notesForScale('C', findScale('ionian'))).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B'])
  })

  it('Bb Dorian → Bb C Db Eb F G Ab', () => {
    expect(notesForScale('Bb', findScale('dorian'))).toEqual(['Bb', 'C', 'Db', 'Eb', 'F', 'G', 'Ab'])
  })

  it('F# Phrygian → F# G A B C# D E', () => {
    expect(notesForScale('F#', findScale('phrygian'))).toEqual(['F#', 'G', 'A', 'B', 'C#', 'D', 'E'])
  })

  it('Eb Bebop dominant has 8 notes', () => {
    expect(notesForScale('Eb', findScale('bebop-dominant'))).toHaveLength(8)
  })

  it('C Hirajoshi has 5 notes', () => {
    expect(notesForScale('C', findScale('hirajoshi'))).toHaveLength(5)
  })

  it('Db Ionian → Db Eb F Gb Ab Bb C', () => {
    expect(notesForScale('Db', findScale('ionian'))).toEqual(['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C'])
  })

  it('every curated scale produces the expected note count for root C', () => {
    for (const scale of CURATED_SCALES) {
      const notes = notesForScale('C', scale)
      expect(notes).toHaveLength(scale.semitones.length)
    }
  })
})
