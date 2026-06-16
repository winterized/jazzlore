import { describe, expect, it } from 'vitest'
import { retryCooldownSeconds } from './retryBackoff'

describe('retryCooldownSeconds', () => {
  it('lets the first attempt retry immediately (no cooldown)', () => {
    expect(retryCooldownSeconds(0)).toBe(0)
  })

  it('escalates 1s → 2s → 4s after each successive retry', () => {
    expect(retryCooldownSeconds(1)).toBe(1)
    expect(retryCooldownSeconds(2)).toBe(2)
    expect(retryCooldownSeconds(3)).toBe(4)
  })

  it('caps the cooldown at 5s from the fourth retry onward', () => {
    expect(retryCooldownSeconds(4)).toBe(5)
    expect(retryCooldownSeconds(5)).toBe(5)
    expect(retryCooldownSeconds(12)).toBe(5)
  })

  it('treats negative counts as no cooldown (defensive)', () => {
    expect(retryCooldownSeconds(-3)).toBe(0)
  })
})
