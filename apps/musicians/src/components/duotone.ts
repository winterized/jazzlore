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

/** Lowercased common particles skipped during initial extraction so
 * "Ludwig Mies van der Rohe" → "MR" not "Mv", "Carmen de la Cruz" → "CC"
 * etc. Merged in from the 2026-05-23 no-photo handoff (Wave 2a) — additive
 * over the Wave 1 non-letter-token filter, so all earlier assertions
 * remain green. Lowercase membership; tokens are matched after the
 * letter-first filter. */
const PARTICLES = new Set([
  'van',
  'von',
  'de',
  'del',
  'della',
  'di',
  'da',
  'du',
  'la',
  'le',
  'of',
  'the',
  'and',
  'y',
  'el',
])

/** First + last word initials, uppercased ("Bobby Timmons" → "BT"). A single
 * word doubles ("Madonna" → "MM"); empty input → "". Tokens whose first code
 * point is not a Unicode letter are skipped — without that filter, raw upstream
 * names like "Miles Davis + 19" produce "M1" and "Bobby Thompson (19" produces
 * "B(" (audit HIGH-2). The Unicode-letter class keeps "Nguyên Lê" → "NL" and
 * other non-ASCII names working. The first-character extraction uses
 * code-point iteration (`[...token][0]`) so astral-plane letters (e.g. a
 * stylized stage name with mathematical alphanumerics) yield a single
 * scalar, not a lone UTF-16 surrogate. Common particles (van / de / la /
 * the / …) are skipped (Wave 2a) so "Ludwig van Beethoven" → "LB" rather
 * than absorbing "van" as an initial. Punctuation is NOT stripped from
 * tokens — "'Round About Midnight" continues to filter the apostrophe-led
 * token and yield "AM" (Wave 1 regression-guarded). */
export function initialsOf(name: string): string {
  const parts = String(name ?? '')
    .split(/\s+/)
    .filter((p) => /^\p{L}/u.test(p) && !PARTICLES.has(p.toLowerCase()))
  if (parts.length === 0) return ''
  const firstCp = (s: string | undefined): string => [...(s ?? '')][0] ?? ''
  const first = firstCp(parts[0])
  const last = firstCp(parts[parts.length - 1])
  return (first + last).toUpperCase()
}
