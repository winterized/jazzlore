/* Metronome-tile mark — just the pendulum, big. Anchored at bottom-
   center, swings via jzl-swing. */

type Props = {
  size?: number
}

export function MetronomeBeatMini({ size = 110 }: Props) {
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      style={{ display: 'block' }}
      aria-hidden="true"
    >
      <g
        style={{
          transformOrigin: `${size / 2}px ${size - 6}px`,
          animation: 'jzl-swing 1.0s ease-in-out infinite',
        }}
      >
        <line
          x1={size / 2}
          y1={size - 6}
          x2={size / 2}
          y2={14}
          stroke="var(--duo-fg)"
          strokeWidth="2"
        />
        <rect
          x={size / 2 - 6}
          y={36}
          width="12"
          height="9"
          fill="var(--duo-fg)"
        />
        <circle cx={size / 2} cy={14} r="4.5" fill="var(--duo-fg)" />
      </g>
    </svg>
  )
}
