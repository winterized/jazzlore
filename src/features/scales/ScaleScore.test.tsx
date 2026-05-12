import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ScaleScore from './ScaleScore'

// abcjs renders an <svg> with no accessible role, so the wrapper exposes
// aria-label="score" and we then look up the SVG that abcjs injected into it.
const findSvg = (label: string): SVGElement | null => {
  const host = screen.getByLabelText(label)
  // eslint-disable-next-line testing-library/no-node-access
  return host.querySelector('svg')
}

describe('ScaleScore', () => {
  it('renders an svg from the given notes (no crash)', () => {
    render(<ScaleScore notes={['C', 'D', 'E', 'F', 'G', 'A', 'B']} />)
    expect(findSvg('score')).not.toBeNull()
  })

  it('renders for a scale starting on B♭', () => {
    render(<ScaleScore notes={['Bb', 'C', 'Db', 'Eb', 'F', 'G', 'Ab']} />)
    expect(findSvg('score')).not.toBeNull()
  })
})
