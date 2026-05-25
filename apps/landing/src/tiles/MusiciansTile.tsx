import { OpenCta } from '../components/OpenCta'
import { TileChrome } from '../components/TileChrome'
import { ConstellationLarge } from '../marks/ConstellationLarge'

type Props = {
  variant: 'desktop' | 'mobile'
}

const HREF = 'https://musicians.jazzlore.com'

export function MusiciansTile({ variant }: Props) {
  const big = variant === 'desktop'
  return (
    <a
      href={HREF}
      className="jzl-tile jzl-tile-musicians"
      data-variant={variant}
      rel="noopener"
    >
      <TileChrome title="Musicians" sub="musicians.jazzlore.com" />
      <div className="jzl-musicians-graph">
        <ConstellationLarge
          width={big ? 640 : 320}
          height={big ? 340 : 200}
          dense={big}
        />
      </div>
      <div className="jzl-musicians-bottom">
        <div>
          <h2 className="jzl-musicians-h">Who played with whom.</h2>
          <div className="jzl-musicians-stats">
            <span>
              <strong>12,847</strong> musicians
            </span>
            <span>
              <strong>84k</strong> sessions
            </span>
            <span>
              <strong>1917–2024</strong>
            </span>
          </div>
        </div>
        <OpenCta />
      </div>
    </a>
  )
}
