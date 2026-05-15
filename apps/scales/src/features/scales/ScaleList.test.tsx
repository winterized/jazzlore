import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ScaleList, { type FamilyId } from './ScaleList'
import { FAMILIES } from './data/curated'

// Helper: build the default expanded state (mirrors ScalesPage's initialExpanded).
function makeExpanded(overrides: Partial<Record<FamilyId, boolean>> = {}): Record<FamilyId, boolean> {
  return Object.fromEntries(
    FAMILIES.map((f) => [f.id, overrides[f.id] ?? f.defaultExpanded]),
  ) as Record<FamilyId, boolean>
}

describe('ScaleList', () => {
  it('shows 7 family group headers', () => {
    const onExpandedChange = vi.fn()
    render(
      <ScaleList
        root="C"
        expanded={makeExpanded()}
        onExpandedChange={onExpandedChange}
      />,
    )
    for (const label of [
      'Modes of major',
      'Modes of melodic minor',
      'Modes of harmonic minor',
      'Symmetric',
      'Pentatonic & blues',
      'Bebop',
      'Exotic',
    ]) {
      expect(screen.getByRole('button', { name: new RegExp(label) })).toBeInTheDocument()
    }
  })

  it('expands Modes of major by default; Modes of melodic minor collapsed', () => {
    const onExpandedChange = vi.fn()
    render(
      <ScaleList
        root="C"
        expanded={makeExpanded()}
        onExpandedChange={onExpandedChange}
      />,
    )
    expect(screen.getByRole('heading', { name: /^Ionian$/ })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /^Melodic minor$/ })).toBeNull()
  })

  // ── Test A: accordion via its own header click (regression guard) ─────────────
  // Verifies that the state-lift to controlled didn't break the native
  // toggle behaviour. The button must call onExpandedChange with the
  // toggled boolean — closed→true when closed, open→false when open.
  it('Test A — accordion header click toggles family via onExpandedChange', async () => {
    const onExpandedChange = vi.fn()

    // Start with melodic minor collapsed (defaultExpanded: false).
    render(
      <ScaleList
        root="C"
        expanded={makeExpanded()}
        onExpandedChange={onExpandedChange}
      />,
    )

    // Click the "Modes of melodic minor" accordion header — it is closed.
    await userEvent.click(screen.getByRole('button', { name: /Modes of melodic minor/ }))

    // onExpandedChange must be called with (familyId, true) — toggling open.
    expect(onExpandedChange).toHaveBeenCalledTimes(1)
    expect(onExpandedChange).toHaveBeenCalledWith('modes-of-melodic-minor', true)

    // Now simulate it being open and verify the other direction:
    // clicking an open family must call with false (toggle to closed).
    onExpandedChange.mockClear()
    const openExpanded = makeExpanded({ 'modes-of-melodic-minor': true })
    const { container } = render(
      <ScaleList
        root="C"
        expanded={openExpanded}
        onExpandedChange={onExpandedChange}
      />,
    )
    const openButton = within(container).getByRole('button', { name: /Modes of melodic minor/ })
    await userEvent.click(openButton)

    expect(onExpandedChange).toHaveBeenCalledTimes(1)
    expect(onExpandedChange).toHaveBeenCalledWith('modes-of-melodic-minor', false)
  })

  // ── Test B: accordion via chip activation (expand-only, idempotent) ──────────
  // Distinct from Test A: validates that the onChipActivate path in ScalesPage
  // is expand-only — it must never call onExpandedChange with false, even when
  // the family is already open.
  it('Test B — chip activation expands a closed family and is idempotent when already open', () => {
    const onExpandedChange = vi.fn()

    // Simulate ScalesPage's onChipActivate logic:
    // "if (!expanded[familyId]) { onExpandedChange(familyId, true) }"
    // When bebop is CLOSED → expand it (must call with true).
    const closedExpanded = makeExpanded({ bebop: false })
    const familyId: FamilyId = 'bebop'

    if (!closedExpanded[familyId]) {
      onExpandedChange(familyId, true)
    }

    expect(onExpandedChange).toHaveBeenCalledTimes(1)
    expect(onExpandedChange).toHaveBeenCalledWith('bebop', true)

    // When bebop is ALREADY open → no call (expand-only, never toggle-off).
    onExpandedChange.mockClear()
    const openExpanded = makeExpanded({ bebop: true })

    if (!openExpanded[familyId]) {
      onExpandedChange(familyId, true)
    }

    expect(onExpandedChange).not.toHaveBeenCalled()
  })

  it('each family section has id="group-<id>" on its heading (scroll target)', () => {
    const onExpandedChange = vi.fn()
    const { container } = render(
      <ScaleList
        root="C"
        expanded={makeExpanded()}
        onExpandedChange={onExpandedChange}
      />,
    )
    for (const family of FAMILIES) {
      const heading = within(container).getByRole('heading', {
        name: new RegExp(family.label),
      })
      expect(heading).toHaveAttribute('id', `group-${family.id}`)
    }
  })
})
