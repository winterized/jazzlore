import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { applyTheme, clearOverride, getOverride, resolveInitialTheme, setOverride } from './theme'

const mockMatchMedia = (matches: boolean) => {
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches,
    media: q,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }))
}

describe('theme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })
  afterEach(() => vi.unstubAllGlobals())

  it('defaults to system "light" when no override and prefers-color-scheme: light', () => {
    mockMatchMedia(false)
    expect(resolveInitialTheme()).toBe('light')
  })

  it('defaults to system "dark" when no override and prefers-color-scheme: dark', () => {
    mockMatchMedia(true)
    expect(resolveInitialTheme()).toBe('dark')
  })

  it('honors localStorage override "dark" even if system says light', () => {
    mockMatchMedia(false)
    localStorage.setItem('jazzlore:theme:v1', '"dark"')
    expect(resolveInitialTheme()).toBe('dark')
  })

  it('setOverride writes to localStorage', () => {
    setOverride('dark')
    expect(localStorage.getItem('jazzlore:theme:v1')).toBe('"dark"')
    expect(getOverride()).toBe('dark')
  })

  it('clearOverride removes the key', () => {
    setOverride('light')
    clearOverride()
    expect(localStorage.getItem('jazzlore:theme:v1')).toBeNull()
    expect(getOverride()).toBeNull()
  })

  it('applyTheme sets data-theme on documentElement', () => {
    applyTheme('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    applyTheme('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })
})
