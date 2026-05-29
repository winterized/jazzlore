import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Footer } from './Footer'

describe('Footer', () => {
  it('links to the privacy page (the App Store privacy URL)', () => {
    render(<Footer />)
    const link = screen.getByRole('link', { name: /privacy/i })
    expect(link).toHaveAttribute('href', '/privacy')
  })

  it('still links to the source repository', () => {
    render(<Footer />)
    const link = screen.getByRole('link', { name: /source/i })
    expect(link).toHaveAttribute(
      'href',
      'https://github.com/winterized/jazzlore',
    )
  })
})
