// Cover-art source sizing (Records project, P5).
//
// The populator stores the Cover Art Archive release-group front cover at the
// `/front-500` size (D3: hotlink CAA directly, no R2 mirror). The record-strip
// tile is 124 CSS px, so 250 px is the natural 2× size and 500 px only helps
// 3× phones — shipping 500 into a 124 px box is a 4× area oversample that the
// Lighthouse "properly size images" audit penalises (perf-gate risk, D8/P8).
//
// `coverArtSources` derives a 250 px variant from the stored URL and offers
// both via `srcset` so the browser picks the smallest sufficient image. Any
// URL that is NOT the expected CAA `/front-500` shape passes through unchanged
// with no `srcSet` — defensive: we never assume more about the URL than the
// D3 hotlink-CAA decision guarantees, and a future hosting change degrades to
// "use whatever URL we were given" rather than a broken `/front-250` guess.

const FRONT_500 = '/front-500'
const FRONT_250 = '/front-250'

export interface CoverArtSources {
  src: string
  /** Present only for recognised CAA `/front-500` URLs. */
  srcSet?: string
}

export function coverArtSources(url: string): CoverArtSources {
  if (!url.endsWith(FRONT_500)) return { src: url }
  const url250 = url.slice(0, -FRONT_500.length) + FRONT_250
  return { src: url250, srcSet: `${url250} 250w, ${url} 500w` }
}
