type Props = {
  size?: number
  stroke?: number
}

export function ArrowOut({ size = 12, stroke = 1.2 }: Props) {
  return (
    <svg
      viewBox="0 0 12 12"
      width={size}
      height={size}
      className="jzl-arrow"
      style={{ display: 'inline-block', flex: 'none' }}
      aria-hidden="true"
    >
      <path
        d="M3 9 L9 3 M4 3 H9 V8"
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="square"
      />
    </svg>
  )
}
