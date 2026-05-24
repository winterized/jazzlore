import { describe, expect, it } from 'vitest'
import {
  familyClass,
  familyFor,
  FAMILY_KEYS,
  type Family,
} from './instrumentFamilies'

describe('familyFor', () => {
  it('maps each family to its representative instruments', () => {
    // Brass
    expect(familyFor('trumpet')).toBe('brass')
    expect(familyFor('trombone')).toBe('brass')
    expect(familyFor('cornet')).toBe('brass')
    expect(familyFor('flugelhorn')).toBe('brass')
    expect(familyFor('tuba')).toBe('brass')
    expect(familyFor('french horn')).toBe('brass')

    // Reeds / woodwinds
    expect(familyFor('saxophone')).toBe('reeds')
    expect(familyFor('tenor sax')).toBe('reeds')
    expect(familyFor('alto sax')).toBe('reeds')
    expect(familyFor('clarinet')).toBe('reeds')
    expect(familyFor('bass clarinet')).toBe('reeds')
    expect(familyFor('oboe')).toBe('reeds')
    expect(familyFor('bassoon')).toBe('reeds')
    expect(familyFor('flute')).toBe('reeds')
    expect(familyFor('piccolo')).toBe('reeds')

    // Strings
    expect(familyFor('double bass')).toBe('strings')
    expect(familyFor('upright bass')).toBe('strings')
    expect(familyFor('cello')).toBe('strings')
    expect(familyFor('violin')).toBe('strings')
    expect(familyFor('viola')).toBe('strings')
    expect(familyFor('fiddle')).toBe('strings')
    expect(familyFor('guitar')).toBe('strings')
    expect(familyFor('banjo')).toBe('strings')
    expect(familyFor('mandolin')).toBe('strings')
    expect(familyFor('ukulele')).toBe('strings')
    // Harp lands in strings via figKey -> 'violin' (visual-mass mapping)
    // — correct family even though the figure shape borrows the violin.
    expect(familyFor('harp')).toBe('strings')

    // Keys
    expect(familyFor('piano')).toBe('keys')
    expect(familyFor('electric piano')).toBe('keys')
    expect(familyFor('rhodes')).toBe('keys')
    expect(familyFor('wurlitzer')).toBe('keys')
    expect(familyFor('keyboard')).toBe('keys')
    expect(familyFor('hammond')).toBe('keys')
    expect(familyFor('organ')).toBe('keys')

    // Percussion (vibes is a judgment call — mallet families with drums,
    // documented in instrumentFamilies.ts).
    expect(familyFor('drums')).toBe('percussion')
    expect(familyFor('percussion')).toBe('percussion')
    expect(familyFor('cymbals')).toBe('percussion')
    expect(familyFor('vibraphone')).toBe('percussion')
    expect(familyFor('marimba')).toBe('percussion')
    expect(familyFor('xylophone')).toBe('percussion')

    // Voice
    expect(familyFor('vocals')).toBe('voice')
    expect(familyFor('voice')).toBe('voice')
    expect(familyFor('singer')).toBe('voice')
    expect(familyFor('scat')).toBe('voice')
  })

  it('collapses absent / empty / unrecognised instruments to "unknown"', () => {
    expect(familyFor(undefined)).toBe('unknown')
    expect(familyFor(null)).toBe('unknown')
    expect(familyFor('')).toBe('unknown')
    expect(familyFor('   ')).toBe('unknown')
    expect(familyFor('—')).toBe('unknown')
    expect(familyFor('theremin')).toBe('unknown')
    expect(familyFor('washboard')).toBe('unknown')
  })

  it('is case-insensitive (relies on figKey lowering)', () => {
    expect(familyFor('PIANO')).toBe('keys')
    expect(familyFor('Trumpet')).toBe('brass')
    expect(familyFor('Bass Clarinet')).toBe('reeds')
  })

  it('FAMILY_KEYS enumerates all 7 families', () => {
    expect(new Set<Family>(FAMILY_KEYS)).toEqual(
      new Set<Family>([
        'brass',
        'reeds',
        'strings',
        'keys',
        'percussion',
        'voice',
        'unknown',
      ]),
    )
    expect(FAMILY_KEYS).toHaveLength(7)
  })
})

describe('familyClass', () => {
  it('emits the mu-family-<key> CSS hook', () => {
    expect(familyClass('trumpet')).toBe('mu-family-brass')
    expect(familyClass('piano')).toBe('mu-family-keys')
    expect(familyClass('drums')).toBe('mu-family-percussion')
    expect(familyClass(undefined)).toBe('mu-family-unknown')
    expect(familyClass(null)).toBe('mu-family-unknown')
    expect(familyClass('')).toBe('mu-family-unknown')
  })
})
