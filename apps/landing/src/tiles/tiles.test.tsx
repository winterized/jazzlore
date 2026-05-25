import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChordsTile } from './ChordsTile'
import { MetronomeTile } from './MetronomeTile'
import { MusiciansTile } from './MusiciansTile'
import { ScalesTile } from './ScalesTile'

describe('tile hrefs (desktop variant)', () => {
  it('Musicians tile links to musicians.jazzlore.com', () => {
    render(<MusiciansTile variant="desktop" />)
    expect(
      screen.getByRole('link', { name: /musicians/i }),
    ).toHaveAttribute('href', 'https://musicians.jazzlore.com')
  })

  it('Scales tile links to scales.jazzlore.com', () => {
    render(<ScalesTile variant="desktop" />)
    expect(
      screen.getByRole('link', { name: /scales/i }),
    ).toHaveAttribute('href', 'https://scales.jazzlore.com')
  })

  it('Chords tile links to chords.jazzlore.com', () => {
    render(<ChordsTile variant="desktop" />)
    expect(
      screen.getByRole('link', { name: /chords/i }),
    ).toHaveAttribute('href', 'https://chords.jazzlore.com')
  })

  it('Metronome tile links to metronome.jazzlore.com', () => {
    render(<MetronomeTile variant="desktop" />)
    expect(
      screen.getByRole('link', { name: /metronome/i }),
    ).toHaveAttribute('href', 'https://metronome.jazzlore.com')
  })
})

describe('tile chrome — subdomain visibility per variant', () => {
  it('Musicians shows its subdomain at BOTH desktop and mobile (the hero gets identity treatment)', () => {
    const { rerender } = render(<MusiciansTile variant="desktop" />)
    expect(screen.getByText('musicians.jazzlore.com')).toBeInTheDocument()
    rerender(<MusiciansTile variant="mobile" />)
    expect(screen.getByText('musicians.jazzlore.com')).toBeInTheDocument()
  })

  it('Scales shows its subdomain at desktop, NOT at mobile (small tile, no top-right text)', () => {
    const { rerender } = render(<ScalesTile variant="desktop" />)
    expect(screen.getByText('scales.jazzlore.com')).toBeInTheDocument()
    rerender(<ScalesTile variant="mobile" />)
    expect(screen.queryByText('scales.jazzlore.com')).not.toBeInTheDocument()
  })

  it('Chords shows its subdomain at desktop, NOT at mobile', () => {
    const { rerender } = render(<ChordsTile variant="desktop" />)
    expect(screen.getByText('chords.jazzlore.com')).toBeInTheDocument()
    rerender(<ChordsTile variant="mobile" />)
    expect(screen.queryByText('chords.jazzlore.com')).not.toBeInTheDocument()
  })

  it('Metronome shows its subdomain at desktop, NOT at mobile', () => {
    const { rerender } = render(<MetronomeTile variant="desktop" />)
    expect(screen.getByText('metronome.jazzlore.com')).toBeInTheDocument()
    rerender(<MetronomeTile variant="mobile" />)
    expect(
      screen.queryByText('metronome.jazzlore.com'),
    ).not.toBeInTheDocument()
  })
})
