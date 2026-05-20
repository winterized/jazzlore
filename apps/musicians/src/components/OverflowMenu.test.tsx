// OverflowMenu unit tests — open/close, keyboard, focus, ARIA.
//
// The popover hosts the theme toggle today; the assertions are framed in
// terms of menu shape (role="menu" / role="menuitem") + the "Toggle theme"
// button being reachable inside, so future menu items don't churn the
// tests.

import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { OverflowMenu } from './OverflowMenu'

describe('OverflowMenu', () => {
  it('renders the "More options" trigger button (and only that) when closed', () => {
    render(<OverflowMenu />)
    const trigger = screen.getByRole('button', { name: /more options/i })
    expect(trigger).toBeInTheDocument()
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    // No menu rendered while closed.
    expect(screen.queryByRole('menu')).toBeNull()
    // The wrapped theme toggle is NOT reachable until the menu opens.
    expect(
      screen.queryByRole('button', { name: /toggle theme/i }),
    ).toBeNull()
  })

  it('opens on trigger click and renders a role="menu" containing the theme toggle', async () => {
    const user = userEvent.setup()
    render(<OverflowMenu />)
    await user.click(screen.getByRole('button', { name: /more options/i }))
    const menu = screen.getByRole('menu', { name: /more options/i })
    expect(menu).toBeInTheDocument()
    // The theme toggle lives inside a role="menuitem" wrapper.
    const menuitem = within(menu).getByRole('menuitem')
    expect(
      within(menuitem).getByRole('button', { name: /toggle theme/i }),
    ).toBeInTheDocument()
  })

  it('reflects open state in aria-expanded', async () => {
    const user = userEvent.setup()
    render(<OverflowMenu />)
    const trigger = screen.getByRole('button', { name: /more options/i })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('wires the trigger to the menu via aria-controls/id', async () => {
    const user = userEvent.setup()
    render(<OverflowMenu />)
    const trigger = screen.getByRole('button', { name: /more options/i })
    const controls = trigger.getAttribute('aria-controls')
    expect(controls).toBeTruthy()
    await user.click(trigger)
    const menu = screen.getByRole('menu', { name: /more options/i })
    expect(menu).toHaveAttribute('id', controls!)
  })

  it('moves focus to the first menu item when opened', async () => {
    const user = userEvent.setup()
    render(<OverflowMenu />)
    await user.click(screen.getByRole('button', { name: /more options/i }))
    // The inner ThemeToggleButton is the first (and only) focusable
    // descendant of the menu — focus lands there on open.
    expect(
      screen.getByRole('button', { name: /toggle theme/i }),
    ).toHaveFocus()
  })

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup()
    render(<OverflowMenu />)
    const trigger = screen.getByRole('button', { name: /more options/i })
    await user.click(trigger)
    expect(screen.getByRole('menu')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('menu')).toBeNull()
    expect(trigger).toHaveFocus()
  })

  it('closes on outside (pointerdown) click', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <button>outside</button>
        <OverflowMenu />
      </div>,
    )
    await user.click(screen.getByRole('button', { name: /more options/i }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    // pointerdown is what the popover listens for (avoids racing the
    // click handler on the trigger itself).
    fireEvent.pointerDown(screen.getByRole('button', { name: /outside/i }))
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('clicking the trigger while open closes the menu', async () => {
    const user = userEvent.setup()
    render(<OverflowMenu />)
    const trigger = screen.getByRole('button', { name: /more options/i })
    await user.click(trigger)
    expect(screen.getByRole('menu')).toBeInTheDocument()
    await user.click(trigger) // toggle close
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('keeps the menu open when clicking inside it', async () => {
    const user = userEvent.setup()
    render(<OverflowMenu />)
    await user.click(screen.getByRole('button', { name: /more options/i }))
    const menu = screen.getByRole('menu')
    // A pointerdown inside the menu body must NOT close it.
    fireEvent.pointerDown(menu)
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })
})
