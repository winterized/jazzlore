// Image-attribution caption builder (Phase B contract).
//
// Legal requirement, not polish: Wikimedia Commons CC-BY / CC-BY-SA licenses
// require attribution (docs/FRONTEND.md "Image attribution is mandatory").
// Rule: render the caption WHENEVER ANY of `license` / `attribution` is
// non-empty; return null ONLY when ALL are empty (public-domain images carry
// empty fields). A present image `url` alone never forces a caption — the
// legal trigger is the license/attribution text, not the image.

import type { ImageAttribution } from './types'

/**
 * Caption string for a rendered image, or `null` for public-domain (all
 * license/attribution fields empty). `label` defaults to "Photo" (use
 * "Cover art" for album covers).
 */
export function attributionCaption(
  a: ImageAttribution,
  label = 'Photo',
): string | null {
  const attribution = (a.attribution ?? '').trim()
  const license = (a.license ?? '').trim()
  if (attribution === '' && license === '') return null
  const body = [attribution, license].filter((s) => s !== '').join(' · ')
  return `${label}: ${body}`
}
