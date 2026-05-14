import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import AbcScore from './AbcScore'

// Mock abcjs — it's a browser library that doesn't work in jsdom.
// The mock must be hoisted; vi.mock is hoisted to the top of the file automatically.
vi.mock('abcjs', () => ({
  renderAbc: vi.fn(),
}))

describe('AbcScore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders a div with role="img"', () => {
    render(<AbcScore abc="X:1\nM:none\nL:1/4\nK:C\nCDEFGABc|" />)
    expect(screen.getByRole('img')).toBeDefined()
  })

  it('renders with default aria-label "Music notation"', () => {
    render(<AbcScore abc="X:1\nM:none\nL:1/4\nK:C\nCDEFGABc|" />)
    expect(screen.getByRole('img', { name: /music notation/i })).toBeDefined()
  })

  it('accepts a custom aria-label', () => {
    render(
      <AbcScore
        abc="X:1\nM:none\nL:1/4\nK:C\nCDEFGABc|"
        aria-label="Scale notation: C, D, E"
      />,
    )
    expect(screen.getByRole('img', { name: /scale notation/i })).toBeDefined()
  })

  it('calls abcjs.renderAbc with the supplied abc string after mount', async () => {
    const abcjs = await import('abcjs')
    const abc = 'X:1\nM:none\nL:1/4\nK:C\nCDEFGABc|'
    render(<AbcScore abc={abc} />)
    await waitFor(() => {
      expect(abcjs.renderAbc).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        abc,
        expect.any(Object),
      )
    })
  })

  it('passes default padding options to renderAbc', async () => {
    const abcjs = await import('abcjs')
    render(<AbcScore abc="X:1\nM:none\nL:1/4\nK:C\nCDEFGABc|" />)
    await waitFor(() => {
      expect(abcjs.renderAbc).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.any(String),
        expect.objectContaining({ paddingtop: 8, paddingbottom: 14 }),
      )
    })
  })

  it('allows staffwidth override via props', async () => {
    const abcjs = await import('abcjs')
    render(<AbcScore abc="X:1\nM:none\nL:1/4\nK:C\nCDEFGABc|" staffwidth={480} />)
    await waitFor(() => {
      expect(abcjs.renderAbc).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.any(String),
        expect.objectContaining({ staffwidth: 480 }),
      )
    })
  })

  it('re-renders when abc prop changes', async () => {
    const abcjs = await import('abcjs')
    const abc1 = 'X:1\nM:none\nL:1/4\nK:C\nCDEFGABc|'
    const abc2 = 'X:1\nM:none\nL:1/1\nK:C\n[CEG]'
    const { rerender } = render(<AbcScore abc={abc1} />)
    await waitFor(() => expect(abcjs.renderAbc).toHaveBeenCalledTimes(1))
    rerender(<AbcScore abc={abc2} />)
    await waitFor(() => expect(abcjs.renderAbc).toHaveBeenCalledTimes(2))
    expect(abcjs.renderAbc).toHaveBeenLastCalledWith(
      expect.any(HTMLElement),
      abc2,
      expect.any(Object),
    )
  })
})
