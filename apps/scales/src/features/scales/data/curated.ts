import type { Family, ScaleDefinition } from '@jazzlore/music-core'

// re-export types for callers that import from this file
export type { Family, ScaleDefinition }

export const FAMILIES: readonly { id: Family; label: string; defaultExpanded: boolean }[] = [
  { id: 'modes-of-major', label: 'Modes of major', defaultExpanded: true },
  { id: 'modes-of-melodic-minor', label: 'Modes of melodic minor', defaultExpanded: false },
  { id: 'modes-of-harmonic-minor', label: 'Modes of harmonic minor', defaultExpanded: false },
  { id: 'symmetric', label: 'Symmetric', defaultExpanded: false },
  { id: 'pentatonic-blues', label: 'Pentatonic & blues', defaultExpanded: false },
  { id: 'bebop', label: 'Bebop', defaultExpanded: false },
  { id: 'exotic', label: 'Exotic', defaultExpanded: false },
]

export const CURATED_SCALES: readonly ScaleDefinition[] = [
  // Modes of major (7)
  { id: 'ionian',     name: 'Ionian',     alias: 'Major',         family: 'modes-of-major', intervalDisplay: ['1','2','3','4','5','6','7'],          semitones: [0,2,4,5,7,9,11] },
  { id: 'dorian',     name: 'Dorian',                             family: 'modes-of-major', intervalDisplay: ['1','2','♭3','4','5','6','♭7'],        semitones: [0,2,3,5,7,9,10] },
  { id: 'phrygian',   name: 'Phrygian',                           family: 'modes-of-major', intervalDisplay: ['1','♭2','♭3','4','5','♭6','♭7'],      semitones: [0,1,3,5,7,8,10] },
  { id: 'lydian',     name: 'Lydian',                             family: 'modes-of-major', intervalDisplay: ['1','2','3','♯4','5','6','7'],         semitones: [0,2,4,6,7,9,11] },
  { id: 'mixolydian', name: 'Mixolydian',                         family: 'modes-of-major', intervalDisplay: ['1','2','3','4','5','6','♭7'],         semitones: [0,2,4,5,7,9,10] },
  { id: 'aeolian',    name: 'Aeolian',    alias: 'Natural minor', family: 'modes-of-major', intervalDisplay: ['1','2','♭3','4','5','♭6','♭7'],       semitones: [0,2,3,5,7,8,10] },
  { id: 'locrian',    name: 'Locrian',                            family: 'modes-of-major', intervalDisplay: ['1','♭2','♭3','4','♭5','♭6','♭7'],     semitones: [0,1,3,5,6,8,10] },

  // Modes of melodic minor (7)
  { id: 'melodic-minor',      name: 'Melodic minor',      alias: 'Minor-major',      family: 'modes-of-melodic-minor', intervalDisplay: ['1','2','♭3','4','5','6','7'],       semitones: [0,2,3,5,7,9,11] },
  { id: 'dorian-b2',          name: 'Dorian ♭2',          alias: 'Phrygian ♮6',      family: 'modes-of-melodic-minor', intervalDisplay: ['1','♭2','♭3','4','5','6','♭7'],     semitones: [0,1,3,5,7,9,10] },
  { id: 'lydian-augmented',   name: 'Lydian augmented',                              family: 'modes-of-melodic-minor', intervalDisplay: ['1','2','3','♯4','♯5','6','7'],      semitones: [0,2,4,6,8,9,11] },
  { id: 'lydian-dominant',    name: 'Lydian dominant',    alias: 'Lydian ♭7',        family: 'modes-of-melodic-minor', intervalDisplay: ['1','2','3','♯4','5','6','♭7'],      semitones: [0,2,4,6,7,9,10] },
  { id: 'mixolydian-b6',      name: 'Mixolydian ♭6',      alias: 'Aeolian dominant', family: 'modes-of-melodic-minor', intervalDisplay: ['1','2','3','4','5','♭6','♭7'],      semitones: [0,2,4,5,7,8,10] },
  { id: 'locrian-nat2',       name: 'Locrian ♮2',         alias: 'Half-diminished',  family: 'modes-of-melodic-minor', intervalDisplay: ['1','2','♭3','4','♭5','♭6','♭7'],    semitones: [0,2,3,5,6,8,10] },
  { id: 'altered',            name: 'Altered',            alias: 'Super Locrian',    family: 'modes-of-melodic-minor', intervalDisplay: ['1','♭2','♭3','♭4','♭5','♭6','♭7'],  semitones: [0,1,3,4,6,8,10] },

  // Modes of harmonic minor (7)
  { id: 'harmonic-minor',      name: 'Harmonic minor',                                    family: 'modes-of-harmonic-minor', intervalDisplay: ['1','2','♭3','4','5','♭6','7'],         semitones: [0,2,3,5,7,8,11] },
  { id: 'locrian-nat6',        name: 'Locrian ♮6',                                        family: 'modes-of-harmonic-minor', intervalDisplay: ['1','♭2','♭3','4','♭5','6','♭7'],       semitones: [0,1,3,5,6,9,10] },
  { id: 'ionian-aug',          name: 'Ionian ♯5',                                         family: 'modes-of-harmonic-minor', intervalDisplay: ['1','2','3','4','♯5','6','7'],          semitones: [0,2,4,5,8,9,11] },
  { id: 'dorian-sharp4',       name: 'Dorian ♯4',         alias: 'Ukrainian Dorian',      family: 'modes-of-harmonic-minor', intervalDisplay: ['1','2','♭3','♯4','5','6','♭7'],        semitones: [0,2,3,6,7,9,10] },
  { id: 'phrygian-dominant',   name: 'Phrygian dominant', alias: 'Spanish Phrygian',      family: 'modes-of-harmonic-minor', intervalDisplay: ['1','♭2','3','4','5','♭6','♭7'],        semitones: [0,1,4,5,7,8,10] },
  { id: 'lydian-sharp2',       name: 'Lydian ♯2',                                         family: 'modes-of-harmonic-minor', intervalDisplay: ['1','♯2','3','♯4','5','6','7'],         semitones: [0,3,4,6,7,9,11] },
  { id: 'super-locrian-bb7',   name: 'Super Locrian ♭♭7', alias: 'Altered diminished',    family: 'modes-of-harmonic-minor', intervalDisplay: ['1','♭2','♭3','♭4','♭5','♭6','♭♭7'],    semitones: [0,1,3,4,6,8,9] },

  // Symmetric (3)
  { id: 'whole-tone',          name: 'Whole tone',                                        family: 'symmetric', intervalDisplay: ['1','2','3','♯4','♯5','♭7'],                    semitones: [0,2,4,6,8,10] },
  { id: 'half-whole-dim',      name: 'Diminished (half-whole)', alias: 'Dominant diminished', family: 'symmetric', intervalDisplay: ['1','♭2','♭3','3','♯4','5','6','♭7'],    semitones: [0,1,3,4,6,7,9,10] },
  { id: 'whole-half-dim',      name: 'Diminished (whole-half)', alias: 'Auxiliary diminished', family: 'symmetric', intervalDisplay: ['1','2','♭3','4','♭5','♭6','6','7'],    semitones: [0,2,3,5,6,8,9,11] },

  // Pentatonic & blues (4)
  { id: 'major-pentatonic',    name: 'Major pentatonic',                                  family: 'pentatonic-blues', intervalDisplay: ['1','2','3','5','6'],                  semitones: [0,2,4,7,9] },
  { id: 'minor-pentatonic',    name: 'Minor pentatonic',                                  family: 'pentatonic-blues', intervalDisplay: ['1','♭3','4','5','♭7'],                semitones: [0,3,5,7,10] },
  { id: 'blues',               name: 'Blues',             alias: 'Minor blues',           family: 'pentatonic-blues', intervalDisplay: ['1','♭3','4','♭5','5','♭7'],           semitones: [0,3,5,6,7,10] },
  { id: 'major-blues',         name: 'Major blues',                                       family: 'pentatonic-blues', intervalDisplay: ['1','2','♭3','3','5','6'],             semitones: [0,2,3,4,7,9] },

  // Bebop (4)
  { id: 'bebop-dominant',      name: 'Bebop dominant',                                    family: 'bebop', intervalDisplay: ['1','2','3','4','5','6','♭7','7'],                 semitones: [0,2,4,5,7,9,10,11] },
  { id: 'bebop-major',         name: 'Bebop major',                                       family: 'bebop', intervalDisplay: ['1','2','3','4','5','♯5','6','7'],                semitones: [0,2,4,5,7,8,9,11] },
  { id: 'bebop-dorian',        name: 'Bebop dorian',                                      family: 'bebop', intervalDisplay: ['1','2','♭3','3','4','5','6','♭7'],               semitones: [0,2,3,4,5,7,9,10] },
  { id: 'bebop-melodic-minor', name: 'Bebop melodic minor',                               family: 'bebop', intervalDisplay: ['1','2','♭3','4','5','♭6','6','7'],               semitones: [0,2,3,5,7,8,9,11] },

  // Exotic (6)
  { id: 'double-harmonic',     name: 'Double harmonic',   alias: 'Byzantine, Arabic',     family: 'exotic', intervalDisplay: ['1','♭2','3','4','5','♭6','7'],                  semitones: [0,1,4,5,7,8,11] },
  { id: 'hungarian-minor',     name: 'Hungarian minor',                                   family: 'exotic', intervalDisplay: ['1','2','♭3','♯4','5','♭6','7'],                 semitones: [0,2,3,6,7,8,11] },
  { id: 'romanian-minor',      name: 'Romanian minor',                                    family: 'exotic', intervalDisplay: ['1','2','♭3','♯4','5','6','♭7'],                 semitones: [0,2,3,6,7,9,10] },
  { id: 'persian',             name: 'Persian',                                           family: 'exotic', intervalDisplay: ['1','♭2','3','4','♭5','♭6','7'],                 semitones: [0,1,4,5,6,8,11] },
  { id: 'hirajoshi',           name: 'Hirajoshi',         alias: 'Japanese pentatonic',   family: 'exotic', intervalDisplay: ['1','2','♭3','5','♭6'],                          semitones: [0,2,3,7,8] },
  { id: 'in-sen',              name: 'In Sen',            alias: 'Japanese',              family: 'exotic', intervalDisplay: ['1','♭2','4','5','♭7'],                          semitones: [0,1,5,7,10] },
]
