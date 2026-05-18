import { describe, expect, it } from 'vitest'
import { attributionCaption } from './attribution'

describe('attributionCaption', () => {
  it('renders "Photo: {attribution} · {license}" when both present', () => {
    expect(
      attributionCaption({
        attribution: 'William P. Gottlieb',
        license: 'CC BY-SA 4.0',
      }),
    ).toBe('Photo: William P. Gottlieb · CC BY-SA 4.0')
  })

  it('renders whenever ANY field is non-empty (attribution only)', () => {
    expect(attributionCaption({ attribution: 'Francis Wolff' })).toBe(
      'Photo: Francis Wolff',
    )
  })

  it('renders whenever ANY field is non-empty (license only)', () => {
    expect(attributionCaption({ license: 'CC BY 3.0' })).toBe(
      'Photo: CC BY 3.0',
    )
  })

  it('returns null ONLY when all fields are empty/absent (public domain)', () => {
    expect(attributionCaption({})).toBeNull()
    expect(attributionCaption({ attribution: '', license: '' })).toBeNull()
    expect(
      attributionCaption({ attribution: '   ', license: '\t' }),
    ).toBeNull()
    expect(
      attributionCaption({ url: 'https://x/p.jpg', license: '' }),
    ).toBeNull()
  })

  it('a present url alone does NOT force a caption (only license/attribution)', () => {
    expect(attributionCaption({ url: 'https://commons/p.jpg' })).toBeNull()
  })

  it('trims surrounding whitespace in the rendered fields', () => {
    expect(
      attributionCaption({ attribution: '  Reid Miles  ', license: ' CC0 ' }),
    ).toBe('Photo: Reid Miles · CC0')
  })

  it('supports a custom label (e.g. "Cover art" for album covers)', () => {
    expect(
      attributionCaption(
        { attribution: 'Reid Miles', license: 'CC BY-SA 4.0' },
        'Cover art',
      ),
    ).toBe('Cover art: Reid Miles · CC BY-SA 4.0')
  })
})
