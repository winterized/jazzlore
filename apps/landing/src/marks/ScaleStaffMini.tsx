/* Scales-tile mark — 5-line staff with 7 ascending noteheads.
   Ported from design handoff shared.jsx > ScaleStaffMini.

   The viewBox is FIXED at the internal coordinate space (180x60), NOT
   tied to the width/height props. Noteheads live at static x=30..150
   coords in that space; if viewBox were derived from `width` (the
   original handoff's shape), narrower renders (e.g. mobile width=70)
   would push every notehead past x=70 out of the viewport, leaving the
   staff strip empty. With a fixed viewBox + preserveAspectRatio, the
   whole staff scales as a unit and stays visible at every size. */

type Props = {
  width?: number
  height?: number
}

const VB_W = 180
const VB_H = 60
const STAFF_YS = [10, 20, 30, 40, 50] as const
const NOTES: ReadonlyArray<{ x: number; y: number }> = [
  { x: 30, y: 46 },
  { x: 50, y: 40 },
  { x: 70, y: 34 },
  { x: 90, y: 28 },
  { x: 110, y: 22 },
  { x: 130, y: 28 },
  { x: 150, y: 34 },
]

export function ScaleStaffMini({ width = 180, height = 60 }: Props) {
  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      width={width}
      height={height}
      preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
      aria-hidden="true"
    >
      {STAFF_YS.map((y, i) => (
        <line
          key={i}
          x1="2"
          y1={y}
          x2={VB_W - 2}
          y2={y}
          stroke="var(--duo-fg)"
          strokeOpacity="0.5"
          strokeWidth="0.6"
        />
      ))}
      {NOTES.map((n, i) => (
        <ellipse
          key={i}
          cx={n.x}
          cy={n.y}
          rx="3.5"
          ry="2.6"
          fill="var(--duo-fg)"
          transform={`rotate(-20 ${n.x} ${n.y})`}
        />
      ))}
    </svg>
  )
}
