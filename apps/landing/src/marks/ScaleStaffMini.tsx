/* Scales-tile mark — 5-line staff with 7 ascending noteheads.
   Ported from design handoff shared.jsx > ScaleStaffMini. */

type Props = {
  width?: number
  height?: number
}

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
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
      aria-hidden="true"
    >
      {STAFF_YS.map((y, i) => (
        <line
          key={i}
          x1="2"
          y1={y}
          x2={width - 2}
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
