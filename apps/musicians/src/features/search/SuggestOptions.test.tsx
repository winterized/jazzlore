// SuggestOptions — issue #69 no-photo treatment. Autosuggest rows render the
// editorial instrument figure (figKey/NoPhotoMark) in place of the monogram
// square, with NO photo fetch (autosuggest is a transient surface). The figure
// is an aria-hidden decorative mark with no accessible role, so these
// structural assertions need direct node access.
/* eslint-disable testing-library/no-container, testing-library/no-node-access */
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SuggestOptions } from './SuggestOptions'
import type { SearchHit } from './searchCorpus'

const HITS: SearchHit[] = [
  {
    entry: {
      id: 'wikidata:Q1',
      name: 'Art Blakey',
      aka: [],
      primaryInstrument: 'drums',
    },
    ranges: [],
  },
  // No instrument → the dignified `rest` figure, never a bare monogram.
  { entry: { id: 'wikidata:Q2', name: 'Sideman X', aka: [] }, ranges: [] },
]

function renderOptions() {
  return render(
    <SuggestOptions
      listId="t"
      hits={HITS}
      activeIdx={-1}
      pos={{ top: 0, left: 0, width: 320 }}
      onChoose={vi.fn()}
    />,
  )
}

describe('SuggestOptions — #69 instrument-figure treatment', () => {
  it('renders the instrument figure (not the monogram square) for each row', () => {
    const { container } = renderOptions()
    const marks = container.querySelectorAll('[data-no-photo-key]')
    expect(marks).toHaveLength(2)
    expect(marks[0]?.getAttribute('data-no-photo-key')).toBe('drums')
    expect(marks[1]?.getAttribute('data-no-photo-key')).toBe('rest')
    // The plain monogram square must NOT render — the figure replaces it.
    expect(container.querySelector('.duo3-initials')).toBeNull()
  })
})
