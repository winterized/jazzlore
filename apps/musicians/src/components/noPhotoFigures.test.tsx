import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FIG_LIB, figKey, NoPhotoMark } from './noPhotoFigures'

describe('figKey', () => {
  it('maps the canonical instrument strings to their figure key', () => {
    expect(figKey('piano')).toBe('piano')
    expect(figKey('trumpet')).toBe('trumpet')
    expect(figKey('trombone')).toBe('trombone')
    expect(figKey('saxophone')).toBe('sax')
    expect(figKey('clarinet')).toBe('clarinet')
    expect(figKey('flute')).toBe('flute')
    expect(figKey('bass')).toBe('bass')
    expect(figKey('violin')).toBe('violin')
    expect(figKey('guitar')).toBe('guitar')
    expect(figKey('drums')).toBe('drums')
    expect(figKey('vibraphone')).toBe('vibes')
    expect(figKey('organ')).toBe('organ')
    expect(figKey('vocals')).toBe('voice')
  })

  it('honours the README forgiving mapping table', () => {
    // Each row in the README mapping table maps a free-form upstream string
    // to the visually-closest figure. These are the cases I deliberately
    // want to keep working even if upstream changes its wording.
    expect(figKey('cornet')).toBe('trumpet')
    expect(figKey('flugelhorn')).toBe('trumpet')
    expect(figKey('french horn')).toBe('trumpet')
    expect(figKey('tuba')).toBe('trumpet')
    expect(figKey('hammond')).toBe('organ')
    expect(figKey('hammond b3')).toBe('organ')
    expect(figKey('electric piano')).toBe('piano')
    expect(figKey('rhodes')).toBe('piano')
    expect(figKey('wurlitzer')).toBe('piano')
    expect(figKey('keyboards')).toBe('piano')
    expect(figKey('keys')).toBe('piano')
    expect(figKey('tenor sax')).toBe('sax')
    expect(figKey('alto saxophone')).toBe('sax')
    expect(figKey('oboe')).toBe('clarinet')
    expect(figKey('bassoon')).toBe('clarinet')
    expect(figKey('piccolo')).toBe('flute')
    expect(figKey('cello')).toBe('bass')
    expect(figKey('contrabass')).toBe('bass')
    expect(figKey('upright bass')).toBe('bass')
    expect(figKey('fiddle')).toBe('violin')
    expect(figKey('viola')).toBe('violin')
    expect(figKey('harp')).toBe('violin')
    expect(figKey('banjo')).toBe('guitar')
    expect(figKey('mandolin')).toBe('guitar')
    expect(figKey('ukulele')).toBe('guitar')
    expect(figKey('percussion')).toBe('drums')
    expect(figKey('cymbals')).toBe('drums')
    expect(figKey('marimba')).toBe('vibes')
    expect(figKey('xylophone')).toBe('vibes')
    expect(figKey('singer')).toBe('voice')
    expect(figKey('scat')).toBe('voice')
  })

  it('checks specific keys before catch-all bass / piano (order matters)', () => {
    // "bass clarinet" must hit clarinet, not bass.
    expect(figKey('bass clarinet')).toBe('clarinet')
    // "bass trombone" must hit trombone, not bass.
    expect(figKey('bass trombone')).toBe('trombone')
    // Organ specifically before piano (Hammond is a keyboard but the visual
    // is a two-manual console, not a piano).
    expect(figKey('hammond organ')).toBe('organ')
  })

  it('returns "rest" for empty / null / undefined / em-dash / unknown', () => {
    expect(figKey('')).toBe('rest')
    expect(figKey('   ')).toBe('rest')
    expect(figKey(null)).toBe('rest')
    expect(figKey(undefined)).toBe('rest')
    expect(figKey('—')).toBe('rest')
    expect(figKey('washboard')).toBe('rest')
    expect(figKey('theremin')).toBe('rest')
  })

  it('is case-insensitive', () => {
    expect(figKey('PIANO')).toBe('piano')
    expect(figKey('Trumpet')).toBe('trumpet')
    expect(figKey('Bass Clarinet')).toBe('clarinet')
  })

  it('covers every key in FIG_LIB', () => {
    // Sanity: each known key must have a non-empty figure markup string.
    const keys: ReadonlyArray<keyof typeof FIG_LIB> = [
      'piano',
      'organ',
      'trumpet',
      'trombone',
      'sax',
      'clarinet',
      'flute',
      'bass',
      'violin',
      'guitar',
      'drums',
      'vibes',
      'voice',
      'rest',
    ]
    for (const k of keys) {
      expect(FIG_LIB[k].trim().length).toBeGreaterThan(0)
    }
  })
})

describe('NoPhotoMark', () => {
  it('renders an SVG figure and the data-key for the resolved instrument', () => {
    const { container } = render(
      <NoPhotoMark inst="piano" name="Bobby Timmons" />,
    )
    const mark = container.querySelector('.duo3-mark')
    expect(mark).not.toBeNull()
    expect(mark?.getAttribute('data-no-photo-key')).toBe('piano')
    expect(mark?.getAttribute('aria-hidden')).toBe('true')
    const svg = mark?.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg?.getAttribute('viewBox')).toBe('0 0 100 140')
  })

  it('renders the corner monogram when a name is provided', () => {
    render(<NoPhotoMark inst="piano" name="Bobby Timmons" />)
    expect(screen.getByText('BT')).toBeInTheDocument()
  })

  it('omits the monogram when no name is provided', () => {
    const { container } = render(<NoPhotoMark inst="trumpet" />)
    expect(container.querySelector('.duo3-mark-ini')).toBeNull()
  })

  it('renders the rest figure for unknown / missing instrument', () => {
    const { container } = render(<NoPhotoMark name="Sideman X" />)
    expect(
      container
        .querySelector('.duo3-mark')
        ?.getAttribute('data-no-photo-key'),
    ).toBe('rest')
  })

  it('forwards an extra className to the wrapper', () => {
    const { container } = render(
      <NoPhotoMark inst="sax" name="John Doe" className="extra" />,
    )
    const cls = container.querySelector('.duo3-mark')?.className
    expect(cls).toContain('duo3-mark')
    expect(cls).toContain('extra')
  })
})
