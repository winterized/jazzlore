// Inline icons — ported verbatim from the Claude Design pass-5 `I3` set
// (docs/source/app/musicians3-shared.jsx). Sized to the current font;
// decorative (aria-hidden) since every control carries a text accessible
// name elsewhere.

type IconProps = { size?: number }

export function SearchIcon({ size = 14 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <circle cx="7" cy="7" r="4.5" />
      <path d="m11 11 3 3" strokeLinecap="round" />
    </svg>
  )
}

export function SpotifyIcon({ size = 11 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M5 6q3-1 6 .5M5 8q3-1 6 .5M5 10q2-.7 5 .3"
        stroke="currentColor"
        strokeWidth="1.1"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function AppleIcon({ size = 11 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M11.2 8.5c0-1.8 1.5-2.6 1.5-2.6-.8-1.2-2.1-1.4-2.5-1.4-1.1-.1-2.1.6-2.6.6-.6 0-1.4-.6-2.3-.6-1.2 0-2.3.7-2.9 1.8-1.2 2.2-.3 5.4.9 7.2.6.9 1.3 1.9 2.2 1.8.9 0 1.2-.6 2.3-.6s1.4.6 2.3.5c1 0 1.6-.9 2.2-1.8.7-1 .9-2 .9-2.1 0-.1-1.8-.7-1.8-2.8ZM9.8 3.2c.5-.6.8-1.4.7-2.2-.7 0-1.6.5-2 1.1-.5.5-.9 1.4-.8 2.1.8.1 1.6-.4 2.1-1Z" />
    </svg>
  )
}

export function ChevronIcon({ size = 10 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden="true"
    >
      <path d="m6 4 4 4-4 4" strokeLinecap="round" />
    </svg>
  )
}
