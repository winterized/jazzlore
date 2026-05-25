import { useEffect } from 'react'

type Props = {
  open: boolean
  onClose: () => void
}

export function AboutOverlay({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="jzl-about-fixed">
      {/* Backdrop is a real <button> so it carries its own click +
          keyboard semantics (Enter/Space) without needing the
          jsx-a11y/click-events-have-key-events lint disable. Esc on
          document above is the more conventional close path. */}
      <button
        type="button"
        className="jzl-about-backdrop"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className="jzl-about-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="jzl-about-eyebrow"
      >
        <button
          type="button"
          className="jzl-about-close"
          aria-label="Close About"
          onClick={onClose}
        >
          ×
        </button>
        <div id="jzl-about-eyebrow" className="jzl-about-eyebrow">
          <span className="jzl-about-eyebrow-dot" aria-hidden="true" />
          About
        </div>
        {/* VERBATIM copy from design_handoff_jazzlore_landing/README.md.
            "Musicians is different" is intentionally italicized + accent.
            DO NOT paraphrase. */}
        <p className="jzl-about-body">
          I built these tools for myself, for my practice as an amateur,
          not-very-good jazz pianist.{' '}
          <em className="jzl-about-emphasis">Musicians is different</em> —
          it's an exploration device I'd wanted to build for a long time,
          because I believe human relationships are the core of jazz, as
          they are of many things in life.
        </p>
        <p className="jzl-about-coda">
          This is personal; it doesn't aspire to be the right fit for
          everyone.
        </p>
      </div>
    </div>
  )
}
