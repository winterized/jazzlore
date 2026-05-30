import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ChordSymbolDisplay from './ChordSymbolDisplay'

describe('ChordSymbolDisplay', () => {
  it('renders the primary symbol at prominent size', () => {
    render(<ChordSymbolDisplay primary="Cmaj7" />)
    expect(screen.getByText('Cmaj7')).toBeInTheDocument()
  })

  it('renders both primary and alternate when alternate is provided', () => {
    render(<ChordSymbolDisplay primary="Cmaj7" alternate="CΔ7" />)
    expect(screen.getByText('Cmaj7')).toBeInTheDocument()
    expect(screen.getByText('CΔ7')).toBeInTheDocument()
  })

  it('does not render alternate text when alternate is undefined', () => {
    render(<ChordSymbolDisplay primary="C7" />)
    expect(screen.queryByText('CΔ7')).toBeNull()
  })

  it('preserves vertical space with placeholder when alternate is absent', () => {
    const { container } = render(<ChordSymbolDisplay primary="C7" />)
    // When alternate is absent an aria-hidden placeholder div is rendered
    // so all rows maintain the same height.
    const placeholder = container.querySelector('[aria-hidden="true"]')
    expect(placeholder).not.toBeNull()
  })

  it('does NOT render placeholder div when alternate is present', () => {
    const { container } = render(<ChordSymbolDisplay primary="Cmaj7" alternate="CΔ7" />)
    // aria-hidden placeholder should not be present when alternate text is shown
    const placeholder = container.querySelector('[aria-hidden="true"]')
    expect(placeholder).toBeNull()
  })

  it('renders without parens around alternate', () => {
    render(<ChordSymbolDisplay primary="Cm" alternate="C-" />)
    const text = screen.getByText('C-').textContent ?? ''
    expect(text).not.toContain('(')
    expect(text).not.toContain(')')
  })

  it('renders correct symbols for diminished chord', () => {
    render(<ChordSymbolDisplay primary="Cdim" alternate="C°" />)
    expect(screen.getByText('Cdim')).toBeInTheDocument()
    expect(screen.getByText('C°')).toBeInTheDocument()
  })

  // Left-alignment regression contract (see ChordSymbolDisplay.tsx header).
  //
  // The reported "primary and alternate are not perfectly left-aligned" was
  // diagnosed in a real browser as pure ~0.25px font side-bearing: the box-left
  // of both lines is already bit-identical (Δ = 0px, light and dark). jsdom
  // cannot measure glyph ink, so these tests instead lock the *structural*
  // guarantee the alignment depends on — a single left-origin column with no
  // padding / margin / text-indent and no per-line text-align override — so the
  // sub-pixel residual can never regress into a real whole-pixel offset.
  it('lays both lines out in one shared left-aligned column (no left divergence)', () => {
    const { container } = render(<ChordSymbolDisplay primary="Cm" alternate="C-" />)
    const wrapper = container.querySelector('.chord-symbol-display')
    expect(wrapper).not.toBeNull()
    // One flex column → both <p> share the same left origin; w-fit shrinks the
    // box to content so it behaves as one tight unit inside ChordRow's flex row;
    // items-start + text-left make the start edge explicit and divergence-proof.
    expect(wrapper).toHaveClass('inline-flex', 'w-fit', 'flex-col', 'items-start', 'text-left')
  })

  it('keeps the intentional size contrast and adds no left padding/indent to either line', () => {
    render(<ChordSymbolDisplay primary="Cm" alternate="C-" />)
    const primary = screen.getByText('Cm')
    const alternate = screen.getByText('C-')

    // Size contrast is the whole point (apps/chords/CLAUDE.md: "the size
    // difference does the work") — primary text-lg, alternate text-xs.
    expect(primary).toHaveClass('text-lg', 'font-semibold')
    expect(alternate).toHaveClass('text-xs')

    // Neither line may carry a horizontal box offset (padding / margin /
    // indent / per-line alignment) that would shift one start edge off the
    // other. Asserting the class lists stay free of those utilities guards
    // the alignment without needing real layout (jsdom can't measure it).
    for (const el of [primary, alternate]) {
      const cls = el.className
      expect(cls).not.toMatch(/\b-?(p|m)(l|x)-/) // no padding/margin left or x
      expect(cls).not.toMatch(/\bindent-/) // no text-indent
      expect(cls).not.toMatch(/\btext-(center|right)\b/) // no align override
    }
  })

  it('still uses block-level paragraphs so the two start edges stack vertically', () => {
    render(<ChordSymbolDisplay primary="Cmaj7" alternate="CΔ7" />)
    // Both symbols are <p> elements (default display:block) inside the flex
    // column — they stack on separate lines sharing one left origin rather
    // than flowing inline where side-by-side text would never align.
    expect(screen.getByText('Cmaj7').tagName).toBe('P')
    expect(screen.getByText('CΔ7').tagName).toBe('P')
  })
})
