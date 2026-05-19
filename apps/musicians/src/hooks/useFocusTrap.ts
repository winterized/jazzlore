// useFocusTrap — trap Tab focus within a container while open, restore focus
// to the previously-focused element on close. Used by the "More about"
// bottom sheet (design "Bottom-sheet traps focus while open"). Pure DOM, no
// deps; mirrors the proven RootSheet trap pattern in @jazzlore/ui.

import { useEffect, type RefObject } from 'react'

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])'

export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
): void {
  useEffect(() => {
    if (!active) return
    const container = ref.current
    if (!container) return
    const previouslyFocused = document.activeElement as HTMLElement | null

    // Exclude only elements explicitly removed from the layout/a11y tree.
    // (An `offsetParent === null` check is unreliable under jsdom, which
    // performs no layout — project tooling quirk.)
    const isVisible = (el: HTMLElement): boolean =>
      !el.hasAttribute('hidden') &&
      el.getAttribute('aria-hidden') !== 'true' &&
      el.closest('[hidden],[aria-hidden="true"]') === null

    const focusables = (): HTMLElement[] =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        isVisible,
      )

    // Move focus into the sheet on open.
    const first = focusables()[0]
    if (first) first.focus()
    else container.focus()

    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const firstEl = items[0]!
      const lastEl = items[items.length - 1]!
      const activeEl = document.activeElement
      if (e.shiftKey && activeEl === firstEl) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && activeEl === lastEl) {
        e.preventDefault()
        firstEl.focus()
      } else if (activeEl !== null && !container.contains(activeEl)) {
        e.preventDefault()
        firstEl.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      // Restore focus to the trigger. If it was removed from the DOM while
      // the trap was open (e.g. the disclosure unmounted with the sheet),
      // `.focus()` on the detached node silently drops focus to <body> — a
      // focus-loss a11y bug. Fall back to the page <h1> (or <main>) so
      // focus lands on meaningful content, never nowhere.
      if (previouslyFocused?.isConnected) {
        previouslyFocused.focus()
        return
      }
      const fallback =
        document.querySelector<HTMLElement>('h1') ??
        document.querySelector<HTMLElement>('main')
      if (fallback) {
        if (!fallback.hasAttribute('tabindex')) {
          fallback.setAttribute('tabindex', '-1')
        }
        fallback.focus()
      }
    }
  }, [ref, active])
}
