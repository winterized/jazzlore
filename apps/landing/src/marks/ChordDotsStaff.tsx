/* Chords-tile mark — treble + 5-line staff + 4 stacked dots forming
   Cm7♭5 close voicing (C4 / E♭4 / G♭4 / B♭4). Each dot pulses on a
   0.18s stagger. Labels hidden in compact (mobile) mode. */

type Props = {
  width?: number
  height?: number
  compact?: boolean
}

export function ChordDotsStaff({
  width = 320,
  height = 64,
  compact = false,
}: Props) {
  const lineGap = Math.max(5, Math.min(8, Math.floor((height - 18) / 5)))
  const top = (height - lineGap * 4) / 2
  // Explicit 5-tuple destructure — narrower than .map() because TS infers
  // each y as `number`, sidestepping the `noUncheckedIndexedAccess` mess
  // (no `?? 0` fallbacks downstream).
  const y0 = top
  const y1 = top + lineGap
  const y2 = top + lineGap * 2
  const y3 = top + lineGap * 3
  const y4 = top + lineGap * 4
  const lineY = [y0, y1, y2, y3, y4] as const
  const cefX = Math.max(14, width * 0.06)
  const cefR = Math.min(lineGap * 0.9, 6)
  const dotX = compact ? width * 0.55 : width * 0.42
  const labelX = width - 4
  const r = Math.max(3, Math.min(4.5, lineGap * 0.55))
  const flatSize = lineGap * 1.6
  const labelSize = Math.max(8, Math.min(10.5, lineGap * 1.2))

  // C4 lives below the staff on a leger line; the rest are flat-prefixed.
  const dots = [
    { y: y4 + lineGap, flat: false, name: 'C' },
    { y: y4, flat: true, name: 'E♭' },
    { y: y3, flat: true, name: 'G♭' },
    { y: y2, flat: true, name: 'B♭' },
  ]

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
      aria-hidden="true"
    >
      {lineY.map((y, i) => (
        <line
          key={i}
          x1={cefX + 12}
          y1={y}
          x2={compact ? width - 6 : labelX - lineGap * 4}
          y2={y}
          stroke="var(--duo-fg)"
          strokeOpacity="0.5"
          strokeWidth="0.7"
        />
      ))}
      {/* Abstract treble clef — vertical stroke + circle */}
      <g
        stroke="var(--duo-fg)"
        strokeWidth="1.2"
        fill="none"
        strokeOpacity="0.65"
      >
        <line
          x1={cefX}
          y1={y0 - lineGap * 0.3}
          x2={cefX}
          y2={y4 + lineGap * 0.3}
        />
        <circle cx={cefX} cy={y3 + lineGap * 0.5} r={cefR} />
      </g>
      {/* Leger line for middle C */}
      <line
        x1={dotX - r * 2.2}
        y1={y4 + lineGap}
        x2={dotX + r * 2.2}
        y2={y4 + lineGap}
        stroke="var(--duo-fg)"
        strokeOpacity="0.55"
        strokeWidth="0.7"
      />
      {dots
        .filter((d) => d.flat)
        .map((d, i) => (
          <text
            key={`f${i}`}
            x={dotX - r * 3}
            y={d.y + r * 1.1}
            fontFamily="var(--font-serif)"
            fontSize={flatSize}
            fill="var(--duo-fg)"
            opacity="0.92"
          >
            ♭
          </text>
        ))}
      {dots.map((d, i) => (
        <circle
          key={`d${i}`}
          cx={dotX}
          cy={d.y}
          r={r}
          fill="var(--duo-fg)"
          style={{
            animation: 'jzl-pulse-soft 2.6s ease-in-out infinite',
            animationDelay: `${i * 0.18}s`,
          }}
        />
      ))}
      {!compact &&
        dots.map((d, i) => (
          <text
            key={`lb${i}`}
            x={labelX}
            y={d.y + r * 0.9}
            fontFamily="var(--font-mono)"
            fontSize={labelSize}
            fill="var(--duo-fg)"
            opacity="0.7"
            letterSpacing="0.06em"
            textAnchor="end"
          >
            {d.name}
          </text>
        ))}
    </svg>
  )
}
