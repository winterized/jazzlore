import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PrivacyPage } from './PrivacyPage'

describe('PrivacyPage', () => {
  it('leads with the one-sentence summary as the page heading', () => {
    render(<PrivacyPage />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveTextContent(/don't collect personal data/i)
  })

  it('states the no-tracking promises in the list', () => {
    render(<PrivacyPage />)
    // Match the full list-item phrasing so each promise is unique on the page
    // ("No accounts" also opens the intro prose). App Review reads these plainly.
    expect(screen.getByText(/no accounts, logins, or profiles/i)).toBeInTheDocument()
    expect(screen.getByText(/no analytics —/i)).toBeInTheDocument()
    expect(screen.getByText(/no tracking, no cookies/i)).toBeInTheDocument()
    expect(screen.getByText(/no advertising and no ad networks/i)).toBeInTheDocument()
    expect(screen.getByText(/no telemetry or crash reporting/i)).toBeInTheDocument()
    expect(screen.getByText(/no third-party services/i)).toBeInTheDocument()
  })

  it('frames the Musicians backend exception honestly — IDs, nothing about you', () => {
    render(<PrivacyPage />)
    expect(screen.getByRole('heading', { name: /The one exception/i })).toBeInTheDocument()
    expect(screen.getByText(/carries the musician's ID and nothing about you/i)).toBeInTheDocument()
  })

  it('explains what stays on the device', () => {
    render(<PrivacyPage />)
    expect(screen.getByText(/local storage on your device/i)).toBeInTheDocument()
  })

  it('points privacy questions at GitHub issues (the live contact method)', () => {
    render(<PrivacyPage />)
    const link = screen.getByRole('link', { name: /open an issue on github/i })
    expect(link).toHaveAttribute(
      'href',
      'https://github.com/winterized/jazzlore/issues',
    )
  })

  it('shows a last-updated date', () => {
    render(<PrivacyPage />)
    expect(screen.getByText(/Last updated/i)).toBeInTheDocument()
  })

  it('offers a way back home', () => {
    render(<PrivacyPage />)
    const home = screen.getAllByRole('link', { name: /home|jazzlore/i })
    expect(home.some((a) => a.getAttribute('href') === '/')).toBe(true)
  })
})
