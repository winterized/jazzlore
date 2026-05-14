import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PianoKeyboard from './PianoKeyboard'

// SVG primitives like <rect>/<text> don't expose accessible roles for individual
// keys, so we query the structural data-* attributes we set on each <rect>.
const queryAll = (container: HTMLElement, selector: string) =>
  // eslint-disable-next-line testing-library/no-node-access
  container.querySelectorAll(selector)

// Pitch class arrays (0..11) for common scales, computed without music-core
// C major: C=0, D=2, E=4, F=5, G=7, A=9, B=11
const C_MAJOR_PCS = [0, 2, 4, 5, 7, 9, 11] as const
// Bb Dorian: Bb=10, C=0, Db=1, Eb=3, F=5, G=7, Ab=8
const BB_DORIAN_PCS = [10, 0, 1, 3, 5, 7, 8] as const

describe('PianoKeyboard', () => {
  it('renders 14 white keys and 10 black keys', () => {
    const { container } = render(
      <PianoKeyboard scalePcs={C_MAJOR_PCS} rootPc={0} startOctave={4} />,
    )
    expect(queryAll(container, '[data-role="white-key"]')).toHaveLength(14)
    expect(queryAll(container, '[data-role="black-key"]')).toHaveLength(10)
  })

  it('marks the root with data-state="root" on every occurrence in range', () => {
    const { container } = render(
      <PianoKeyboard scalePcs={C_MAJOR_PCS} rootPc={0} startOctave={4} />,
    )
    expect(queryAll(container, '[data-state="root"]')).toHaveLength(2) // C4 and C5
  })

  it('marks non-root scale notes with data-state="scale"', () => {
    const { container } = render(
      <PianoKeyboard scalePcs={C_MAJOR_PCS} rootPc={0} startOctave={4} />,
    )
    // 7-note scale, 2 octaves, root excluded → 12 scale-marked keys
    expect(queryAll(container, '[data-state="scale"]')).toHaveLength(12)
  })

  it('handles Bb Dorian: root marked twice, no double-marking on white/black', () => {
    const { container } = render(
      <PianoKeyboard scalePcs={BB_DORIAN_PCS} rootPc={10} startOctave={4} />,
    )
    expect(queryAll(container, '[data-state="root"]')).toHaveLength(2)
  })

  it('shows note names only when showNoteNames is true', () => {
    const { container, rerender } = render(
      <PianoKeyboard scalePcs={[0, 2]} rootPc={0} startOctave={4} />,
    )
    expect(queryAll(container, '[data-role="note-label"]')).toHaveLength(0)
    rerender(<PianoKeyboard scalePcs={[0, 2]} rootPc={0} startOctave={4} showNoteNames />)
    expect(queryAll(container, '[data-role="note-label"]').length).toBeGreaterThan(0)
  })

  it('renders without a root highlight when rootPc is undefined', () => {
    const { container } = render(
      <PianoKeyboard scalePcs={C_MAJOR_PCS} />,
    )
    expect(queryAll(container, '[data-state="root"]')).toHaveLength(0)
  })
})
