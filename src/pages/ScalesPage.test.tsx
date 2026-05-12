import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import ScalesPage from './ScalesPage'

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/scales/:root" element={<ScalesPage />} />
      </Routes>
    </MemoryRouter>,
  )

describe('ScalesPage', () => {
  it('renders the canonical root from a valid slug', () => {
    renderAt('/scales/B-flat')
    expect(screen.getByRole('heading', { level: 1, name: /B♭ scales/i })).toBeInTheDocument()
  })

  it('renders for sharp slugs', () => {
    renderAt('/scales/F-sharp')
    expect(screen.getByRole('heading', { level: 1, name: /F♯ scales/i })).toBeInTheDocument()
  })
})
