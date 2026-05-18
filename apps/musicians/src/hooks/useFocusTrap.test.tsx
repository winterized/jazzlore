// useFocusTrap — focus restoration on cleanup. The trap restores focus to
// the previously-focused trigger when it closes; if that trigger has been
// removed from the DOM (e.g. the disclosure unmounted with the sheet),
// `.focus()` on the detached node silently sends focus to <body> (a
// focus-loss a11y bug) — cleanup must fall back to the page <h1>/<main>.

import { render, screen } from '@testing-library/react'
import { useRef } from 'react'
import { describe, expect, it } from 'vitest'
import { useFocusTrap } from './useFocusTrap'

function Trap() {
  const ref = useRef<HTMLDivElement>(null)
  useFocusTrap(ref, true)
  return (
    <div ref={ref} role="dialog" tabIndex={-1}>
      <button type="button">inside</button>
    </div>
  )
}

function Harness({ showTrap, showTrigger }: { showTrap: boolean; showTrigger: boolean }) {
  return (
    <main>
      <h1>Bobby Timmons</h1>
      {showTrigger && (
        <button type="button" data-testid="trigger">
          open
        </button>
      )}
      {showTrap && <Trap />}
    </main>
  )
}

describe('useFocusTrap — focus restoration on cleanup', () => {
  it('restores focus to the live trigger when it still exists', () => {
    const { rerender } = render(<Harness showTrap={false} showTrigger />)
    const trigger = screen.getByTestId('trigger')
    trigger.focus()
    expect(trigger).toHaveFocus()

    rerender(<Harness showTrap showTrigger />)
    // Trap moved focus inside (the only focusable button).
    expect(screen.getByRole('button', { name: 'inside' })).toHaveFocus()

    rerender(<Harness showTrap={false} showTrigger />)
    expect(screen.getByTestId('trigger')).toHaveFocus()
  })

  it('falls back to the page <h1> (not <body>) when the trigger is gone', () => {
    const { rerender } = render(<Harness showTrap={false} showTrigger />)
    screen.getByTestId('trigger').focus()

    rerender(<Harness showTrap showTrigger />)
    expect(screen.getByRole('button', { name: 'inside' })).toHaveFocus()

    // Close the trap AND remove the trigger in the same commit (the real
    // case: the disclosure link unmounts together with the sheet).
    rerender(<Harness showTrap={false} showTrigger={false} />)

    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveFocus()
    expect(document.activeElement).not.toBe(document.body)
  })
})
