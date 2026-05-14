/**
 * URL slug encoding/decoding for the /chords/:root route.
 *
 * Delegates to music-core/url.ts — the slug format is intentionally identical
 * to apps/scales so both sub-sites share the same URL convention.
 *
 * Examples:
 *   'C'  ↔  'C'
 *   'Db' ↔  'D-flat'
 *   'F#' ↔  'F-sharp'
 */
export { slugFromRoot as encodeSlug, rootFromSlug as decodeSlug } from '@jazzlore/music-core'
