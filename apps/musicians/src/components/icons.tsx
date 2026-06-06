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

// SpotifyIcon / AppleIcon (hand-drawn approximations) were removed in the
// brand-compliance work — both listen surfaces now use the official Apple
// Music + Spotify artwork vendored at public/brand-assets.

export function HomeIcon({ size = 15 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2.5 7.5 8 2.75l5.5 4.75" />
      <path d="M3.75 6.75V13h8.5V6.75" />
      <path d="M6.5 13V9.25h3V13" />
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
