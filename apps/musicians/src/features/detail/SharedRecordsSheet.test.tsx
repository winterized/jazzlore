// SharedRecordsSheet — async states (loading / waking / error / ready),
// truncation indicator (R1), and dismiss paths (ESC / backdrop / close).

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { RecordRef } from '../../lib/types'
import type {
  DataSource,
  SharedRecordsResponse,
} from '../../hooks/useMusicianData'
import { SharedRecordsSheet } from './SharedRecordsSheet'

function makeRecord(
  id: string,
  title: string,
  year: number,
  primaryArtist: string,
): RecordRef {
  return {
    id,
    title,
    primaryArtist,
    releaseYear: year,
    recordingYear: undefined,
    type: undefined,
    label: undefined,
    catalogNumber: undefined,
    trackCount: undefined,
    cover: { url: undefined, license: undefined, attribution: undefined },
    links: {
      wikipediaUrl: undefined,
      wikidataId: undefined,
      musicbrainzId: undefined,
      discogsId: undefined,
    },
  }
}

function makeSource(
  result:
    | SharedRecordsResponse
    | { status: 'waking'; retryAfter: number }
    | Error,
): DataSource {
  return {
    curated: vi.fn(),
    detail: vi.fn(),
    searchIndex: vi.fn(),
    graph: vi.fn(),
    byIds: vi.fn(),
    polishedIds: vi.fn(),
    sharedRecords: vi.fn(async () => {
      if (result instanceof Error) throw result
      return result
    }),
  }
}

beforeEach(() => {
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: false,
    media: q,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    onchange: null,
    dispatchEvent: vi.fn(),
  }))
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

const PROPS_BASE = {
  focusId: 'wikidata:Q93341',
  collabId: 'wikidata:Q7346',
  collabName: 'John Coltrane',
  onClose: vi.fn(),
}

