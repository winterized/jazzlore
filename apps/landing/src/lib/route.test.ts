import { describe, expect, it } from 'vitest'
import { routeFor } from './route'

describe('routeFor', () => {
  it('maps / to the landing view', () => {
    expect(routeFor('/')).toBe('landing')
  })

  it('maps /privacy to the privacy view', () => {
    expect(routeFor('/privacy')).toBe('privacy')
  })

  it('tolerates a trailing slash on /privacy', () => {
    expect(routeFor('/privacy/')).toBe('privacy')
  })

  it('falls back to landing for any unknown path (SPA catch-all)', () => {
    expect(routeFor('/scales')).toBe('landing')
    expect(routeFor('/privacy-policy')).toBe('landing')
    expect(routeFor('')).toBe('landing')
  })
})
