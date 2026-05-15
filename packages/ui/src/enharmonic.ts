/**
 * Pure enharmonic-flip helpers for root-note pickers.
 *
 * Extracted so both the desktop InlineRootPicker (Phase 2) and the mobile
 * bottom sheet (Phase 3) share one implementation. The pure resolver
 * (`resolveDisplayed`) is unit-testable without rendering; the React state
 * lives in a thin `useEnharmonicFlip` hook wrapper in this same file.
 */

import { useState } from 'react'
import type { RootOption } from './RootPicker'

// ─── Pure resolver ─────────────────────────────────────────────────────────────

export type DisplayedSpelling = {
  value: string
  label: string
}

/**
 * Given an option and whether it is currently flipped, returns the displayed
 * `{ value, label }` pair. When the option has no `alternate`, flip is a no-op.
 */
export function resolveDisplayed(option: RootOption, flipped: boolean): DisplayedSpelling {
  if (flipped && option.alternate) {
    return { value: option.alternate.value, label: option.alternate.label }
  }
  return { value: option.value, label: option.label }
}

/**
 * Returns the label that the badge should show — i.e. the OTHER spelling,
 * the one the button switches TO when clicked. Returns `undefined` when the
 * option has no alternate.
 */
export function resolveAlternateLabel(option: RootOption, flipped: boolean): string | undefined {
  if (!option.alternate) return undefined
  return flipped ? option.label : option.alternate.label
}

// ─── React hook ───────────────────────────────────────────────────────────────

export type EnharmonicFlipState = {
  /** Returns displayed { value, label } for a given option */
  getDisplayed: (option: RootOption) => DisplayedSpelling
  /** Returns the badge label (alternate spelling) for a given option, or undefined */
  getAlternateLabel: (option: RootOption) => string | undefined
  /** Toggles the flip state for a single option (keyed by option.value) */
  toggle: (optionValue: string) => void
}

export function useEnharmonicFlip(): EnharmonicFlipState {
  // Keyed by option.value (the canonical/primary value), true = showing alternate
  const [flipped, setFlipped] = useState<Record<string, boolean>>({})

  const getDisplayed = (option: RootOption): DisplayedSpelling =>
    resolveDisplayed(option, flipped[option.value] ?? false)

  const getAlternateLabel = (option: RootOption): string | undefined =>
    resolveAlternateLabel(option, flipped[option.value] ?? false)

  const toggle = (optionValue: string): void => {
    setFlipped((prev) => ({ ...prev, [optionValue]: !(prev[optionValue] ?? false) }))
  }

  return { getDisplayed, getAlternateLabel, toggle }
}
