import type { Family, ScaleDefinition } from '@jazzlore/music-core'

// re-export types for callers that import from this file
export type { Family, ScaleDefinition }

// ── Use-case grouping ─────────────────────────────────────────────────────────
// Scales are presented by chord-quality use case ("what plays over this chord?")
// rather than by derivational family. The `family` field below is preserved as
// data (derivational truth, searchable, future use) but no longer drives the UI.
export type ScaleGroup = 'maj7' | '7' | '7alt' | 'm7' | 'm6' | 'm7b5' | 'dim7' | 'color'

// App-level scale shape: the music-core ScaleDefinition plus the curation/editorial
// fields that are this app's concern (not music-core's). Structurally assignable
// to ScaleDefinition, so notesForScale(root, scale) still accepts it.
export type CuratedScale = ScaleDefinition & {
  /** chord-quality use-case group (drives section + chip) */
  group: ScaleGroup
  /** 1-based display order within its group */
  groupOrder: number
  /** short structural identity, plain terms (6–12 words) */
  description: string
  /** derivation + use tag (3–7 words), or structural-only for color */
  theoryTag: string
}

// `id` is the ASCII slug used for DOM anchors (`group-<id>`); `chip` is the short
// form shown in the chip row (may use Unicode ♭); `label` is the section header.
export const GROUPS: readonly { id: ScaleGroup; chip: string; label: string; defaultExpanded: boolean }[] = [
  { id: 'maj7', chip: 'maj7', label: 'Major / maj7', defaultExpanded: true },
  { id: '7', chip: '7', label: 'Dominant / 7', defaultExpanded: false },
  { id: '7alt', chip: '7alt', label: 'Altered dominant / 7alt', defaultExpanded: false },
  { id: 'm7', chip: 'm7', label: 'Minor / m7', defaultExpanded: false },
  { id: 'm6', chip: 'm6', label: 'Minor-major / m6', defaultExpanded: false },
  { id: 'm7b5', chip: 'm7♭5', label: 'Half-diminished / m7♭5', defaultExpanded: false },
  { id: 'dim7', chip: 'dim7', label: 'Diminished / dim7', defaultExpanded: false },
  { id: 'color', chip: 'color', label: 'Color / Modal', defaultExpanded: false },
]

// ── Derivational families ─────────────────────────────────────────────────────
// Preserved as data (no longer the grouping axis). Each scale still carries a
// `family`; this metadata documents the labels and is asserted in tests.
export const FAMILIES: readonly { id: Family; label: string; defaultExpanded: boolean }[] = [
  { id: 'modes-of-major', label: 'Modes of major', defaultExpanded: true },
  { id: 'modes-of-melodic-minor', label: 'Modes of melodic minor', defaultExpanded: false },
  { id: 'modes-of-harmonic-minor', label: 'Modes of harmonic minor', defaultExpanded: false },
  { id: 'symmetric', label: 'Symmetric', defaultExpanded: false },
  { id: 'pentatonic-blues', label: 'Pentatonic & blues', defaultExpanded: false },
  { id: 'bebop', label: 'Bebop', defaultExpanded: false },
  { id: 'exotic', label: 'Exotic', defaultExpanded: false },
]

