import { describe, expect, it } from 'vitest'
import { widgetDeepLinkPath } from './deepLink'

describe('widgetDeepLinkPath', () => {
  it('maps a raw widget URL (id with ":") to the encoded route', () => {
    expect(widgetDeepLinkPath('jazzlore-musicians://musician/wikidata:Q93341')).toBe(
      '/musicians/wikidata%3AQ93341',
    )
  })

  it('accepts an already percent-encoded id and normalizes to the same route', () => {
    expect(widgetDeepLinkPath('jazzlore-musicians://musician/wikidata%3AQ93341')).toBe(
      '/musicians/wikidata%3AQ93341',
    )
  })

  it('handles a musicbrainz-style id', () => {
    expect(widgetDeepLinkPath('jazzlore-musicians://musician/musicbrainz:abc-123')).toBe(
      '/musicians/musicbrainz%3Aabc-123',
    )
  })

  it('returns null for a different scheme', () => {
    expect(widgetDeepLinkPath('https://musicians.jazzlore.com/musicians/x')).toBeNull()
  })

  it('returns null for the right scheme but wrong host/path', () => {
    expect(widgetDeepLinkPath('jazzlore-musicians://settings/x')).toBeNull()
    expect(widgetDeepLinkPath('jazzlore-musicians://record/abc')).toBeNull()
  })

  it('returns null for an empty id', () => {
    expect(widgetDeepLinkPath('jazzlore-musicians://musician/')).toBeNull()
    expect(widgetDeepLinkPath('jazzlore-musicians://musician/%20')).toBeNull()
  })

  it('returns null for non-string input', () => {
    // @ts-expect-error — defensive against a non-string event.url at runtime
    expect(widgetDeepLinkPath(undefined)).toBeNull()
  })
})
