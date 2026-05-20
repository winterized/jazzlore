// Inline SVG icons — single source. Each is purely presentational.
// Matches the icon-decision picks in
// apps/metronome/docs/design_handoff_metronome/app/metronome-readme.jsx.

interface IconProps {
  size?: number
  className?: string
  'aria-hidden'?: boolean
}

export function PlayIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <path d="M7.5 5.5 L19 12 L7.5 18.5 Z" fill="currentColor" />
    </svg>
  )
}

export function StopIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <rect x="6.5" y="6.5" width="11" height="11" rx="1.5" fill="currentColor" />
    </svg>
  )
}

export function SunIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="3.6" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.5 1.5M16.9 16.9l1.5 1.5M5.6 18.4l1.5-1.5M16.9 7.1l1.5-1.5" />
    </svg>
  )
}

export function MoonIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M20 14.5A8 8 0 1 1 9.5 4 A6.5 6.5 0 0 0 20 14.5Z" />
    </svg>
  )
}
