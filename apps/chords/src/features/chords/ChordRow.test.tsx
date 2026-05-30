import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CURATED_CHORDS } from '../../data/curated'
import ChordRow from './ChordRow'

const cmaj7 = CURATED_CHORDS.find((c) => c.id === 'maj7')!
const bbm7 = CURATED_CHORDS.find((c) => c.id === 'm7')!
const c7alt = CURATED_CHORDS.find((c) => c.id === '7alt')!
const cmaj = CURATED_CHORDS.find((c) => c.id === 'maj')!

describe('ChordRow — Cmaj7 with root C', () => {
  it('renders the primary symbol', () => {
    render(<ChordRow rootNote="C" definition={cmaj7} />)
    expect(screen.getByText('Cmaj7')).toBeInTheDocument()
  })

  it('renders the alternate symbol CΔ7', () => {
    render(<ChordRow rootNote="C" definition={cmaj7} />)
    expect(screen.getByText('CΔ7')).toBeInTheDocument()
  })

  it('renders the full name', () => {
    render(<ChordRow rootNote="C" definition={cmaj7} />)
    expect(screen.getByText('major 7th')).toBeInTheDocument()
  })

  it('renders the note names string "C E G B"', () => {
    render(<ChordRow rootNote="C" definition={cmaj7} />)
    expect(screen.getByText('C E G B')).toBeInTheDocument()
  })

  it('renders the intervals string "1 3 5 7"', () => {
    render(<ChordRow rootNote="C" definition={cmaj7} />)
    expect(screen.getByText('1 3 5 7')).toBeInTheDocument()
  })

  it('renders a piano keyboard (14 white keys)', () => {
    const { container } = render(<ChordRow rootNote="C" definition={cmaj7} />)
    expect(container.querySelectorAll('[data-role="white-key"]')).toHaveLength(14)
  })

  it('renders a play button with aria-label including primary symbol', () => {
    render(<ChordRow rootNote="C" definition={cmaj7} />)
    expect(screen.getByRole('button', { name: /Play Cmaj7/ })).toBeInTheDocument()
  })

  it('renders a star button with aria-label including primary symbol', () => {
    render(<ChordRow rootNote="C" definition={cmaj7} />)
    expect(
      screen.getByRole('button', { name: /Save Cmaj7 to my collection/i }),
    ).toBeInTheDocument()
  })
})

describe('ChordRow — Bb minor 7th (black-key root)', () => {
  it('renders without throwing (white-key startPc derivation)', () => {
    expect(() => render(<ChordRow rootNote="B♭" definition={bbm7} />)).not.toThrow()
  })

  it('renders primary symbol B♭m7', () => {
    render(<ChordRow rootNote="B♭" definition={bbm7} />)
    expect(screen.getByText('B♭m7')).toBeInTheDocument()
  })

  it('renders note names B♭ D♭ F A♭', () => {
    render(<ChordRow rootNote="B♭" definition={bbm7} />)
    expect(screen.getByText('B♭ D♭ F A♭')).toBeInTheDocument()
  })
})

describe('ChordRow — C major (no alternate)', () => {
  it('renders without alternate symbol text', () => {
    render(<ChordRow rootNote="C" definition={cmaj} />)
    // Primary symbol is just "C"; no alternate suffix defined
    expect(screen.getByText('C')).toBeInTheDocument()
  })

  it('still renders vertical placeholder for layout consistency', () => {
    const { container } = render(<ChordRow rootNote="C" definition={cmaj} />)
    // Scope to the placeholder div specifically. The play/star buttons also
    // carry aria-hidden on their decorative spans, so a bare query would pass
    // even if the placeholder was deleted. Match on the explicit `h-4` class
    // to confirm the vertical-rhythm reservation is present.
    const placeholder = container.querySelector('div.h-4[aria-hidden="true"]')
    expect(placeholder).not.toBeNull()
  })
})

describe('ChordRow — C7alt (7-note chord)', () => {
  it('renders without errors for the dense 7-note altered chord', () => {
    expect(() => render(<ChordRow rootNote="C" definition={c7alt} />)).not.toThrow()
  })

  it('renders primary symbol C7alt', () => {
    render(<ChordRow rootNote="C" definition={c7alt} />)
    expect(screen.getByText('C7alt')).toBeInTheDocument()
  })

  it('renders intervals including ♯11 and ♭13', () => {
    render(<ChordRow rootNote="C" definition={c7alt} />)
    expect(screen.getByText(/♯11/)).toBeInTheDocument()
    expect(screen.getByText(/♭13/)).toBeInTheDocument()
  })
})
