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
import {
  useFocusTrap,
  useSwipeDownDismiss,
  useBodyScrollLock,
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
  // `open` drives the enter transition: false on first paint → true next
  // frame so the sheet slides up from translateY(100%).
  const [open, setOpen] = useState(false)

  useFocusTrap(sheetRef, true)
  // Lock the background page while the sheet is open so the underlying detail
  // view can't scroll (or scroll-chain) behind it. `.more-body` stays free to
  // scroll. Sheet is conditionally mounted, so `true` = "open".
  useBodyScrollLock(true)
  // Gate the swipe-dismiss to chrome touches (#115). `.more-body` is
  // `overflow-y: auto`, so without this gate a downward scroll of a long bio
  // past the 80px threshold dismisses the sheet — the latent accidental-
  // dismiss bug #115 flagged. (The old "the bio body doesn't scroll" comment
  // was wrong: max-height:78vh + overflow-y:auto means long bios DO scroll.)
  // Mirrors SharedRecordsSheet's `.records-body` gate — both sheets now gate
  // their scrollable body identically; the swipe still dismisses from the
  // drag-handle / header chrome.
  const swipe = useSwipeDownDismiss(onClose, { ignoreClosest: '.more-body' })

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
        {...swipe}
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
