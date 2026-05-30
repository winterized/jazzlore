import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CURATED_SCALES } from './data/curated'
import ScaleRow from './ScaleRow'

const ionian = CURATED_SCALES.find((s) => s.id === 'ionian')!
const aeolian = CURATED_SCALES.find((s) => s.id === 'aeolian')!

describe('ScaleRow', () => {
  it('shows the scale name (Ionian renamed to Major)', () => {
    render(<ScaleRow scale={ionian} root="C" notes={['C', 'D', 'E', 'F', 'G', 'A', 'B']} />)
    expect(screen.getByRole('heading', { name: /^Major$/ })).toBeInTheDocument()
  })

  it('renders the description · theory-tag line in the muted slot', () => {
    const { container } = render(
      <ScaleRow scale={aeolian} root="C" notes={['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb']} />,
    )
    const line = container.querySelector('.scale-alias')
    expect(line?.textContent).toBe(`${aeolian.description} · ${aeolian.theoryTag}`)
  })

  it('always renders the description line, even for scales that had no alias', () => {
    const dorian = CURATED_SCALES.find((s) => s.id === 'dorian')!
    const { container } = render(
      <ScaleRow scale={dorian} root="C" notes={['C', 'D', 'Eb', 'F', 'G', 'A', 'Bb']} />,
    )
    const line = container.querySelector('.scale-alias')
    expect(line?.textContent).toBe(`${dorian.description} · ${dorian.theoryTag}`)
  })

  it('renders the intervals exactly as in the curated data', () => {
    render(<ScaleRow scale={ionian} root="C" notes={['C', 'D', 'E', 'F', 'G', 'A', 'B']} />)
    expect(screen.getByText('1 2 3 4 5 6 7')).toBeInTheDocument()
  })

  it('renders the note names for the given root', () => {
    render(<ScaleRow scale={ionian} root="Bb" notes={['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A']} />)
    expect(screen.getByText('B♭ C D E♭ F G A')).toBeInTheDocument()
  })

  it('renders the piano keyboard', () => {
    const { container } = render(
      <ScaleRow scale={ionian} root="C" notes={['C', 'D', 'E', 'F', 'G', 'A', 'B']} />,
    )
    expect(container.querySelectorAll('[data-role="white-key"]')).toHaveLength(14)
  })

  it('renders a play button labelled with scale + root', () => {
    render(<ScaleRow scale={ionian} root="Bb" notes={['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A']} />)
    expect(screen.getByRole('button', { name: /Play Major on B♭/ })).toBeInTheDocument()
  })

  it('renders a star button for saving the scale', () => {
    render(<ScaleRow scale={ionian} root="C" notes={['C', 'D', 'E', 'F', 'G', 'A', 'B']} />)
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
  })

  it('orders the action buttons sound-then-favorite (consistent with chords)', () => {
    render(<ScaleRow scale={ionian} root="Bb" notes={['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A']} />)
    const labels = screen.getAllByRole('button').map((b) => b.getAttribute('aria-label') ?? '')
    const playIdx = labels.findIndex((l) => /^Play /.test(l))
    const starIdx = labels.findIndex((l) => /save/i.test(l))
    expect(playIdx).toBeGreaterThanOrEqual(0)
    expect(starIdx).toBeGreaterThanOrEqual(0)
    expect(playIdx).toBeLessThan(starIdx) // play (sound) before star (favorite)
  })

  it('renders note names visually above interval numbers', () => {
    // The note-name row anchors the scale to its current root and reads
    // first; intervals are the abstract structure underneath.
    const { container } = render(
      <ScaleRow scale={ionian} root="Bb" notes={['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A']} />,
    )
    const notes = container.querySelector('.scale-notes')
    const intervals = container.querySelector('.scale-intervals')
    expect(notes).not.toBeNull()
    expect(intervals).not.toBeNull()
    // compareDocumentPosition: bit 4 = "follows"
    expect(notes!.compareDocumentPosition(intervals!) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
  })
})
