/* Scales-tile mark — 5-line staff with 7 ascending noteheads.
   Note positions are computed as fractions of the rendered width and
   height (same idiom as ChordDotsStaff) so the staff fills the canvas
   at every size. Notes span x=10–70% leaving the right ~30% clear for
   the play button the parent absolutely-positions over this SVG; y
   ratios are the original handoff's contour preserved (line 4 → top
   → line 3 ascending then back). */

type Props = {
  width?: number
  height?: number
}

// Each tuple is [x-fraction, y-fraction]. Definition-time pairing
// keeps the noUncheckedIndexedAccess type checker honest — map yields
// already-bound x/y, no per-index lookups needed at render time.
const NOTE_FRACS: ReadonlyArray<readonly [number, number]> = [
  [0.1, 46 / 60],
  [0.2, 40 / 60],
  [0.3, 34 / 60],
  [0.4, 28 / 60],
  [0.5, 22 / 60],
  [0.6, 28 / 60],
  [0.7, 34 / 60],
]
const STAFF_Y_FRACS = [
  10 / 60,
  20 / 60,
  30 / 60,
  40 / 60,
  50 / 60,
] as const

export function ScaleStaffMini({ width = 180, height = 60 }: Props) {
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
      aria-hidden="true"
    >
      {STAFF_Y_FRACS.map((yf, i) => (
        <line
          key={i}
          x1="2"
          y1={yf * height}
          x2={width - 2}
          y2={yf * height}
          stroke="var(--duo-fg)"
          strokeOpacity="0.5"
          strokeWidth="0.6"
        />
      ))}
      {NOTE_FRACS.map(([xf, yf], i) => {
        const cx = xf * width
        const cy = yf * height
        return (
          <ellipse
            key={i}
            cx={cx}
            cy={cy}
            rx="3.5"
            ry="2.6"
            fill="var(--duo-fg)"
            transform={`rotate(-20 ${cx} ${cy})`}
          />
        )
      })}
    </svg>
  )
}
