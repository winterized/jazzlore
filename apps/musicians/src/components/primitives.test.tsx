import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Collaborator, RecordRef } from '../lib/types'
import { Duo3 } from './Duo3'
import { ConnRow } from './ConnRow'
import { MosaicV4 } from './MosaicV4'
import { EraStrip, type EraItem } from './EraStrip'
import { RecordsStrip } from './RecordsStrip'
import { AttribPhoto, AttribAlbum } from './Attrib'

const collab = (over: Partial<Collaborator> = {}): Collaborator => ({
  id: 'wikidata:Q7346',
  name: 'John Coltrane',
  instrument: 'tenor saxophone',
  relationship: undefined,
  sharedRecordCount: 3,
  topRecord: { title: 'Kind of Blue', year: 1959 },
  photo: true,
  ...over,
})

const record = (over: Partial<RecordRef> = {}): RecordRef => ({
  id: 'musicbrainz:rg-1959-kob',
  title: 'Kind of Blue',
  primaryArtist: 'Miles Davis',
  type: 'album',
  releaseYear: 1959,
  recordingYear: 1959,
  label: 'Columbia',
  catalogNumber: 'CL 1355',
  trackCount: 5,
  cover: { url: 'https://x/kob.jpg', license: 'CC BY-SA 4.0', attribution: 'F. Wolff' },
  links: {},
  ...over,
})

describe('Duo3', () => {
  it('renders deterministic initials by default', () => {
    render(<Duo3 name="Bobby Timmons" />)
    expect(screen.getByText('BT')).toBeInTheDocument()
  })

  it('hides initials when initials={false} (record art tile)', () => {
    render(<Duo3 name="Moanin'" initials={false} />)
    expect(screen.queryByText('MM')).toBeNull()
  })

  it('adds the flat class when photo={false} (centered initials, no gradient)', () => {
    render(<Duo3 name="Antoine Hervé" photo={false} data-testid="duo" />)
    expect(screen.getByTestId('duo')).toHaveClass('duo3', 'flat')
    expect(screen.getByText('AH')).toBeInTheDocument()
  })

  it('sets the deterministic duotone CSS vars', () => {
    render(<Duo3 name="Miles Davis" data-testid="duo" />)
    const el = screen.getByTestId('duo')
    expect(el.style.getPropertyValue('--duo-lo')).toMatch(/^#[0-9a-f]{6}$/i)
    expect(el.style.getPropertyValue('--duo-hi')).toMatch(/^#[0-9a-f]{6}$/i)
  })

  // ── Phase H — hero portrait photo opt-in ──────────────────────────────
  it('renders a real <img> (alt=name, lazy, no-referrer) when a portrait url is supplied', () => {
    render(
      <Duo3
        name="Miles Davis"
        portrait={{ url: 'https://commons.example/miles.jpg' }}
        data-testid="duo"
      />,
    )
    const img = screen.getByRole('img', { name: 'Miles Davis' })
    expect(img).toHaveAttribute('src', 'https://commons.example/miles.jpg')
    expect(img).toHaveAttribute('loading', 'lazy')
    expect(img).toHaveAttribute('decoding', 'async')
    expect(img).toHaveAttribute('referrerpolicy', 'no-referrer')
    // The duotone treatment hook + a stable layout box (CLS = 0).
    expect(screen.getByTestId('duo')).toHaveClass('duo3', 'has-photo')
  })

  it('eager-loads the portrait when eager (first home row / detail hero, LCP)', () => {
    render(
      <Duo3 name="Miles Davis" portrait={{ url: 'https://x/m.jpg' }} eager />,
    )
    expect(screen.getByRole('img', { name: 'Miles Davis' })).toHaveAttribute(
      'loading',
      'eager',
    )
  })

  it('renders the monogram (no <img>) when no portrait url is supplied — non-hero call-sites unchanged', () => {
    render(<Duo3 name="Bobby Timmons" data-testid="duo" />)
    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.getByText('BT')).toBeInTheDocument()
    expect(screen.getByTestId('duo')).not.toHaveClass('has-photo')
  })

  it('an empty / whitespace portrait url is treated as no photo (graceful monogram)', () => {
    render(
      <Duo3 name="Bobby Timmons" portrait={{ url: '   ' }} data-testid="duo" />,
    )
    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.getByText('BT')).toBeInTheDocument()
    expect(screen.getByTestId('duo')).not.toHaveClass('has-photo')
  })

  it('photo={false} (data: no picture_url) never renders an <img>, even with a stray url', () => {
    render(
      <Duo3
        name="Antoine Hervé"
        photo={false}
        portrait={{ url: 'https://x/a.jpg' }}
        data-testid="duo"
      />,
    )
    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.getByTestId('duo')).toHaveClass('duo3', 'flat')
    expect(screen.getByText('AH')).toBeInTheDocument()
  })

  it('falls back to the monogram on a Wikimedia load error (never a broken-image icon)', () => {
    render(
      <Duo3
        name="Miles Davis"
        portrait={{ url: 'https://commons.example/404.jpg' }}
        data-testid="duo"
      />,
    )
    const img = screen.getByRole('img', { name: 'Miles Davis' })
    fireEvent.error(img)
    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.getByText('MD')).toBeInTheDocument()
    expect(screen.getByTestId('duo')).not.toHaveClass('has-photo')
  })
})

