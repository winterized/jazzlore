import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ScaleScore from './ScaleScore'

// abcjs injects its <svg> into the wrapper. The wrapper exposes role="img"
// with a descriptive aria-label, which we use as the entry point.
// Because abcjs is loaded via dynamic import (perf: keeps it out of the main bundle),
// the <svg> appears asynchronously after mount — we wait for it.
const findSvg = (): SVGElement | null => {
  const host = screen.getByRole('img', { name: /Scale notation/ })
  return host.querySelector('svg')
}

describe('ScaleScore', () => {
  it('renders an svg from the given notes (no crash)', async () => {
    render(<ScaleScore notes={['C', 'D', 'E', 'F', 'G', 'A', 'B']} />)
    await waitFor(() => expect(findSvg()).not.toBeNull())
  })

  it('renders for a scale starting on B♭', async () => {
    render(<ScaleScore notes={['Bb', 'C', 'Db', 'Eb', 'F', 'G', 'Ab']} />)
    await waitFor(() => expect(findSvg()).not.toBeNull())
  })
})
