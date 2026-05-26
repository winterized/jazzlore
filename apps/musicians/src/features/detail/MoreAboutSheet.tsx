// MoreAboutSheet — the "More about" bottom sheet (design `MoreAbout` +
// pass-3 styles `.more-overlay`/`.more-sheet`).
//
// Portalled to document.body — NOT inside the scrolled detail panel
// (landmine 8: a sheet nested in the scrolled container can't overlay it;
// same lesson as the sticky-header work). Dismiss paths: backdrop tap, ↓
// swipe ≥80px, × button, Esc. Focus-trapped while open. The open/close
// transition is the 280ms cubic-bezier slide + 200ms backdrop fade
// (components.css); reduced-motion = no slide (the CSS media query clamps
// the transition). The `#about` hash ↔ Back wiring lives in the parent
// (DetailView) so the open state is link-addressable and Back closes it.

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useFocusTrap } from '@jazzlore/ui'

const SWIPE_DISMISS_PX = 80

type Props = {
  name: string
  paragraphs: string[]
  attribution?: string
  onClose: () => void
}

export function MoreAboutSheet({
  name,
  paragraphs,
  attribution,
  onClose,
}: Props) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const titleId = 'more-about-title'
  // `open` drives the enter transition: false on first paint → true next
  // frame so the sheet slides up from translateY(100%).
  const [open, setOpen] = useState(false)
  const touchStartY = useRef<number | null>(null)

  useFocusTrap(sheetRef, true)

  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(true))
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const onTouchStart = (e: React.TouchEvent): void => {
    touchStartY.current = e.touches[0]?.clientY ?? null
  }
  const onTouchMove = (): void => {
    /* tracked on end; move kept so the gesture is recognised */
  }
  const onTouchEnd = (e: React.TouchEvent): void => {
    const start = touchStartY.current
    const end = e.changedTouches[0]?.clientY ?? null
    touchStartY.current = null
    if (start !== null && end !== null && end - start >= SWIPE_DISMISS_PX) {
      onClose()
    }
  }

  return createPortal(
    <>
      {/* Backdrop — a separate, aria-hidden sibling (the proven RootSheet
          pattern). Click-to-dismiss is a convenience; Esc + the × button
          are the accessible dismiss paths the dialog itself exposes. */}
      <div
        className={`mu3-sheet-backdrop${open ? ' open' : ''}`}
        data-testid="sheet-backdrop"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        className={`mu3-sheet${open ? ' open' : ''}`}
        data-testid="sheet-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="more-handle" aria-hidden="true" />
        <div className="more-head">
          <div className="ttl" id={titleId}>
            More about <em>{name}</em>
          </div>
          <button
            type="button"
            className="close"
            aria-label={`Close — more about ${name}`}
            onClick={onClose}
          >
            close ×
          </button>
        </div>
        <div className="more-body">
          {paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
          {attribution && <div className="attribution">{attribution}</div>}
        </div>
      </div>
    </>,
    document.body,
  )
}
