import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '@testing-library/react'

const h = vi.hoisted(() => {
  const listeners: Record<string, (e: { url: string }) => void> = {}
  return {
    native: true,
    listeners,
    navigate: vi.fn(),
    addListener: vi.fn((name: string, cb: (e: { url: string }) => void) => {
      listeners[name] = cb
      return Promise.resolve({ remove: vi.fn() })
    }),
  }
})

vi.mock('react-router', () => ({ useNavigate: () => h.navigate }))
vi.mock('@capacitor/app', () => ({ App: { addListener: h.addListener } }))
vi.mock('@jazzlore/ui', () => ({ isNativeApp: () => h.native }))

import { DeepLinkHandler } from './DeepLinkHandler'

describe('DeepLinkHandler', () => {
  beforeEach(() => {
    h.native = true
    for (const k of Object.keys(h.listeners)) delete h.listeners[k]
    h.navigate.mockClear()
    h.addListener.mockClear()
  })

  it('navigates to the parsed musician path on appUrlOpen (native shell)', () => {
    render(<DeepLinkHandler />)
    h.listeners.appUrlOpen?.({ url: 'jazzlore-musicians://musician/wikidata:Q93341' })
    expect(h.navigate).toHaveBeenCalledWith('/musicians/wikidata%3AQ93341')
  })

  it('ignores URLs that are not widget musician links', () => {
    render(<DeepLinkHandler />)
    h.listeners.appUrlOpen?.({ url: 'https://example.com/whatever' })
    expect(h.navigate).not.toHaveBeenCalled()
  })

  it('registers no listener off the native shell (browser/PWA)', () => {
    h.native = false
    render(<DeepLinkHandler />)
    expect(h.addListener).not.toHaveBeenCalled()
  })
})
