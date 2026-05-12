import { transpose } from '@tonaljs/note'
import type { ScaleDefinition } from '../features/scales/data/curated'

/**
 * Map a display interval token from CURATED_SCALES (e.g. "♭3", "♯4") to a
 * Tonal interval string suitable for transpose(). The display tokens
 * encode the scale-degree spelling intent (♭6 vs ♯5 are 8 semitones apart
 * but spell differently relative to the root letter — F# + ♯5 = C##,
 * F# + ♭6 = D). Driving spelling from the display token rather than from
 * semitones alone keeps the note names diatonic.
 */
const DISPLAY_TO_INTERVAL: Record<string, string> = {
  '1': '1P',
  '♭2': '2m',
  '2': '2M',
  '♯2': '2A',
  '♭3': '3m',
  '3': '3M',
  '♭4': '4d',
  '4': '4P',
  '♯4': '4A',
  '♭5': '5d',
  '5': '5P',
  '♯5': '5A',
  '♭6': '6m',
  '6': '6M',
  '♭♭7': '7d',
  '♭7': '7m',
  '7': '7M',
}

export function notesForScale(root: string, scale: ScaleDefinition): string[] {
  return scale.intervalDisplay.map((token) => {
    const interval = DISPLAY_TO_INTERVAL[token]
    if (!interval) {
      throw new Error(`Unsupported interval token "${token}" in scale ${scale.id}`)
    }
    return transpose(root, interval)
  })
}
