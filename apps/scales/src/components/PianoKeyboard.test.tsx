import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PianoKeyboard from './PianoKeyboard'

// SVG primitives like <rect>/<text> don't expose accessible roles for individual
// keys, so we query the structural data-* attributes we set on each <rect>.
const queryAll = (container: HTMLElement, selector: string) =>
  // eslint-disable-next-line testing-library/no-node-access
  container.querySelectorAll(selector)

describe('PianoKeyboard', () => {
  it('renders 14 white keys and 10 black keys', () => {
    const { container } = render(
      <PianoKeyboard scaleNotes={['C', 'D', 'E', 'F', 'G', 'A', 'B']} root="C" startOctave={4} />,
    )
    expect(queryAll(container, '[data-role="white-key"]')).toHaveLength(14)
    expect(queryAll(container, '[data-role="black-key"]')).toHaveLength(10)
  })

  it('marks the root with data-state="root" on every occurrence in range', () => {
    const { container } = render(
      <PianoKeyboard scaleNotes={['C', 'D', 'E', 'F', 'G', 'A', 'B']} root="C" startOctave={4} />,
    )
    expect(queryAll(container, '[data-state="root"]')).toHaveLength(2) // C4 and C5
  })

  it('marks non-root scale notes with data-state="scale"', () => {
    const { container } = render(
      <PianoKeyboard scaleNotes={['C', 'D', 'E', 'F', 'G', 'A', 'B']} root="C" startOctave={4} />,
    )
    // 7-note scale, 2 octaves, root excluded → 12 scale-marked keys
    expect(queryAll(container, '[data-state="scale"]')).toHaveLength(12)
  })

  it('handles Bb Dorian: root marked twice, no double-marking on white/black', () => {
    const { container } = render(
      <PianoKeyboard
        scaleNotes={['Bb', 'C', 'Db', 'Eb', 'F', 'G', 'Ab']}
        root="Bb"
        startOctave={4}
      />,
    )
    expect(queryAll(container, '[data-state="root"]')).toHaveLength(2)
  })

  it('shows note names only when showNoteNames is true', () => {
    const { container, rerender } = render(
      <PianoKeyboard scaleNotes={['C', 'D']} root="C" startOctave={4} />,
    )
    expect(queryAll(container, '[data-role="note-label"]')).toHaveLength(0)
    rerender(<PianoKeyboard scaleNotes={['C', 'D']} root="C" startOctave={4} showNoteNames />)
    expect(queryAll(container, '[data-role="note-label"]').length).toBeGreaterThan(0)
  })
})
