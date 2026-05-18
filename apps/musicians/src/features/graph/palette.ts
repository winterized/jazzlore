// Deterministic duotone palette per canonical id — verbatim values + hash
// from the design's `duotoneFor` (musicians-data.js). The graph keys the pick
// on the node id (canonical, stable across screens), so a musician's node
// reads the same hue here and in the mosaic/connection cards. Pure, no deps.

/** Restrained duotone pairs `[low, high]`; none competes with the amber
 * accent. Verbatim from the pass-5 design handoff. */
export const DUOTONES: ReadonlyArray<readonly [string, string]> = [
  ['#1a2436', '#5b7aa0'], // dusk blue
  ['#2a1f1a', '#a07a5b'], // sepia
  ['#1f2a23', '#6b9075'], // forest
  ['#2a1d24', '#a06b7e'], // mauve
  ['#251f1a', '#b08755'], // amber-warm
  ['#1a242a', '#5b8aa0'], // steel
  ['#2a261a', '#9a8a4f'], // ochre
  ['#241a2a', '#7a5b9a'], // violet
  ['#1f2421', '#75906b'], // olive
  ['#2a1a1f', '#a05b6b'], // wine
  ['#1a1f2a', '#5b6ba0'], // indigo
  ['#26241f', '#8a805b'], // taupe
]

/** Deterministic duotone pick by string hash (same hash as the design's
 * `duotoneFor`), so the same id always maps to the same pair everywhere. */
export function duotoneFor(key: string): readonly [string, string] {
  let h = 0
  const s = String(key)
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0
  }
  const idx = Math.abs(h) % DUOTONES.length
  // noUncheckedIndexedAccess: idx is always in range, but narrow defensively.
  return DUOTONES[idx] ?? DUOTONES[0]!
}

/** "Bobby Timmons" → "BT". Color is never the sole signal: every node also
 * carries initials (a11y) in addition to its text label. */
export function initialsOf(name: string): string {
  const parts = String(name).split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts[parts.length - 1]?.[0] ?? ''
  return (first + last).toUpperCase()
}
