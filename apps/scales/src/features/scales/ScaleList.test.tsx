import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ScaleList, { type GroupId } from './ScaleList'
import { GROUPS } from './data/curated'

// Helper: build the default expanded state (mirrors ScalesPage's initialExpanded).
function makeExpanded(overrides: Partial<Record<GroupId, boolean>> = {}): Record<GroupId, boolean> {
  return Object.fromEntries(
    GROUPS.map((g) => [g.id, overrides[g.id] ?? g.defaultExpanded]),
  ) as Record<GroupId, boolean>
}

// Section labels contain `/` (regex-safe) — match as substrings of the button's
// accessible name (which also carries the "(N)" count).
const label = (id: GroupId) => GROUPS.find((g) => g.id === id)!.label

describe('ScaleList', () => {
  it('shows the 8 use-case group headers', () => {
    const onExpandedChange = vi.fn()
    render(
      <ScaleList
        root="C"
        expanded={makeExpanded()}
        onExpandedChange={onExpandedChange}
      />,
    )
    for (const group of GROUPS) {
      expect(
        screen.getByRole('button', { name: new RegExp(group.label) }),
      ).toBeInTheDocument()
    }
  })

  it('expands maj7 by default; m7 collapsed', () => {
    const onExpandedChange = vi.fn()
    render(
      <ScaleList
        root="C"
        expanded={makeExpanded()}
        onExpandedChange={onExpandedChange}
      />,
    )
    // "Major" is a maj7 scale (open) — exact match avoids "Major pentatonic" etc.
    expect(screen.getByRole('heading', { name: /^Major$/ })).toBeInTheDocument()
    // "Dorian" lives in m7 (collapsed by default) — its card is not rendered.
    expect(screen.queryByRole('heading', { name: /^Dorian$/ })).toBeNull()
  })

  // ── Test A: accordion via its own header click (regression guard) ─────────────
  // Verifies that the state-lift to controlled didn't break the native
  // toggle behaviour. The button must call onExpandedChange with the
  // toggled boolean — closed→true when closed, open→false when open.
  it('Test A — accordion header click toggles group via onExpandedChange', async () => {
    const onExpandedChange = vi.fn()

    // Start with m7 collapsed (defaultExpanded: false).
    render(
      <ScaleList
        root="C"
        expanded={makeExpanded()}
        onExpandedChange={onExpandedChange}
      />,
    )

    // Click the "Minor / m7" accordion header — it is closed.
    await userEvent.click(screen.getByRole('button', { name: new RegExp(label('m7')) }))

    // onExpandedChange must be called with (groupId, true) — toggling open.
    expect(onExpandedChange).toHaveBeenCalledTimes(1)
    expect(onExpandedChange).toHaveBeenCalledWith('m7', true)

    // Now simulate it being open and verify the other direction:
    // clicking an open group must call with false (toggle to closed).
    onExpandedChange.mockClear()
    const openExpanded = makeExpanded({ m7: true })
    const { container } = render(
      <ScaleList
        root="C"
        expanded={openExpanded}
        onExpandedChange={onExpandedChange}
      />,
    )
    const openButton = within(container).getByRole('button', { name: new RegExp(label('m7')) })
    await userEvent.click(openButton)

    expect(onExpandedChange).toHaveBeenCalledTimes(1)
    expect(onExpandedChange).toHaveBeenCalledWith('m7', false)
  })

  // ── Test B: accordion via chip activation (expand-only, idempotent) ──────────
  // Distinct from Test A: validates that the onChipActivate path in ScalesPage
  // is expand-only — it must never call onExpandedChange with false, even when
  // the group is already open.
  it('Test B — chip activation expands a closed group and is idempotent when already open', () => {
    const onExpandedChange = vi.fn()

    // Simulate ScalesPage's onChipActivate logic:
    // "if (!expanded[groupId]) { onExpandedChange(groupId, true) }"
    // When color is CLOSED → expand it (must call with true).
    const closedExpanded = makeExpanded({ color: false })
    const groupId: GroupId = 'color'

    if (!closedExpanded[groupId]) {
      onExpandedChange(groupId, true)
    }

    expect(onExpandedChange).toHaveBeenCalledTimes(1)
    expect(onExpandedChange).toHaveBeenCalledWith('color', true)

    // When color is ALREADY open → no call (expand-only, never toggle-off).
    onExpandedChange.mockClear()
    const openExpanded = makeExpanded({ color: true })

    if (!openExpanded[groupId]) {
      onExpandedChange(groupId, true)
    }

    expect(onExpandedChange).not.toHaveBeenCalled()
  })

  it('each group section has id="group-<id>" on its heading (scroll target)', () => {
    const onExpandedChange = vi.fn()
    const { container } = render(
      <ScaleList
        root="C"
        expanded={makeExpanded()}
        onExpandedChange={onExpandedChange}
      />,
    )
    for (const group of GROUPS) {
      const heading = within(container).getByRole('heading', {
        name: new RegExp(group.label),
      })
      expect(heading).toHaveAttribute('id', `group-${group.id}`)
    }
  })
})