// Ordered by group, then groupOrder (display order). Editorial copy (description /
// theoryTag) is reviewed and approved — embed verbatim, do not paraphrase.
export const CURATED_SCALES: readonly CuratedScale[] = [
  // ── maj7 — Major / maj7 (4) ──────────────────────────────────────────────
  { id: 'ionian',     name: 'Major',     alias: 'Ionian',        family: 'modes-of-major', intervalDisplay: ['1','2','3','4','5','6','7'],          semitones: [0,2,4,5,7,9,11], group: 'maj7', groupOrder: 1, description: 'The major scale', theoryTag: 'Ionian; mode I of major; over maj7 and I major' },
  { id: 'major-pentatonic',    name: 'Major pentatonic',                                  family: 'pentatonic-blues', intervalDisplay: ['1','2','3','5','6'],                  semitones: [0,2,4,7,9], group: 'maj7', groupOrder: 2, description: 'Five-note major: 1 2 3 5 6', theoryTag: 'Always safe over major; the foundation of countless solos' },
  { id: 'lydian',     name: 'Lydian',                             family: 'modes-of-major', intervalDisplay: ['1','2','3','♯4','5','6','7'],         semitones: [0,2,4,6,7,9,11], group: 'maj7', groupOrder: 3, description: 'Major with a ♯4', theoryTag: 'Mode IV of major; over maj7♯11' },
  { id: 'bebop-major',         name: 'Major bebop',                                       family: 'bebop', intervalDisplay: ['1','2','3','4','5','♯5','6','7'],                semitones: [0,2,4,5,7,8,9,11], group: 'maj7', groupOrder: 4, description: 'Major with a chromatic passing tone between 5 and 6', theoryTag: 'For bop lines over maj7' },

  // ── 7 — Dominant / 7 (6) ─────────────────────────────────────────────────
  { id: 'mixolydian', name: 'Mixolydian',                         family: 'modes-of-major', intervalDisplay: ['1','2','3','4','5','6','♭7'],         semitones: [0,2,4,5,7,9,10], group: '7', groupOrder: 1, description: 'Major with a ♭7', theoryTag: 'Mode V of major; the default V7 sound' },
  { id: 'bebop-dominant',      name: 'Bebop dominant',                                    family: 'bebop', intervalDisplay: ['1','2','3','4','5','6','♭7','7'],                 semitones: [0,2,4,5,7,9,10,11], group: '7', groupOrder: 2, description: 'Mixolydian with a chromatic passing tone between 1 and ♭7', theoryTag: 'The quintessential bop scale over V7' },
  { id: 'lydian-dominant',    name: 'Lydian dominant',    alias: 'Lydian ♭7',        family: 'modes-of-melodic-minor', intervalDisplay: ['1','2','3','♯4','5','6','♭7'],      semitones: [0,2,4,6,7,9,10], group: '7', groupOrder: 3, description: 'Mixolydian with a ♯4', theoryTag: 'Mode IV of melodic minor; over 7♯11 and tritone subs' },
  { id: 'half-whole-dim',      name: 'Diminished (half-whole)', alias: 'Dominant diminished', family: 'symmetric', intervalDisplay: ['1','♭2','♭3','3','♯4','5','6','♭7'],    semitones: [0,1,3,4,6,7,9,10], group: '7', groupOrder: 4, description: 'Alternating half and whole steps from the root', theoryTag: 'Symmetric; over 7♭9 and 7♯9' },
  { id: 'mixolydian-b6',      name: 'Mixolydian ♭6',      alias: 'Aeolian dominant', family: 'modes-of-melodic-minor', intervalDisplay: ['1','2','3','4','5','♭6','♭7'],      semitones: [0,2,4,5,7,8,10], group: '7', groupOrder: 5, description: 'Mixolydian with a ♭6', theoryTag: 'Mode V of melodic minor; over 7♭13' },
  { id: 'phrygian-dominant',   name: 'Phrygian dominant', alias: 'Spanish Phrygian',      family: 'modes-of-harmonic-minor', intervalDisplay: ['1','♭2','3','4','5','♭6','♭7'],        semitones: [0,1,4,5,7,8,10], group: '7', groupOrder: 6, description: 'Major with ♭2 and ♭6', theoryTag: 'Mode V of harmonic minor; over V7♭9 with Spanish flavor' },

  // ── 7alt — Altered dominant / 7alt (3) ───────────────────────────────────
  { id: 'altered',            name: 'Altered',            alias: 'Super Locrian',    family: 'modes-of-melodic-minor', intervalDisplay: ['1','♭2','♭3','♭4','♭5','♭6','♭7'],  semitones: [0,1,3,4,6,8,10], group: '7alt', groupOrder: 1, description: 'All tensions altered: ♭9 ♯9 ♯11 ♭13', theoryTag: 'Mode VII of melodic minor; aka Super Locrian' },
  { id: 'whole-tone',          name: 'Whole tone',                                        family: 'symmetric', intervalDisplay: ['1','2','3','♯4','♯5','♭7'],                    semitones: [0,2,4,6,8,10], group: '7alt', groupOrder: 2, description: 'Six notes, all whole steps', theoryTag: 'Symmetric; over 7♭5 and 7♯5' },
  { id: 'lydian-augmented',   name: 'Lydian augmented',                              family: 'modes-of-melodic-minor', intervalDisplay: ['1','2','3','♯4','♯5','6','7'],      semitones: [0,2,4,6,8,9,11], group: '7alt', groupOrder: 3, description: 'Major with ♯4 and ♯5', theoryTag: 'Mode III of melodic minor; over maj7♯5' },

  // ── m7 — Minor / m7 (6) ──────────────────────────────────────────────────
  { id: 'aeolian',    name: 'Natural minor', alias: 'Aeolian', family: 'modes-of-major', intervalDisplay: ['1','2','♭3','4','5','♭6','♭7'],       semitones: [0,2,3,5,7,8,10], group: 'm7', groupOrder: 1, description: 'The natural minor scale', theoryTag: 'Aeolian; mode VI of major; minor tonic' },
  { id: 'dorian',     name: 'Dorian',                             family: 'modes-of-major', intervalDisplay: ['1','2','♭3','4','5','6','♭7'],        semitones: [0,2,3,5,7,9,10], group: 'm7', groupOrder: 2, description: 'Minor with a natural 6', theoryTag: 'Mode II of major; the default m7 sound' },
  { id: 'minor-pentatonic',    name: 'Minor pentatonic',                                  family: 'pentatonic-blues', intervalDisplay: ['1','♭3','4','5','♭7'],                semitones: [0,3,5,7,10], group: 'm7', groupOrder: 3, description: 'Five-note minor: 1 ♭3 4 5 ♭7', theoryTag: 'Always safe over minor; the foundation of countless solos' },
  { id: 'bebop-dorian',        name: 'Bebop dorian',                                      family: 'bebop', intervalDisplay: ['1','2','♭3','3','4','5','6','♭7'],               semitones: [0,2,3,4,5,7,9,10], group: 'm7', groupOrder: 4, description: 'Dorian with a chromatic passing tone between ♭3 and 3', theoryTag: 'For bop lines over m7' },
  { id: 'phrygian',   name: 'Phrygian',                           family: 'modes-of-major', intervalDisplay: ['1','♭2','♭3','4','5','♭6','♭7'],      semitones: [0,1,3,5,7,8,10], group: 'm7', groupOrder: 5, description: 'Minor with a ♭2', theoryTag: 'Mode III of major; dark Spanish flavor, rare as a default m7 choice' },
  { id: 'dorian-b2',          name: 'Dorian ♭2',          alias: 'Phrygian ♮6',      family: 'modes-of-melodic-minor', intervalDisplay: ['1','♭2','♭3','4','5','6','♭7'],     semitones: [0,1,3,5,7,9,10], group: 'm7', groupOrder: 6, description: 'Dorian with a ♭2', theoryTag: 'Mode II of melodic minor; over m7 in altered contexts' },

  // ── m6 — Minor-major / m6 (3) ────────────────────────────────────────────
  { id: 'melodic-minor',      name: 'Melodic minor',      alias: 'Minor-major',      family: 'modes-of-melodic-minor', intervalDisplay: ['1','2','♭3','4','5','6','7'],       semitones: [0,2,3,5,7,9,11], group: 'm6', groupOrder: 1, description: 'Minor with natural 6 and natural 7', theoryTag: 'The jazz minor scale; over m6 and m(maj7)' },
  { id: 'bebop-melodic-minor', name: 'Bebop melodic minor',                               family: 'bebop', intervalDisplay: ['1','2','♭3','4','5','♭6','6','7'],               semitones: [0,2,3,5,7,8,9,11], group: 'm6', groupOrder: 2, description: 'Melodic minor with a chromatic passing tone between 5 and 6', theoryTag: 'For bop lines over m6' },
  { id: 'harmonic-minor',      name: 'Harmonic minor',                                    family: 'modes-of-harmonic-minor', intervalDisplay: ['1','2','♭3','4','5','♭6','7'],         semitones: [0,2,3,5,7,8,11], group: 'm6', groupOrder: 3, description: 'Minor with a natural 7', theoryTag: 'The classical minor; over m(maj7) and minor tonic' },

  // ── m7b5 — Half-diminished / m7♭5 (3) ────────────────────────────────────
  { id: 'locrian',    name: 'Locrian',                            family: 'modes-of-major', intervalDisplay: ['1','♭2','♭3','4','♭5','♭6','♭7'],     semitones: [0,1,3,5,6,8,10], group: 'm7b5', groupOrder: 1, description: 'Minor with ♭2 and ♭5', theoryTag: 'Mode VII of major; the default m7♭5 sound' },
  { id: 'locrian-nat2',       name: 'Locrian ♮2',         alias: 'Half-diminished',  family: 'modes-of-melodic-minor', intervalDisplay: ['1','2','♭3','4','♭5','♭6','♭7'],    semitones: [0,2,3,5,6,8,10], group: 'm7b5', groupOrder: 2, description: 'Locrian with a natural 2', theoryTag: 'Mode VI of melodic minor; the modern m7♭5 sound' },
  { id: 'locrian-nat6',        name: 'Locrian ♮6',                                        family: 'modes-of-harmonic-minor', intervalDisplay: ['1','♭2','♭3','4','♭5','6','♭7'],       semitones: [0,1,3,5,6,9,10], group: 'm7b5', groupOrder: 3, description: 'Locrian with a natural 6', theoryTag: 'Mode II of harmonic minor; rare in jazz' },

  // ── dim7 — Diminished / dim7 (1) ─────────────────────────────────────────
  { id: 'whole-half-dim',      name: 'Diminished (whole-half)', alias: 'Auxiliary diminished', family: 'symmetric', intervalDisplay: ['1','2','♭3','4','♭5','♭6','6','7'],    semitones: [0,2,3,5,6,8,9,11], group: 'dim7', groupOrder: 1, description: 'Alternating whole and half steps from the root', theoryTag: 'Symmetric; over dim7' },

  // ── color — Color / Modal (12) ───────────────────────────────────────────
  { id: 'blues',               name: 'Blues',             alias: 'Minor blues',           family: 'pentatonic-blues', intervalDisplay: ['1','♭3','4','♭5','5','♭7'],           semitones: [0,3,5,6,7,10], group: 'color', groupOrder: 1, description: 'Minor pentatonic with a ♭5 passing tone', theoryTag: 'The blues sound, fits over major or minor' },
  { id: 'major-blues',         name: 'Major blues',                                       family: 'pentatonic-blues', intervalDisplay: ['1','2','♭3','3','5','6'],             semitones: [0,2,3,4,7,9], group: 'color', groupOrder: 2, description: 'Major pentatonic with a ♭3 passing tone', theoryTag: 'The bright blues sound' },
  { id: 'hirajoshi',           name: 'Hirajoshi',         alias: 'Japanese pentatonic',   family: 'exotic', intervalDisplay: ['1','2','♭3','5','♭6'],                          semitones: [0,2,3,7,8], group: 'color', groupOrder: 3, description: 'Japanese pentatonic: 1 2 ♭3 5 ♭6', theoryTag: 'Dark and spacious' },
  { id: 'in-sen',              name: 'In Sen',            alias: 'Japanese',              family: 'exotic', intervalDisplay: ['1','♭2','4','5','♭7'],                          semitones: [0,1,5,7,10], group: 'color', groupOrder: 4, description: 'Japanese pentatonic: 1 ♭2 4 5 ♭7', theoryTag: 'Sparse and meditative' },
  { id: 'hungarian-minor',     name: 'Hungarian minor',                                   family: 'exotic', intervalDisplay: ['1','2','♭3','♯4','5','♭6','7'],                 semitones: [0,2,3,6,7,8,11], group: 'color', groupOrder: 5, description: 'Harmonic minor with a ♯4', theoryTag: 'Eastern European folk character' },
  { id: 'romanian-minor',      name: 'Romanian minor',                                    family: 'exotic', intervalDisplay: ['1','2','♭3','♯4','5','6','♭7'],                 semitones: [0,2,3,6,7,9,10], group: 'color', groupOrder: 6, description: 'Minor with ♯4 and natural 6', theoryTag: 'Eastern European folk character' },
  { id: 'double-harmonic',     name: 'Double harmonic',   alias: 'Byzantine, Arabic',     family: 'exotic', intervalDisplay: ['1','♭2','3','4','5','♭6','7'],                  semitones: [0,1,4,5,7,8,11], group: 'color', groupOrder: 7, description: 'Major with ♭2 and ♭6', theoryTag: 'The "Byzantine" scale; two augmented seconds' },
  { id: 'persian',             name: 'Persian',                                           family: 'exotic', intervalDisplay: ['1','♭2','3','4','♭5','♭6','7'],                 semitones: [0,1,4,5,6,8,11], group: 'color', groupOrder: 8, description: '1 ♭2 3 4 ♭5 ♭6 7', theoryTag: 'Most distant from common practice, two augmented seconds' },
  { id: 'ionian-aug',          name: 'Ionian ♯5',                                         family: 'modes-of-harmonic-minor', intervalDisplay: ['1','2','3','4','♯5','6','7'],          semitones: [0,2,4,5,8,9,11], group: 'color', groupOrder: 9, description: 'Major with a ♯5', theoryTag: 'Mode III of harmonic minor' },
  { id: 'dorian-sharp4',       name: 'Dorian ♯4',         alias: 'Ukrainian Dorian',      family: 'modes-of-harmonic-minor', intervalDisplay: ['1','2','♭3','♯4','5','6','♭7'],        semitones: [0,2,3,6,7,9,10], group: 'color', groupOrder: 10, description: 'Dorian with a ♯4', theoryTag: 'Mode IV of harmonic minor' },
  { id: 'lydian-sharp2',       name: 'Lydian ♯2',                                         family: 'modes-of-harmonic-minor', intervalDisplay: ['1','♯2','3','♯4','5','6','7'],         semitones: [0,3,4,6,7,9,11], group: 'color', groupOrder: 11, description: 'Lydian with a ♯2', theoryTag: 'Mode VI of harmonic minor' },
  { id: 'super-locrian-bb7',   name: 'Super Locrian ♭♭7', alias: 'Altered diminished',    family: 'modes-of-harmonic-minor', intervalDisplay: ['1','♭2','♭3','♭4','♭5','♭6','♭♭7'],    semitones: [0,1,3,4,6,8,9], group: 'color', groupOrder: 12, description: 'Locrian with a double-flat 7', theoryTag: 'Mode VII of harmonic minor' },
]
