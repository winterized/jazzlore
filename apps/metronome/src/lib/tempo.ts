// Pure tempo helpers — BPM clamping, classic-tempo navigation, Italian-name
// mapping. Used by the reducer and by the UI's display logic.
//
// The Italian-name boundaries come from the design handoff's README table:
//   30–59 Largo  · 60–75 Adagio · 76–107 Andante · 108–119 Moderato
//   120–155 Allegro · 156–199 Vivace · 200–240 Presto

export const BPM_MIN = 30
export const BPM_MAX = 240

/** Classic Italian-tradition tempos used for slider ticks AND the `[` `]`
 *  jump-stepper. Order matters (ascending) — `classicStep` walks the array. */
export const CLASSIC_TEMPOS = [40, 60, 66, 76, 108, 120, 144, 168, 200] as const

export type TempoName =
  | 'Largo'
  | 'Adagio'
  | 'Andante'
  | 'Moderato'
  | 'Allegro'
  | 'Vivace'
  | 'Presto'

/** Map a BPM to its Italian tempo name, per the design handoff table.
 *
 *  Boundaries are inclusive on the lower side, exclusive on the upper
 *  (matching the table: 60–75 means [60, 76)). Out-of-range values clamp
 *  to the nearest band so the caller doesn't have to pre-clamp; the BPM
 *  itself should already be in [BPM_MIN, BPM_MAX] via `clampBpm`. */
export function tempoName(bpm: number): TempoName {
  if (bpm < 60) return 'Largo'
  if (bpm < 76) return 'Adagio'
  if (bpm < 108) return 'Andante'
  if (bpm < 120) return 'Moderato'
  if (bpm < 156) return 'Allegro'
  if (bpm < 200) return 'Vivace'
  return 'Presto'
}

/** Clamp a finite number to [BPM_MIN, BPM_MAX] and round to an integer.
 *  Precondition: `bpm` is finite. Persistence validates before calling.
 *  Non-finite input returns NaN — surfaces upstream bugs loudly. */
export function clampBpm(bpm: number): number {
  return Math.max(BPM_MIN, Math.min(BPM_MAX, Math.round(bpm)))
}

/** Add `delta` to `bpm` and clamp. Used by the ±1 / ±10 nudges. */
export function nudgeBpm(bpm: number, delta: number): number {
  return clampBpm(bpm + delta)
}

/** Jump to the next-lower (`prev`) or next-higher (`next`) classic tempo.
 *
 *  - From a BPM equal to a classic tempo, jumps strictly past it.
 *  - From a BPM between two classic tempos, jumps to the bracketing one
 *    on the chosen side.
 *  - At the lower end (`prev` below CLASSIC_TEMPOS[0]) or upper end
 *    (`next` above the last classic) the result is clamped to the closest
 *    classic tempo within range — no out-of-range jumps. */
export function classicStep(bpm: number, dir: 'prev' | 'next'): number {
  if (dir === 'prev') {
    // walk from the top, find the highest classic strictly less than bpm
    for (let i = CLASSIC_TEMPOS.length - 1; i >= 0; i--) {
      const v = CLASSIC_TEMPOS[i]
      if (v !== undefined && v < bpm) return clampBpm(v)
    }
    return clampBpm(CLASSIC_TEMPOS[0] ?? BPM_MIN)
  }
  // next: find the lowest classic strictly greater than bpm
  for (let i = 0; i < CLASSIC_TEMPOS.length; i++) {
    const v = CLASSIC_TEMPOS[i]
    if (v !== undefined && v > bpm) return clampBpm(v)
  }
  return clampBpm(CLASSIC_TEMPOS[CLASSIC_TEMPOS.length - 1] ?? BPM_MAX)
}
