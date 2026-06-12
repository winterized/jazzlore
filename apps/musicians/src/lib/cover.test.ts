import { describe, expect, it } from 'vitest'
import { coverArtSources } from './cover'

describe('coverArtSources', () => {
  it('derives a 250px variant + dual srcset from a CAA /front-500 URL', () => {
    const url =
      'https://coverartarchive.org/release-group/8e8a594f-2175-38c7-a871-abb68ec363e7/front-500'
    const { src, srcSet } = coverArtSources(url)
    expect(src).toBe(
      'https://coverartarchive.org/release-group/8e8a594f-2175-38c7-a871-abb68ec363e7/front-250',
    )
    expect(srcSet).toBe(
      'https://coverartarchive.org/release-group/8e8a594f-2175-38c7-a871-abb68ec363e7/front-250 250w, ' +
        'https://coverartarchive.org/release-group/8e8a594f-2175-38c7-a871-abb68ec363e7/front-500 500w',
    )
  })

  it('passes through an unexpected (non /front-500) URL unchanged, no srcset', () => {
    const url = 'https://example.com/cover.jpg'
    expect(coverArtSources(url)).toEqual({ src: url })
  })

  it('does not rewrite a /front-250 URL (already smallest)', () => {
    const url = 'https://coverartarchive.org/release-group/abc/front-250'
    expect(coverArtSources(url)).toEqual({ src: url })
  })
})
