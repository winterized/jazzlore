import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CURATED_SCALES } from './data/curated'
import ScaleRow from './ScaleRow'

const ionian = CURATED_SCALES.find((s) => s.id === 'ionian')!
const aeolian = CURATED_SCALES.find((s) => s.id === 'aeolian')!

describe('ScaleRow', () => {
  it('shows the scale name', () => {
    render(<ScaleRow scale={ionian} root="C" notes={['C', 'D', 'E', 'F', 'G', 'A', 'B']} />)
    expect(screen.getByRole('heading', { name: /^Ionian$/ })).toBeInTheDocument()
  })

  it('shows the alias when present (Aeolian → Natural minor)', () => {
    render(
      <ScaleRow scale={aeolian} root="C" notes={['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb']} />,
    )
    expect(screen.getByText('Natural minor')).toBeInTheDocument()
  })

  it('does not render an alias subtitle when the scale has no alias', () => {
    render(
      <ScaleRow
        scale={CURATED_SCALES.find((s) => s.id === 'dorian')!}
        root="C"
        notes={['C', 'D', 'Eb', 'F', 'G', 'A', 'Bb']}
      />,
    )
    expect(screen.queryByText('Natural minor')).toBeNull()
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
    // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container -- SVG primitives have no roles
    expect(container.querySelectorAll('[data-role="white-key"]')).toHaveLength(14)
  })
})
