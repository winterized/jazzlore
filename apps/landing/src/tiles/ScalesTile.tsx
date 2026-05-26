import { OpenCta } from '../components/OpenCta'
import { TileChrome } from '../components/TileChrome'
import { ScaleStaffMini } from '../marks/ScaleStaffMini'

type Props = {
  variant: 'desktop' | 'mobile'
}

const HREF = 'https://scales.jazzlore.com'

export function ScalesTile({ variant }: Props) {
  const big = variant === 'desktop'
  return (
    <a
      href={HREF}
      className="jzl-tile jzl-tile-small"
      data-variant={variant}
      rel="noopener"
    >
      <TileChrome
        title="Scales"
        sub={big ? 'scales.jazzlore.com' : null}
        iconColor="#6f8caa"
      />
      <div className="jzl-small-body">
        <div className="jzl-small-title">
          <div className="jzl-small-title-main">
            {big ? 'Lydian Dominant' : 'Lydian Dom.'}
          </div>
          {big ? (
            <div className="jzl-small-title-sub">C · Mixolydian ♯11</div>
          ) : null}
        </div>
        <div className="jzl-scales-strip">
          <ScaleStaffMini
            width={big ? 300 : 70}
            height={big ? 40 : 24}
          />
          <span className="jzl-scales-play" aria-hidden="true">
            <span className="jzl-scales-play-arrow">▶</span>
          </span>
        </div>
        <div className="jzl-small-foot">
          {big ? (
            <span className="jzl-small-caption">
              38 modes · notation · audio
            </span>
          ) : (
            <span />
          )}
          <OpenCta />
        </div>
      </div>
    </a>
  )
}
