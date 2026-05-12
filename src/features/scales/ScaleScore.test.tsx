import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ScaleScore from './ScaleScore'

// abcjs injects its <svg> into the wrapper. The wrapper exposes role="img"
// with a descriptive aria-label, which we use as the entry point.
const findSvg = (): SVGElement | null => {
  const host = screen.getByRole('img', { name: /Scale notation/ })
  // eslint-disable-next-line testing-library/no-node-access
  return host.querySelector('svg')
}

describe('ScaleScore', () => {
  it('renders an svg from the given notes (no crash)', () => {
    render(<ScaleScore notes={['C', 'D', 'E', 'F', 'G', 'A', 'B']} />)
    expect(findSvg()).not.toBeNull()
  })

  it('renders for a scale starting on B♭', () => {
    render(<ScaleScore notes={['Bb', 'C', 'Db', 'Eb', 'F', 'G', 'Ab']} />)
    expect(findSvg()).not.toBeNull()
  })
})