describe('ConnRow', () => {
  it('renders name, instrument, top record + count, verbatim aria-label', () => {
    render(<ConnRow c={collab()} />)
    expect(screen.getByText('John Coltrane')).toBeInTheDocument()
    expect(screen.getByText(/tenor saxophone/i)).toBeInTheDocument()
    expect(screen.getByText(/Kind of Blue/)).toBeInTheDocument()
    expect(screen.getByText('+2 more')).toBeInTheDocument()
    // PR4a: the row navigation link is now a real <a href> with the verbatim
    // aria-label. The two Spotify/Apple buttons are ALSO <a> in the same row,
    // so we scope the query to the link bearing the aria-label.
    const row = screen.getByRole('link', {
      name: /John Coltrane tenor saxophone 3 records, most Kind of Blue 1959/i,
    })
    expect(row).toBeInTheDocument()
    expect(row).toHaveAttribute('href', '/musicians/wikidata%3AQ7346')
  })

  it('renders instrument + relationship when relationship is present', () => {
    render(<ConnRow c={collab({ relationship: 'First Great Quintet, 1955–60' })} />)
    expect(
      screen.getByText(/tenor saxophone · First Great Quintet, 1955–60/i),
    ).toBeInTheDocument()
  })

  it('omits the "+N more" chip when only one shared record', () => {
    render(<ConnRow c={collab({ sharedRecordCount: 1 })} />)
    expect(screen.queryByText(/\+\d+ more/)).toBeNull()
  })

  it('falls back to a calm line when there is no top record', () => {
    render(<ConnRow c={collab({ topRecord: undefined, sharedRecordCount: 1 })} />)
    expect(screen.getByText(/no record details on file/i)).toBeInTheDocument()
  })

  it('has two listen buttons that stop propagation (do not trigger the row)', () => {
    let rowClicks = 0
    render(<ConnRow c={collab()} onActivate={() => (rowClicks += 1)} />)
    const spotify = screen.getByRole('link', {
      name: /Listen to John Coltrane on Spotify/i,
    })
    const apple = screen.getByRole('link', {
      name: /Listen to John Coltrane on Apple Music/i,
    })
    expect(spotify).toHaveAttribute('href', expect.stringContaining('open.spotify.com'))
    expect(apple).toHaveAttribute('href', expect.stringContaining('music.apple.com'))
    // Brand compliance (Phase 3): each icon button renders the official mark
    // via a decorative, theme-swapped background-image glyph (no inline SVG).
    expect(spotify.querySelector('.ic-glyph.ic-spotify')).not.toBeNull()
    expect(apple.querySelector('.ic-glyph.ic-apple')).not.toBeNull()
    spotify.click()
    apple.click()
    expect(rowClicks).toBe(0)
  })

  it('prefers a direct artist URL (tier 2) when the collaborator carries one', () => {
    render(
      <ConnRow
        c={collab({
          spotifyArtistUrl: 'https://open.spotify.com/artist/abc',
          appleArtistUrl:
            'https://music.apple.com/us/artist/john-coltrane/123',
        })}
      />,
    )
    expect(
      screen.getByRole('link', { name: /on Spotify/i }),
    ).toHaveAttribute('href', 'https://open.spotify.com/artist/abc')
    expect(
      screen.getByRole('link', { name: /on Apple Music/i }),
    ).toHaveAttribute(
      'href',
      'https://music.apple.com/us/artist/john-coltrane/123',
    )
  })

  it('falls back to the name search URL (tier 3) when no direct URL is present', () => {
    render(<ConnRow c={collab()} />)
    expect(
      screen.getByRole('link', { name: /on Spotify/i }),
    ).toHaveAttribute('href', expect.stringContaining('open.spotify.com/search/John%20Coltrane'))
    expect(
      screen.getByRole('link', { name: /on Apple Music/i }),
    ).toHaveAttribute('href', expect.stringContaining('music.apple.com/search?term=John%20Coltrane'))
  })

  it('renders the Apple Music icon BEFORE Spotify per Identity Guidelines §1.3', () => {
    // .conn-act is flex-column, so DOM order = visual top→bottom. The order
    // swap is the primary purpose of this change — guard it so a future edit
    // can't silently re-swap them (visual check covers it today, this pins it).
    render(<ConnRow c={collab()} />)
    const apple = screen.getByRole('link', { name: /on Apple Music/i })
    const spotify = screen.getByRole('link', { name: /on Spotify/i })
    expect(
      apple.compareDocumentPosition(spotify) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('carries the pulse class only when pulse is set', () => {
    // PR4a: the link is a `display: contents` <a> wrapped inside the .conn
    // div — the pulse animation (background gradient) needs a box, so it
    // stays on the outer .conn div. Walk up from the link to assert.
    const rowName = /John Coltrane tenor saxophone 3 records, most Kind of Blue 1959/i
    const { rerender } = render(<ConnRow c={collab()} />)
    expect(screen.getByRole('link', { name: rowName }).closest('.conn')).not.toHaveClass(
      'pulse',
    )
    rerender(<ConnRow c={collab()} pulse />)
    expect(screen.getByRole('link', { name: rowName }).closest('.conn')).toHaveClass(
      'pulse',
    )
  })

  it('exposes the collaborator id via data-collab-id for mosaic→rail scroll', () => {
    // PR4a: data-collab-id stays on the outer .conn div (the box that
    // scrollIntoView targets). Walk up from the link to assert.
    render(<ConnRow c={collab()} />)
    const row = screen
      .getByRole('link', {
        name: /John Coltrane tenor saxophone 3 records, most Kind of Blue 1959/i,
      })
      .closest('.conn')
    expect(row).toHaveAttribute('data-collab-id', 'wikidata:Q7346')
  })

  // PR4a: modifier-key clicks must NOT call onActivate / preventDefault — the
  // browser's native gesture (open in new tab/window, save link, etc.) wins.
  it.each([
    ['metaKey', { metaKey: true }],
    ['ctrlKey', { ctrlKey: true }],
    ['shiftKey', { shiftKey: true }],
    ['altKey', { altKey: true }],
  ])('does NOT intercept %s+click — native browser gesture wins', (_, init) => {
    let rowClicks = 0
    render(<ConnRow c={collab()} onActivate={() => (rowClicks += 1)} />)
    const link = screen.getByRole('link', {
      name: /John Coltrane tenor saxophone 3 records, most Kind of Blue 1959/i,
    })
    fireEvent.click(link, init)
    expect(rowClicks).toBe(0)
  })

  // +N more affordance — when a handler is supplied, the chip becomes a
  // button that opens the shared-records sheet. When no handler, it stays a
  // plain span (backward-compat for tests/fixtures that don't wire it).
  it('renders +N more as a span (not interactive) when no onShowSharedRecords is supplied', () => {
    render(<ConnRow c={collab({ sharedRecordCount: 38 })} />)
    expect(screen.getByText('+37 more').tagName).toBe('SPAN')
    expect(
      screen.queryByRole('button', { name: /view all 38 records/i }),
    ).not.toBeInTheDocument()
  })

  it('renders +N more as a button with an accessible name when onShowSharedRecords is supplied', () => {
    render(
      <ConnRow
        c={collab({ sharedRecordCount: 38 })}
        onShowSharedRecords={() => undefined}
      />,
    )
    const btn = screen.getByRole('button', {
      name: /view all 38 records with john coltrane/i,
    })
    expect(btn).toBeInTheDocument()
    expect(btn.textContent).toBe('+37 more')
  })

  it('+N more button click invokes onShowSharedRecords and does NOT trigger row navigation', () => {
    let rowClicks = 0
    const sharedClicks: string[] = []
    render(
      <ConnRow
        c={collab({ sharedRecordCount: 38 })}
        onActivate={() => (rowClicks += 1)}
        onShowSharedRecords={(id) => sharedClicks.push(id)}
      />,
    )
    screen
      .getByRole('button', { name: /view all 38 records/i })
      .click()
    expect(sharedClicks).toEqual(['wikidata:Q7346'])
    expect(rowClicks).toBe(0)
  })
})

describe('MosaicV4', () => {
  const many = Array.from({ length: 20 }, (_, i) =>
    collab({ id: `m${i}`, name: `Player ${i}`, sharedRecordCount: 20 - i }),
  )

  it('renders at most 14 tiles (slice)', () => {
    render(<MosaicV4 collabs={many} />)
    expect(screen.getAllByRole('link')).toHaveLength(14)
  })

  it('always renders initials on every tile (color is never the sole signal)', () => {
    render(<MosaicV4 collabs={[collab({ name: 'Ron Carter' })]} />)
    expect(screen.getByText('RC')).toBeInTheDocument()
  })

  it('marks photo:false tiles with the no-photo class', () => {
    render(<MosaicV4 collabs={[collab({ name: 'Antoine Hervé', photo: false })]} />)
    expect(screen.getByRole('link')).toHaveClass('no-photo')
  })

  it('each tile has an accessible name with name + instrument + count', () => {
    render(<MosaicV4 collabs={[collab()]} />)
    expect(
      screen.getByRole('link', { name: /John Coltrane.*tenor saxophone.*3 records/i }),
    ).toBeInTheDocument()
  })

  it('uses the sparse grid class when sparse', () => {
    render(<MosaicV4 collabs={[collab()]} sparse />)
    expect(
      screen.getByRole('group', { name: /orbit/i }),
    ).toHaveClass('mosaic-sparse')
  })

  it('tiles are real anchors with /musicians/<encoded-id> href', () => {
    render(<MosaicV4 collabs={[collab()]} />)
    const tile = screen.getByRole('link', { name: /John Coltrane/i })
    expect(tile).toHaveAttribute('href', '/musicians/wikidata%3AQ7346')
  })

  // PR4a: modifier-click bypass test — same shape as ConnRow.
  it.each([
    ['metaKey', { metaKey: true }],
    ['ctrlKey', { ctrlKey: true }],
    ['shiftKey', { shiftKey: true }],
    ['altKey', { altKey: true }],
  ])('does NOT intercept %s+click on tiles', (_, init) => {
    let taps = 0
    render(<MosaicV4 collabs={[collab()]} onTap={() => (taps += 1)} />)
    const tile = screen.getByRole('link', { name: /John Coltrane/i })
    fireEvent.click(tile, init)
    expect(taps).toBe(0)
  })
})

describe('EraStrip', () => {
  const items: EraItem[] = [
    { id: 'a', name: 'Bill Evans', instrument: 'piano', hint: 'modal pioneer', photo: true },
  ]
  it('renders nothing when empty', () => {
    render(<EraStrip items={[]} />)
    expect(screen.queryByRole('region', { name: /from the same era/i })).toBeNull()
  })
  it('renders contemporaries with name + instrument hint', () => {
    render(<EraStrip items={items} />)
    expect(screen.getByText('Bill Evans')).toBeInTheDocument()
    expect(screen.getByText(/piano · modal pioneer/i)).toBeInTheDocument()
    expect(screen.getByText(/from the same era/i)).toBeInTheDocument()
  })
  // Wave 1 / PR4a — tiles are real anchors so cmd-click etc. work.
  it('renders each tile as a real anchor with /musicians/<id> href', () => {
    render(<EraStrip items={items} />)
    const tile = screen.getByRole('link', { name: /Bill Evans, piano/i })
    expect(tile).toHaveAttribute('href', '/musicians/a')
  })
  // Wave 1 / PR4c (audit HIGH-5) — the portrait sibling on an EraItem renders
  // the real <img> via Duo3 instead of the monogram-only fallback.
  it('renders a duotone photo when the peer carries a portrait', () => {
    const withPortrait: EraItem[] = [
      {
        id: 'b',
        name: 'Sonny Rollins',
        instrument: 'tenor saxophone',
        photo: true,
        portrait: {
          url: 'https://commons.example/sonny.jpg',
          license: 'CC-BY-SA-4.0',
          attribution: 'F. Wolff',
        },
      },
    ]
    render(<EraStrip items={withPortrait} />)
    const img = screen.getByAltText('Sonny Rollins') as HTMLImageElement
    expect(img.tagName).toBe('IMG')
    expect(img).toHaveAttribute('src', 'https://commons.example/sonny.jpg')
  })

  // PR4a: modifier-click bypass test — same shape as ConnRow / MosaicV4.
  it.each([
    ['metaKey', { metaKey: true }],
    ['ctrlKey', { ctrlKey: true }],
    ['shiftKey', { shiftKey: true }],
    ['altKey', { altKey: true }],
  ])('does NOT intercept %s+click on era tiles', (_, init) => {
    let activations = 0
    render(<EraStrip items={items} onActivate={() => (activations += 1)} />)
    const tile = screen.getByRole('link', { name: /Bill Evans, piano/i })
    fireEvent.click(tile, init)
    expect(activations).toBe(0)
  })
})

describe('RecordsStrip', () => {
  it('renders nothing when empty', () => {
    render(<RecordsStrip records={[]} />)
    expect(screen.queryByText(/records they shaped/i)).toBeNull()
  })
  it('renders each record title + label + short year and a deep-link', () => {
    render(<RecordsStrip records={[record()]} />)
    expect(screen.getByText('Kind of Blue')).toBeInTheDocument()
    expect(screen.getByText(/Columbia/)).toBeInTheDocument()
    expect(screen.getByText("'59")).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /Kind of Blue/i })
    expect(link).toHaveAttribute('href', expect.stringContaining('open.spotify.com'))
  })
  it('renders an album attribution caption when license/attribution present', () => {
    render(<RecordsStrip records={[record()]} />)
    expect(screen.getByText(/F\. Wolff/)).toBeInTheDocument()
  })
  it('renders no caption for public-domain covers (all attribution empty)', () => {
    render(
      <RecordsStrip
        records={[record({ cover: { url: 'x', license: '', attribution: '' } })]}
      />,
    )
    expect(screen.queryByText(/Cover art:/)).toBeNull()
  })
})

describe('AttribPhoto / AttribAlbum', () => {
  it('renders the caption when any license/attribution is non-empty', () => {
    render(
      <AttribPhoto
        name="Miles Davis"
        attribution={{ url: 'x', license: 'CC BY-SA 3.0', attribution: 'Tom Palumbo' }}
      />,
    )
    expect(screen.getByText(/Tom Palumbo/)).toBeInTheDocument()
    expect(screen.getByText(/CC BY-SA 3\.0/)).toBeInTheDocument()
  })

  it('renders the real duotone portrait (eager — detail-hero LCP) when a url is present', () => {
    render(
      <AttribPhoto
        name="Miles Davis"
        attribution={{
          url: 'https://commons.example/miles.jpg',
          license: 'CC BY-SA 3.0',
          attribution: 'Tom Palumbo',
        }}
      />,
    )
    const img = screen.getByRole('img', { name: 'Miles Davis' })
    expect(img).toHaveAttribute('src', 'https://commons.example/miles.jpg')
    expect(img).toHaveAttribute('loading', 'eager')
  })

  it('renders the portrait inside a semantic figure/figcaption (credit programmatically associated)', () => {
    render(
      <AttribPhoto
        name="Miles Davis"
        attribution={{
          url: 'https://x/m.jpg',
          license: 'CC BY-SA 3.0',
          attribution: 'Tom Palumbo',
        }}
      />,
    )
    const fig = screen.getByRole('figure')
    expect(within(fig).getByRole('img', { name: 'Miles Davis' })).toBeInTheDocument()
    expect(within(fig).getByText(/^Photo:.*Tom Palumbo/)).toBeInTheDocument()
  })

  it('renders an explicit italic placeholder + NO <img> when the portrait is missing', () => {
    render(<AttribPhoto name="Antoine Hervé" attribution={{}} missing />)
    expect(screen.getByText(/no portrait on file/i)).toBeInTheDocument()
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('renders no caption for a public-domain photo (all fields empty) but still paints the image', () => {
    render(<AttribPhoto name="John Coltrane" attribution={{ url: 'x' }} />)
    expect(screen.queryByText(/Photo:/)).toBeNull()
    expect(screen.getByRole('img', { name: 'John Coltrane' })).toBeInTheDocument()
  })

  it('AttribAlbum renders cover-art caption + record meta', () => {
    render(<AttribAlbum rec={record()} />)
    expect(screen.getByText('Kind of Blue')).toBeInTheDocument()
    expect(screen.getByText(/F\. Wolff/)).toBeInTheDocument()
  })
})

// ── Wave 2a — no-photo editorial figure (NoPhotoMark inside Duo3) ─────
// The fallback for photoless musicians changes from "corner initials" to
// "instrument figure + corner monogram" when an `inst` string is supplied.
// Record covers (initials={false}, no inst) stay untouched; portrait
// callers (photo present) stay untouched.
describe('Wave 2a · no-photo figure rendering', () => {
  it('Duo3: inst + no photo → figure renders with the resolved figure key', () => {
    const { container } = render(
      <Duo3
        name="Bobby Timmons"
        photo={false}
        inst="piano"
        data-testid="duo"
      />,
    )
    const mark = container.querySelector('.duo3-mark')
    expect(mark).not.toBeNull()
    expect(mark?.getAttribute('data-no-photo-key')).toBe('piano')
    // Corner-initials fallback is suppressed when the figure takes over.
    expect(screen.queryByText('BT', { selector: '.duo3-initials' })).toBeNull()
    // The figure's own monogram still renders (different DOM node).
    expect(
      container.querySelector('.duo3-mark-ini')?.textContent,
    ).toBe('BT')
  })

  it('Duo3: unknown instrument → "rest" figure (discreet question-mark)', () => {
    const { container } = render(
      <Duo3 name="Sideman X" photo={false} inst="washboard" />,
    )
    expect(
      container
        .querySelector('.duo3-mark')
        ?.getAttribute('data-no-photo-key'),
    ).toBe('rest')
  })

  it('Duo3: portrait present overrides inst — figure does NOT render', () => {
    const { container } = render(
      <Duo3
        name="Miles Davis"
        portrait={{ url: 'https://commons.example/miles.jpg' }}
        inst="trumpet"
      />,
    )
    expect(container.querySelector('.duo3-mark')).toBeNull()
    expect(
      screen.getByRole('img', { name: 'Miles Davis' }),
    ).toBeInTheDocument()
  })

  it('Duo3: no inst → existing initials fallback unchanged (record covers, etc.)', () => {
    const { container } = render(
      <Duo3 name="Antoine Hervé" photo={false} />,
    )
    expect(container.querySelector('.duo3-mark')).toBeNull()
    // Existing initials span continues to render.
    expect(screen.getByText('AH')).toBeInTheDocument()
  })

  it('MosaicV4: photoless tile with instrument renders figure AND drops the duplicate external mtile-init', () => {
    const { container } = render(
      <MosaicV4
        collabs={[
          collab({
            id: 'sideman-1',
            name: 'Photoless Pianist',
            instrument: 'piano',
            photo: false,
          }),
        ]}
      />,
    )
    const tile = container.querySelector('a.mtile.no-photo')
    expect(tile).not.toBeNull()
    expect(tile?.querySelector('.duo3-mark')).not.toBeNull()
    // The external .mtile-init span is suppressed when the figure shows
    // (it would otherwise duplicate the figure's own corner monogram).
    expect(tile?.querySelector('.mtile-init')).toBeNull()
  })

  it('MosaicV4: photoless tile WITHOUT instrument renders the rest figure (no bare monogram)', () => {
    // Wave 2a follow-up (2026-05-27 fix): when a no-photo musician has
    // no instrument (the residual ~7% the populator derivation can't
    // recover), the tile must NOT fall through to the bare external
    // monogram (`UP` boxes seen on the Natalie Cole rail). The dignified
    // `rest` figure is the Wave 2a intent for unknown-instrument
    // musicians ("no shrug"). `Duo3` resolves `inst={null}` via
    // `figKey()` → `'rest'`.
    const { container } = render(
      <MosaicV4
        collabs={[
          collab({
            id: 'sideman-2',
            name: 'Unknown Player',
            instrument: undefined,
            photo: false,
          }),
        ]}
      />,
    )
    const mark = container.querySelector('.duo3-mark')
    expect(mark).not.toBeNull()
    expect(mark?.getAttribute('data-no-photo-key')).toBe('rest')
    // External mtile-init monogram is suppressed (the figure carries its
    // own corner monogram — a second one would duplicate).
    expect(container.querySelector('.mtile-init')).toBeNull()
  })

  it('ConnRow: photoless collaborator WITHOUT instrument renders the rest figure', () => {
    // Regression for the Natalie Cole rail (2026-05-27): a no-photo
    // collaborator with no instrument was rendering a bare monogram
    // (`AV`, `AE`, `AM` boxes). Must render the dignified rest figure.
    const { container } = render(
      <ConnRow c={collab({ instrument: undefined, photo: false })} />,
    )
    const mark = container.querySelector('.duo3-mark')
    expect(mark).not.toBeNull()
    expect(mark?.getAttribute('data-no-photo-key')).toBe('rest')
  })

  it('EraStrip: photoless peer WITHOUT instrument renders the rest figure', () => {
    const items: EraItem[] = [
      {
        id: 'p1',
        name: 'Unknown Peer',
        // instrument intentionally omitted (the residual unrecovered case)
        photo: false,
      },
    ]
    const { container } = render(<EraStrip items={items} />)
    const mark = container.querySelector('.duo3-mark')
    expect(mark).not.toBeNull()
    expect(mark?.getAttribute('data-no-photo-key')).toBe('rest')
  })

  it('Duo3: explicit inst={null} on a musician caller → rest figure (the no-instrument signal)', () => {
    const { container } = render(
      <Duo3 name="Unknown Sideman" photo={false} inst={null} />,
    )
    const mark = container.querySelector('.duo3-mark')
    expect(mark).not.toBeNull()
    expect(mark?.getAttribute('data-no-photo-key')).toBe('rest')
    // Plain initials are NOT also rendered (the figure carries its own
    // corner monogram — the external `.duo3-initials` would duplicate).
    expect(container.querySelector('.duo3-initials')).toBeNull()
  })

  it('Duo3: omitted inst (record-cover semantics) → NO figure (byte-identical)', () => {
    // Sentinel preserved: when `inst` is undefined (record-cover callers
    // never pass it), the figure path stays OFF — the bare initials
    // fallback renders. This guards against semantic regression on
    // album-cover tiles.
    const { container } = render(<Duo3 name="Some Record" photo={false} />)
    expect(container.querySelector('.duo3-mark')).toBeNull()
    expect(container.querySelector('.duo3-initials')?.textContent).toBe('SR')
  })

  it('MosaicV4: photoed tile is unaffected (real <img>, no figure)', () => {
    const { container } = render(
      <MosaicV4
        collabs={[
          collab({ id: 'top', name: 'John Coltrane', photo: true }),
        ]}
        portraits={{
          top: {
            id: 'top',
            name: 'John Coltrane',
            photo: true,
            portrait: { url: 'https://x/coltrane.jpg' },
          },
        }}
      />,
    )
    expect(container.querySelector('.duo3-mark')).toBeNull()
    expect(
      screen.getByRole('img', { name: 'John Coltrane' }),
    ).toBeInTheDocument()
  })

  it('ConnRow: photoless collaborator with instrument renders figure', () => {
    const { container } = render(
      <ConnRow
        c={collab({ instrument: 'tenor saxophone', photo: false })}
      />,
    )
    const mark = container.querySelector('.duo3-mark')
    expect(mark).not.toBeNull()
    expect(mark?.getAttribute('data-no-photo-key')).toBe('sax')
  })

  it('EraStrip: photoless peer with instrument renders the figure for that instrument', () => {
    const items: EraItem[] = [
      {
        id: 'p1',
        name: 'Unknown Bassist',
        instrument: 'double bass',
        photo: false,
      },
    ]
    const { container } = render(<EraStrip items={items} />)
    const mark = container.querySelector('.duo3-mark')
    expect(mark).not.toBeNull()
    expect(mark?.getAttribute('data-no-photo-key')).toBe('bass')
  })

  it('AttribAlbum: record covers stay clean (no inst flows in, no figure renders)', () => {
    const { container } = render(
      <AttribAlbum
        rec={record({ cover: { url: '', license: '', attribution: '' } })}
      />,
    )
    expect(container.querySelector('.duo3-mark')).toBeNull()
  })
})
