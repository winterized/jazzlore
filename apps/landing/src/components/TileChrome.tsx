type Props = {
  title: string
  sub?: string | null
  /** Per-app dot color — the inner colored circle of the chrome icon.
   *  Matches the surface's home-screen / favicon master so the landing
   *  tile is visually continuous with the deep-link target. Drawn on a
   *  dark rounded-square background identical to the master SVGs. */
  iconColor: string
}

export function TileChrome({ title, sub, iconColor }: Props) {
  return (
    <div className="jzl-tile-chrome">
      <div className="jzl-tile-chrome-left">
        <svg
          className="jzl-tile-chrome-icon"
          viewBox="0 0 512 512"
          aria-hidden="true"
          focusable="false"
        >
          <rect width="512" height="512" rx="72" fill="#0a0a0a" />
          <circle
            className="jzl-tile-chrome-icon-dot"
            cx="256"
            cy="256"
            r="112"
            fill={iconColor}
          />
        </svg>
        <span className="jzl-tile-chrome-title">{title}</span>
      </div>
      {sub ? <span className="jzl-tile-chrome-sub">{sub}</span> : null}
    </div>
  )
}
