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

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  useFocusTrap,
  useSheetDrag,
  useBodyScrollLock,
  useSheetTransition,
} from '@jazzlore/ui'

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
  // Enter/exit transition: `open` slides the sheet up on mount; `requestClose`
  // slides it back DOWN and only then unmounts (calls onClose), so dismissing
  // animates out instead of vanishing. Every dismiss path routes through it.
  const { open, requestClose } = useSheetTransition(onClose)

  useFocusTrap(sheetRef, true)
  // Lock the background page while the sheet is open so the underlying detail
  // view can't scroll (or scroll-chain) behind it. `.more-body` stays free to
  // scroll. Sheet is conditionally mounted, so `true` = "open".
  useBodyScrollLock(true)
  // Interactive drag-to-dismiss: the sheet follows the finger and dismisses
  // past the threshold (else springs back). Gated to chrome touches via
  // `ignoreClosest` (#115) — `.more-body` is `overflow-y: auto`, so a scroll
  // that begins in the bio must scroll the list, not drag the sheet.
  const drag = useSheetDrag(sheetRef, {
    onDismiss: requestClose,
    ignoreClosest: '.more-body',
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault()
        requestClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [requestClose])

  return createPortal(
    <>
      {/* Backdrop — a separate, aria-hidden sibling (the proven RootSheet
          pattern). Click-to-dismiss is a convenience; Esc + the × button
          are the accessible dismiss paths the dialog itself exposes. */}
      <div
        className={`mu3-sheet-backdrop${open ? ' open' : ''}`}
        data-testid="sheet-backdrop"
        aria-hidden="true"
        onClick={requestClose}
      />
      <div
        ref={sheetRef}
        className={`mu3-sheet${open ? ' open' : ''}`}
        data-testid="sheet-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        {...drag}
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
            onClick={requestClose}
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