describe('SharedRecordsSheet — async states', () => {
  it('renders the loading state on first paint', () => {
    const source = makeSource({ records: [], totalCount: 0 })
    render(<SharedRecordsSheet {...PROPS_BASE} source={source} />)
    expect(screen.getByRole('status').textContent).toMatch(/loading/i)
  })

  it('renders the records once the fetch resolves', async () => {
    const source = makeSource({
      records: [
        makeRecord('rec:kob', 'Kind of Blue', 1959, 'Miles Davis'),
        makeRecord('rec:milestones', 'Milestones', 1958, 'Miles Davis'),
      ],
      totalCount: 2,
    })
    render(<SharedRecordsSheet {...PROPS_BASE} source={source} />)
    expect(await screen.findByText('Kind of Blue')).toBeInTheDocument()
    expect(screen.getByText('Milestones')).toBeInTheDocument()
    // Each row carries year + primary artist. Year and primaryArtist are
    // rendered as separate spans split by " · " so we match the artist text.
    const rows = screen.getAllByText('Miles Davis')
    expect(rows.length).toBe(2)
    // Non-truncated header
    expect(screen.getByText(/^2 records$/i)).toBeInTheDocument()
  })

  it('shows the truncation indicator when totalCount > records.length (R1)', async () => {
    const records = Array.from({ length: 100 }, (_, i) =>
      makeRecord(`rec:${i}`, `Record ${i}`, 2020 - i, 'Paul Chambers'),
    )
    const source = makeSource({ records, totalCount: 147 })
    render(<SharedRecordsSheet {...PROPS_BASE} source={source} />)
    expect(
      await screen.findByText(/100 of 147 records · most recent first/i),
    ).toBeInTheDocument()
  })

  it('renders the waking state when the BFF surfaces 503-waking', async () => {
    const source = makeSource({ status: 'waking', retryAfter: 8 })
    render(<SharedRecordsSheet {...PROPS_BASE} source={source} />)
    expect(
      await screen.findByText(/waking up · retry in 8s/i),
    ).toBeInTheDocument()
  })

  it('renders the error state on a rejection', async () => {
    const source = makeSource(new Error('bff 500'))
    render(<SharedRecordsSheet {...PROPS_BASE} source={source} />)
    expect(
      await screen.findByText(/couldn['’]t load the records/i),
    ).toBeInTheDocument()
  })

  it('renders the empty state when the pair has no shared records', async () => {
    const source = makeSource({ records: [], totalCount: 0 })
    render(<SharedRecordsSheet {...PROPS_BASE} source={source} />)
    expect(
      await screen.findByText(/no shared records on file/i),
    ).toBeInTheDocument()
  })
})

describe('SharedRecordsSheet — dismiss paths', () => {
  it('Escape calls onClose', async () => {
    const onClose = vi.fn()
    const source = makeSource({ records: [], totalCount: 0 })
    render(
      <SharedRecordsSheet
        {...PROPS_BASE}
        source={source}
        onClose={onClose}
      />,
    )
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      )
    })
    expect(onClose).toHaveBeenCalled()
  })

  it('backdrop click calls onClose', async () => {
    const onClose = vi.fn()
    const source = makeSource({ records: [], totalCount: 0 })
    const user = userEvent.setup()
    render(
      <SharedRecordsSheet
        {...PROPS_BASE}
        source={source}
        onClose={onClose}
      />,
    )
    await user.click(screen.getByTestId('shared-records-backdrop'))
    expect(onClose).toHaveBeenCalled()
  })

  it('close button calls onClose', async () => {
    const onClose = vi.fn()
    const source = makeSource({ records: [], totalCount: 0 })
    const user = userEvent.setup()
    render(
      <SharedRecordsSheet
        {...PROPS_BASE}
        source={source}
        onClose={onClose}
      />,
    )
    await user.click(
      screen.getByRole('button', { name: /close — records with john coltrane/i }),
    )
    expect(onClose).toHaveBeenCalled()
  })

  it('swipe down ≥80px calls onClose (mobile drawer dismiss gesture)', () => {
    const onClose = vi.fn()
    const source = makeSource({ records: [], totalCount: 0 })
    render(
      <SharedRecordsSheet
        {...PROPS_BASE}
        source={source}
        onClose={onClose}
      />,
    )
    const sheet = screen.getByTestId('shared-records-sheet')
    fireEvent.touchStart(sheet, {
      touches: [{ clientY: 100 }],
    })
    fireEvent.touchEnd(sheet, {
      changedTouches: [{ clientY: 200 }], // 100px down — exceeds the 80px threshold
    })
    expect(onClose).toHaveBeenCalled()
  })

  it('swipe down <80px does NOT call onClose (the threshold prevents accidental dismiss)', () => {
    const onClose = vi.fn()
    const source = makeSource({ records: [], totalCount: 0 })
    render(
      <SharedRecordsSheet
        {...PROPS_BASE}
        source={source}
        onClose={onClose}
      />,
    )
    const sheet = screen.getByTestId('shared-records-sheet')
    fireEvent.touchStart(sheet, { touches: [{ clientY: 100 }] })
    fireEvent.touchEnd(sheet, { changedTouches: [{ clientY: 140 }] }) // 40px
    expect(onClose).not.toHaveBeenCalled()
  })

  it('refetches when collabId changes (uses the useBffResource sync reset)', async () => {
    const source = makeSource({ records: [], totalCount: 0 })
    const { rerender } = render(
      <SharedRecordsSheet {...PROPS_BASE} source={source} />,
    )
    await waitFor(() => {
      expect(source.sharedRecords).toHaveBeenCalledWith(
        PROPS_BASE.focusId,
        PROPS_BASE.collabId,
      )
    })
    rerender(
      <SharedRecordsSheet
        {...PROPS_BASE}
        source={source}
        collabId="wikidata:Q541659"
        collabName="Paul Chambers"
      />,
    )
    await waitFor(() => {
      expect(source.sharedRecords).toHaveBeenCalledWith(
        PROPS_BASE.focusId,
        'wikidata:Q541659',
      )
    })
  })
})
