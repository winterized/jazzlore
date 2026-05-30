// No-photo figure library — editorial single-line instrument figures used
// inside `<Duo3>` when a musician has no portrait. Ported from the
// 2026-05-23 design handoff (`apps/musicians/docs/design_handoff_no_photo/`)
// — see that bundle's README for figure inventory, viewBox conventions,
// per-context sizing, and the corner-monogram rationale.
//
// Figure artwork: the B / Open redraw shipped in `apps/musicians/docs/
// figure-redraw-brief/figures-redrawn-source.md`. Same FIG_LIB keys, same
// 100×140 viewBox, same `.ln / .dot / .keyfill` class contract — only the
// inner SVG markup differs. The redraw was reviewed against the brief's
// constraints (legibility at stroke widths 2.0 → 4.5, head at y≈22, feet
// at y=134) and accepted 2026-05-23.
//
// The pass-3 handoff shipped this as a window-global plain JS module; here
// it's a normal ES module: NoPhotoMark is a real React component, FIG_LIB
// is a strongly-typed map, and the monogram reuses the single `initialsOf`
// from `./duotone` (no duplicate implementation, no particle-skip fork).
//
// Test seam: the `.duo3-mark` wrapper carries `data-no-photo-key` so unit
// tests and the live-prod spec can assert the resolved figure without
// poking SVG inner markup.
import { initialsOf } from './duotone'
import { FIG_LIB, figKey } from './noPhotoFigures.lib'

type NoPhotoMarkProps = {
  /** Free-form instrument string from the data layer; figure resolves via
   * `figKey`. Omit / pass `undefined` → renders the `rest` figure. */
  inst?: string | null
  /** When provided, a 1–2 letter mono monogram renders in the corner. The
   * monogram is intentionally hidden at dense sizes (`.conn`, `.ident`,
   * `.suggest-row`) by CSS; the name lives alongside the tile there. */
  name?: string
  /** Forwarded to the wrapper `<div>` so per-context overrides keep working
   * when callers compose extra class names. */
  className?: string
}

/** Editorial single-line figure overlaid on a `<Duo3>` field when no
 * portrait exists. Rendered absolutely-positioned (`pointer-events: none`)
 * inside the duotone tile; carries `aria-hidden="true"` because the parent
 * already exposes the musician's name. */
export function NoPhotoMark({
  inst,
  name,
  className = '',
}: NoPhotoMarkProps) {
  const key = figKey(inst)
  const inner = FIG_LIB[key]
  const monogram = name ? initialsOf(name) : ''
  const wrapperClass = className
    ? `duo3-mark ${className}`
    : 'duo3-mark'
  return (
    <div
      className={wrapperClass}
      aria-hidden="true"
      data-no-photo-key={key}
    >
      <svg
        viewBox="0 0 100 140"
        preserveAspectRatio="xMidYMax meet"
        dangerouslySetInnerHTML={{ __html: inner }}
      />
      {monogram && <span className="duo3-mark-ini">{monogram}</span>}
    </div>
  )
}
