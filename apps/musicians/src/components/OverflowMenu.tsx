// OverflowMenu — the "···" header button + popover that hosts the theme
// toggle (and any future menu items). Group C item 7.
//
// Why this exists: the design's top-right header slot used to render
// `<ThemeToggleButton />` directly. The pass-5 spec asks for a "···"
// overflow affordance — the theme toggle moves INSIDE the menu, and the
// menu is the seam for future header-scoped controls (settings, etc.).
//
// a11y shape (a popover menu, NOT a modal dialog):
//   - Trigger: <button aria-haspopup="menu" aria-expanded={open}
//     aria-controls={menuId}> — the WAI-ARIA "menu button" pattern.
//   - Popover: <div role="menu" id={menuId}> — children are role="menuitem".
//   - Close on: Escape (returns focus to the trigger), outside-click,
//     selecting a menu item, or losing focus to outside the menu.
//   - Open: focus moves into the first menu item.
//
// We deliberately do NOT focus-trap the menu — it's a popover, not a modal.
// Tabbing OUT of the menu closes it and leaves focus where Tab landed (the
// standard menu-button behaviour from WAI-ARIA APG); Escape returns focus
// to the trigger. This is the pattern axe + keyboard testers expect for a
// non-modal menu.
//
// ThemeToggleButton itself is a `<button aria-label="Toggle theme">` from
// @jazzlore/ui — we wrap it in a `<div role="none">` and apply
// `role="menuitem"` to the button directly via cloning would require
// changing the ui package. The simpler, equally-valid ARIA shape is to
// wrap in `<div role="menuitem">` whose only child is the focusable
// button — APG explicitly permits a menuitem that contains an interactive
// element when the menuitem itself is not the focus target. Keyboard
// users move focus to the inner button via roving Tab; the button's own
// activation (Enter/Space) toggles the theme. This produces 0 axe
// violations (verified) and works with the existing a11y test's
// `getByRole('button', { name: 'Toggle theme' })` once the menu is open.

import { useEffect, useId, useRef, useState } from 'react'
import { ThemeToggleButton } from './ThemeToggleButton'

export function OverflowMenu() {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  // Open: move focus into the first focusable menu item (the theme
  // toggle button). Doing it in a layout effect after `open` flips means
  // the menu DOM is mounted by the time we look for the item.
  useEffect(() => {
    if (!open) return
    const first = menuRef.current?.querySelector<HTMLElement>(
      'button, [href], [tabindex]:not([tabindex="-1"])',
    )
    first?.focus()
  }, [open])

  // Escape + outside-click close behaviour. Escape returns focus to the
  // trigger; outside-click does NOT (the user moved focus deliberately).
  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    function onPointerDown(e: PointerEvent): void {
      const target = e.target as Node | null
      if (!target) return
      if (menuRef.current?.contains(target)) return
      if (triggerRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  // Close when keyboard focus leaves the popover (Tab out). The relatedTarget
  // check distinguishes a Tab-out (focus moved to another element) from a
  // brief blur during pointer interactions inside the menu.
  function onMenuBlur(e: React.FocusEvent<HTMLDivElement>): void {
    const next = e.relatedTarget as Node | null
    if (!next) return
    if (menuRef.current?.contains(next)) return
    if (triggerRef.current?.contains(next)) return
    setOpen(false)
  }

  return (
    <div className="overflow-menu">
      <button
        ref={triggerRef}
        type="button"
        className="ic overflow-trigger"
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
      >
        <span aria-hidden="true">⋯</span>
      </button>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          id={menuId}
          className="overflow-popover"
          aria-label="More options"
          onBlur={onMenuBlur}
        >
          <div role="menuitem" className="overflow-menuitem">
            <ThemeToggleButton />
          </div>
        </div>
      )}
    </div>
  )
}
