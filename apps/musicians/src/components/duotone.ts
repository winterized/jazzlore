// Deterministic duotone palette + initials — ported verbatim from the
// Claude Design pass-5 handoff (`docs/source/app/musicians-data.js`
// `DUOTONES` / `duotoneFor` / `initialsOf`). Purely presentational: the same
// musician/record always gets the same tile across every screen so the orbit
// mosaic and the rail share a stable visual identity (design "deterministic
// palette per canonical id").

/** Hard fallback so the modulo index access stays total under
 * `noUncheckedIndexedAccess` (the modulo guarantees a hit, but TS still
 * widens an index access to `T | undefined`). */
const FALLBACK_DUOTONE = ['#1a2436', '#5b7aa0'] as const

/** Restrained duotone [lo, hi] pairs — none competes with the amber accent. */
const DUOTONES: ReadonlyArray<readonly [string, string]> = [
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

/**
 * Deterministic duotone pick by string hash so the same key always yields the
 * same `[lo, hi]` pair. The fallback pair satisfies
 * `noUncheckedIndexedAccess` (the modulo guarantees a hit, but the index
 * access is still `T | undefined` under strict TS).
 */
export function duotoneFor(key: string): readonly [string, string] {
  let h = 0
  const s = String(key ?? '')
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0
  }
  return DUOTONES[Math.abs(h) % DUOTONES.length] ?? FALLBACK_DUOTONE
}

/** First + last word initials, uppercased ("Bobby Timmons" → "BT"). A single
 * word doubles ("Madonna" → "MM"); empty input → "". */
export function initialsOf(name: string): string {
  const parts = String(name ?? '')
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return ''
  const first = parts[0]?.[0] ?? ''
  const last = parts[parts.length - 1]?.[0] ?? ''
  return (first + last).toUpperCase()
}
