// Graph-only: collapse the 14 figKey instrument categories into 6 visual
// families (+ unknown) for node-fill colour-coding. The graph becomes
// informative at a glance — same-hue cluster = same family — while the
// exact instrument string still appears on the hover/focus label.
//
// This is a thin lookup on top of `figKey` (the existing 14-key resolver
// in components/noPhotoFigures.lib.ts), so instrument-string normalisation
// stays in one place — adding "cornet" / "flugelhorn" / etc. is a
// noPhotoFigures concern; the family mapping below stays stable.
//
// Lives under features/graph/ on purpose: the family colour is a graph
// affordance and must NOT propagate to tiles, rails, cards, mosaic, era
// strip, or the Duo3 primitive. Those keep the existing duotone treatment.
import { figKey, type FigKey } from '../../components/noPhotoFigures.lib'

/** Six visual families plus an unknown bucket for sparse data.
 *
 *  - `brass` — trumpet, trombone, tuba, horn, cornet, flugel
 *  - `reeds` — saxes, clarinets, oboes, bassoons, flutes, piccolos
 *  - `strings` — bass, violin family, guitar family, harp
 *  - `keys` — piano, organ, rhodes, hammond, wurlitzer
 *  - `percussion` — drums, vibes/mallets, marimba, xylophone
 *  - `voice` — vocals, scat, singers
 *  - `unknown` — neutral fallback for musicians with no instrument data
 *    (a deliberate, dignified non-signal — never an alarm colour). */
export type Family =
  | 'brass'
  | 'reeds'
  | 'strings'
  | 'keys'
  | 'percussion'
  | 'voice'
  | 'unknown'

/** Stable enumeration order — useful for legend rendering / iteration. */
export const FAMILY_KEYS: readonly Family[] = [
  'brass',
  'reeds',
  'strings',
  'keys',
  'percussion',
  'voice',
  'unknown',
]

/** 14 figKey categories → 6 families. Notes:
 *  - `vibes` → percussion (mallet logic = struck, like drums; flagged as a
 *    judgment call — could move to `keys` if screenshots disagree).
 *  - `harp` (figKey returns `violin` for visual mass) → strings (correct
 *    family even though the figure mass borrows the violin shape).
 *  - `rest` (figKey's unknown bucket) → unknown family.
 *  - The mapping is total over the 14-key union — TS catches any future
 *    figKey addition that forgets to assign a family. */
const KEY_TO_FAMILY: Record<FigKey, Family> = {
  trumpet: 'brass',
  trombone: 'brass',
  sax: 'reeds',
  clarinet: 'reeds',
  flute: 'reeds',
  bass: 'strings',
  violin: 'strings',
  guitar: 'strings',
  piano: 'keys',
  organ: 'keys',
  drums: 'percussion',
  vibes: 'percussion',
  voice: 'voice',
  rest: 'unknown',
}

/** Resolve a free-form instrument string to its visual family. NULL,
 *  undefined, empty, em-dash, and unrecognised strings collapse to
 *  `unknown` via `figKey`'s `rest` bucket. Pure — no side effects. */
export function familyFor(inst?: string | null): Family {
  return KEY_TO_FAMILY[figKey(inst)]
}

/** Convenience for the SVG render: emits the `mu-family-<key>` class the
 *  graph CSS hooks the family-fill rule on. Kept here so the class-name
 *  contract stays adjacent to the resolver — a future rename touches one
 *  file, not the scattered call sites. */
export function familyClass(inst?: string | null): string {
  return `mu-family-${familyFor(inst)}`
}
