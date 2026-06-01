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
