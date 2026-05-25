import { OpenCta } from '../components/OpenCta'
import { TileChrome } from '../components/TileChrome'
import { ChordDotsStaff } from '../marks/ChordDotsStaff'

type Props = {
  variant: 'desktop' | 'mobile'
}

const HREF = 'https://chords.jazzlore.com'

export function ChordsTile({ variant }: Props) {
  const big = variant === 'desktop'
  return (
    <a
      href={HREF}
      className="jzl-tile jzl-tile-small"
      data-variant={variant}
      rel="noopener"
    >
      <TileChrome
        title="Chords"
        sub={big ? 'chords.jazzlore.com' : null}
      />
      <div className="jzl-small-body">
        <div className="jzl-small-title jzl-chords-title">
          <div className="jzl-small-title-main jzl-chords-title-main">
            C<span className="jzl-chords-m">m</span>7
            <span className="jzl-chords-flat5">♭5</span>
          </div>
          {big ? (
            <div className="jzl-small-title-sub jzl-chords-sub">
              half-diminished
            </div>
          ) : null}
        </div>
        <div className="jzl-chords-strip">
          <ChordDotsStaff
            width={big ? 354 : 80}
            height={big ? 56 : 36}
            compact={!big}
          />
        </div>
        <div className="jzl-small-foot">
          {big ? (
            <span className="jzl-small-caption">voicings · two notations</span>
          ) : (
            <span />
          )}
          <OpenCta />
        </div>
      </div>
    </a>
  )
}
