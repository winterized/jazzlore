type Props = {
  title: string
  sub?: string | null
}

export function TileChrome({ title, sub }: Props) {
  return (
    <div className="jzl-tile-chrome">
      <div className="jzl-tile-chrome-left">
        <span className="jzl-tile-chrome-dot" aria-hidden="true" />
        <span className="jzl-tile-chrome-title">{title}</span>
      </div>
      {sub ? <span className="jzl-tile-chrome-sub">{sub}</span> : null}
    </div>
  )
}
