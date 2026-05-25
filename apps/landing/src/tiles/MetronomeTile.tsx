import { OpenCta } from '../components/OpenCta'
import { TileChrome } from '../components/TileChrome'
import { MetronomeBeatMini } from '../marks/MetronomeBeatMini'

type Props = {
  variant: 'desktop' | 'mobile'
}

const HREF = 'https://metronome.jazzlore.com'

export function MetronomeTile({ variant }: Props) {
  const big = variant === 'desktop'
  return (
    <a
      href={HREF}
      className="jzl-tile jzl-tile-small"
      data-variant={variant}
      rel="noopener"
    >
      <TileChrome
        title="Metronome"
        sub={big ? 'metronome.jazzlore.com' : null}
      />
      <div className="jzl-small-body">
        <div className="jzl-metro-reading">
          <div className="jzl-metro-reading-text">
            <div className="jzl-metro-bpm">
              <span className="jzl-metro-bpm-num">96</span>
              <span className="jzl-metro-bpm-unit">bpm</span>
            </div>
            <div className="jzl-metro-meter">
              <span>4/4</span>
              {big ? (
                <>
                  <span className="jzl-metro-meter-sep" aria-hidden="true" />
                  <span>♩ stable</span>
                </>
              ) : null}
            </div>
          </div>
          <div className="jzl-metro-pendulum">
            <MetronomeBeatMini size={big ? 96 : 60} />
          </div>
        </div>
        <div className="jzl-small-foot">
          <div className="jzl-metro-beats" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="jzl-metro-beat-dot"
                style={{ animationDelay: `${i * 0.3}s` }}
              />
            ))}
          </div>
          <OpenCta />
        </div>
      </div>
    </a>
  )
}
