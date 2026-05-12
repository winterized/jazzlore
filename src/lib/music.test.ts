import { describe, expect, it } from 'vitest'
import { CURATED_SCALES } from '../features/scales/data/curated'
import { notesForScale, pitchClass } from './music'

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

describe('pitchClass', () => {
  it('C = 0, D = 2, ..., B = 11', () => {
    expect(pitchClass('C')).toBe(0)
    expect(pitchClass('D')).toBe(2)
    expect(pitchClass('E')).toBe(4)
    expect(pitchClass('F')).toBe(5)
    expect(pitchClass('G')).toBe(7)
    expect(pitchClass('A')).toBe(9)
    expect(pitchClass('B')).toBe(11)
  })

  it('sharps add 1', () => {
    expect(pitchClass('C#')).toBe(1)
    expect(pitchClass('F#')).toBe(6)
    expect(pitchClass('A#')).toBe(10)
  })

  it('flats subtract 1', () => {
    expect(pitchClass('Db')).toBe(1)
    expect(pitchClass('Eb')).toBe(3)
    expect(pitchClass('Gb')).toBe(6)
    expect(pitchClass('Ab')).toBe(8)
    expect(pitchClass('Bb')).toBe(10)
  })

  it('double flats subtract 2', () => {
    expect(pitchClass('Bbb')).toBe(9)  // A
    expect(pitchClass('Ebb')).toBe(2)  // D
  })

  it('throws on empty input', () => {
    expect(() => pitchClass('')).toThrow(/empty note/)
  })

  it('throws on unknown letter', () => {
    expect(() => pitchClass('H')).toThrow(/unknown note letter/)
    expect(() => pitchClass('Xb')).toThrow(/unknown note letter/)
  })
})
