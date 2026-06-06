import { describe, expect, it } from 'vitest'
import { MUSICIANS_ORIGIN, canonicalShareUrl } from './shareUrl'

describe('canonicalShareUrl', () => {
  // The native iOS shell serves from `capacitor://localhost`, so
  // `window.location.href` resolves to a local, un-shareable scheme (the
  // share-sheet bug: recipients got `capacitor://localhost/musicians/…`).
  // The canonical share URL must always be the public production origin.

  it('combines the production origin with the path (Miles Davis)', () => {
    expect(canonicalShareUrl('/musicians/wikidata:Q93341', '')).toBe(
      'https://musicians.jazzlore.com/musicians/wikidata:Q93341',
    )
  })

  it('preserves a query string', () => {
    expect(canonicalShareUrl('/musicians/wikidata:Q7346', '?ref=share')).toBe(
      'https://musicians.jazzlore.com/musicians/wikidata:Q7346?ref=share',
    )
  })

  it('handles the bare home path', () => {
    expect(canonicalShareUrl('/musicians', '')).toBe(
      'https://musicians.jazzlore.com/musicians',
    )
  })

  it('exposes the production origin without a trailing slash', () => {
    expect(MUSICIANS_ORIGIN).toBe('https://musicians.jazzlore.com')
  })
})
