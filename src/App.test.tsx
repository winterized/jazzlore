import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('redirects / to /scales/C and renders the C heading', () => {
    window.history.pushState({}, '', '/')
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: /C scales/i })).toBeInTheDocument()
  })
})
