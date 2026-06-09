import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { RecordRef } from '../lib/types'
import { RecordsStrip } from './RecordsStrip'

// A well-formed record (what the curated 12 return).
const good: RecordRef = {
  id: 'rec:1',
  title: 'Kind of Blue',
  primaryArtist: 'Miles Davis',
  releaseYear: 1959,
  cover: {},
  links: {},
}

// The degenerate shape the BFF returned for the sparse "polished" musician
// Lee Morse (widget v1.1 blank-screen regression): NO `id`, NO `title`, empty
// cover/links. `title`/`id` are typed required but are `undefined` at runtime.
const malformed = {
  primaryArtist: 'Lee Morse',
  cover: {},
  links: {},
} as unknown as RecordRef

describe('RecordsStrip — sparse/malformed record hardening', () => {
  it('does not throw when a record has no title (Lee Morse regression)', () => {
    // Before the fix, AttribAlbum → spotifyRecordUrl(undefined,…) →
    // term() → undefined.trim() → TypeError → blank screen.
    expect(() => render(<RecordsStrip records={[malformed]} />)).not.toThrow()
  })

  it('renders nothing when every record is unusable (no title)', () => {
    const { container } = render(<RecordsStrip records={[malformed]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows only usable records and counts them, dropping title-less ones', () => {
    render(<RecordsStrip records={[good, malformed]} />)
    expect(screen.getByText('Kind of Blue')).toBeInTheDocument()
    // "Lee Morse" only appeared as the primaryArtist of the dropped record.
    expect(screen.queryByText('Lee Morse')).not.toBeInTheDocument()
    // The "N key" count reflects the displayed (usable) records, not the raw list.
    expect(screen.getByText('1 key')).toBeInTheDocument()
  })
})
