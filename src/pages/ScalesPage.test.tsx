import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { describe, expect, it } from 'vitest'
import ScalesPage from './ScalesPage'

const LocationProbe = () => {
  const loc = useLocation()
  return <div data-testid="loc">{loc.pathname}</div>
}

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/scales/:root" element={<><ScalesPage /><LocationProbe /></>} />
      </Routes>
    </MemoryRouter>,
  )

describe('ScalesPage routing', () => {
  it('renders the RootPicker with current root highlighted', () => {
    renderAt('/scales/D-flat')
    expect(screen.getByRole('radio', { name: 'D♭' })).toHaveAttribute('aria-checked', 'true')
  })

  it('navigates to the new root URL when a root is clicked', async () => {
    renderAt('/scales/C')
    await userEvent.click(screen.getByRole('radio', { name: 'F♯' }))
    expect(screen.getByTestId('loc').textContent).toBe('/scales/F-sharp')
  })
})
