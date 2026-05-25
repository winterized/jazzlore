/* Musicians-tile hero — Miles Davis + the First Great Quintet (1955–58).
   Five named nodes (Miles, Coltrane, Red Garland, Paul Chambers, Philly
   Joe Jones) plus 11 anonymous nodes for graph density.

   Ported from the design handoff's shared.jsx > ConstellationLarge.
   Coordinates are normalized 0–1; same edge tiering (strong / medium /
   faint). Miles pulses on the jzl-pulse-2 keyframe. */

type Props = {
  width?: number
  height?: number
  dense?: boolean
  labelScale?: number
}

type LabelPos = 'top' | 'right' | 'left' | 'bottom'

type Node = {
  x: number
  y: number
  r: number
  hero?: boolean
  name?: string
  lp?: LabelPos
}

const QUINTET: ReadonlyArray<Node> = [
  { x: 0.42, y: 0.5, r: 12, hero: true, name: 'Miles Davis', lp: 'right' },
  { x: 0.22, y: 0.18, r: 8, name: 'John Coltrane', lp: 'top' },
  { x: 0.66, y: 0.2, r: 8, name: 'Red Garland', lp: 'right' },
  { x: 0.74, y: 0.78, r: 8, name: 'Paul Chambers', lp: 'bottom' },
  { x: 0.18, y: 0.78, r: 8, name: 'Philly Joe Jones', lp: 'bottom' },
]

const ANON: ReadonlyArray<Node> = [
  { x: 0.07, y: 0.4, r: 4 },
  { x: 0.05, y: 0.62, r: 3 },
  { x: 0.78, y: 0.52, r: 5 },
  { x: 0.91, y: 0.34, r: 3 },
  { x: 0.55, y: 0.94, r: 3 },
  { x: 0.4, y: 0.93, r: 3 },
  { x: 0.94, y: 0.66, r: 4 },
  { x: 0.86, y: 0.08, r: 2 },
  { x: 0.42, y: 0.06, r: 3 },
  { x: 0.3, y: 0.4, r: 3 },
  { x: 0.54, y: 0.34, r: 3 },
]

const STRONG: ReadonlyArray<[number, number]> = [
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 4],
]
const MEDIUM: ReadonlyArray<[number, number]> = [
  [1, 2],
  [1, 4],
  [2, 3],
  [3, 4],
  [0, 15],
  [1, 13],
  [2, 8],
  [3, 7],
  [4, 6],
]
const FAINT: ReadonlyArray<[number, number]> = [
  [5, 6],
  [5, 14],
  [7, 11],
  [7, 12],
  [8, 12],
  [9, 10],
  [9, 11],
  [10, 4],
  [13, 1],
  [13, 2],
  [15, 7],
  [14, 0],
  [6, 4],
]

export function ConstellationLarge({
  width = 660,
  height = 380,
  dense = true,
  labelScale = 1,
}: Props) {
  const N: ReadonlyArray<Node> = [...QUINTET, ...ANON]
  const allEdges: ReadonlyArray<{
    e: readonly [number, number]
    op: number
    w: number
  }> = [
    ...STRONG.map((e) => ({ e, op: 0.65, w: 1.0 })),
    ...MEDIUM.map((e) => ({ e, op: 0.35, w: 0.8 })),
    ...(dense ? FAINT.map((e) => ({ e, op: 0.15, w: 0.6 })) : []),
  ]
  const px = (n: Node) => n.x * width
  const py = (n: Node) => n.y * height
  const labelSize = 10.5 * labelScale

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
      aria-hidden="true"
    >
      {allEdges.map(({ e, op, w }, i) => {
        const a = N[e[0]]
        const b = N[e[1]]
        if (a === undefined || b === undefined) return null
        return (
          <line
            key={`e${i}`}
            x1={px(a)}
            y1={py(a)}
            x2={px(b)}
            y2={py(b)}
            stroke="var(--duo-fg)"
            strokeOpacity={op}
            strokeWidth={w}
          />
        )
      })}
      {N.map((n, i) => (
        <g key={`n${i}`}>
          <circle
            cx={px(n)}
            cy={py(n)}
            r={n.r + (i < 5 ? 6 : 4)}
            fill="var(--duo-bg)"
            opacity={i < 5 ? 0.95 : 0.7}
          />
          <circle
            cx={px(n)}
            cy={py(n)}
            r={n.r}
            fill="var(--duo-fg)"
            style={
              n.hero
                ? {
                    transformOrigin: `${px(n)}px ${py(n)}px`,
                    animation: 'jzl-pulse-2 2.4s ease-in-out infinite',
                  }
                : undefined
            }
          />
        </g>
      ))}
      {QUINTET.map((n, i) => {
        const cx = px(n)
        const cy = py(n)
        let lx = cx
        let ly = cy
        let anchor: 'start' | 'middle' | 'end' = 'start'
        const offset = n.r + 10
        if (n.lp === 'right') {
          lx = cx + offset
          ly = cy + labelSize / 3
          anchor = 'start'
        } else if (n.lp === 'left') {
          lx = cx - offset
          ly = cy + labelSize / 3
          anchor = 'end'
        } else if (n.lp === 'top') {
          lx = cx
          ly = cy - offset - 2
          anchor = 'middle'
        } else if (n.lp === 'bottom') {
          lx = cx
          ly = cy + offset + labelSize
          anchor = 'middle'
        }
        return (
          <text
            key={`l${i}`}
            x={lx}
            y={ly}
            fontFamily="var(--font-mono)"
            fontSize={labelSize}
            fill="var(--duo-fg)"
            opacity={n.hero ? 0.95 : 0.78}
            letterSpacing="0.04em"
            textAnchor={anchor}
          >
            {n.name}
          </text>
        )
      })}
    </svg>
  )
}
