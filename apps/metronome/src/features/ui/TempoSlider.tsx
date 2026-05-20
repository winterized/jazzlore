import { BPM_MIN, BPM_MAX, CLASSIC_TEMPOS } from '../../lib/tempo'

interface TempoSliderProps {
  bpm: number
  onChange: (bpm: number) => void
}

/** 30–240 BPM slider with ticks every 10 and taller classic-tempo ticks.
 *
 *  The visible track / fill / thumb / ticks are all SVG-style absolute-
 *  positioned divs in `.slider` (see theme.css). A native `<input
 *  type="range">` sits invisibly on top of them (opacity:0) so we get:
 *    - free keyboard interaction (arrows + page up/down)
 *    - free screen-reader announcement (role="slider", min/max/value)
 *    - free touch/drag on every browser
 *  The visual styling tracks the input's value via the `bpm` prop. */
export function TempoSlider({ bpm, onChange }: TempoSliderProps) {
  const range = BPM_MAX - BPM_MIN
  const pct = ((bpm - BPM_MIN) / range) * 100

  const ticks: number[] = []
  for (let v = BPM_MIN; v <= BPM_MAX; v += 10) ticks.push(v)

  return (
    <>
      <div className="slider">
        <div className="track" aria-hidden />
        <div className="fill" style={{ width: `${pct}%` }} aria-hidden />
        {ticks.map((v) => {
          const left = ((v - BPM_MIN) / range) * 100
          const isClassic = CLASSIC_TEMPOS.includes(v as (typeof CLASSIC_TEMPOS)[number])
          return (
            <span
              key={v}
              className={`tick${isClassic ? ' classic' : ''}`}
              style={{ left: `${left}%` }}
              aria-hidden
            />
          )
        })}
        {[60, 120, 168].map((v) => {
          const left = ((v - BPM_MIN) / range) * 100
          return (
            <span key={`L${v}`} className="tick-lab" style={{ left: `${left}%` }} aria-hidden>
              {v}
            </span>
          )
        })}
        <input
          type="range"
          min={BPM_MIN}
          max={BPM_MAX}
          step={1}
          value={bpm}
          aria-label="Tempo, BPM"
          onChange={(e) => onChange(Number.parseInt(e.target.value, 10))}
        />
        <div className="thumb" style={{ left: `${pct}%` }} aria-hidden />
      </div>
      <div className="slider-foot">
        <span>{BPM_MIN}</span>
        <span style={{ color: 'var(--muted)' }}>BPM</span>
        <span>{BPM_MAX}</span>
      </div>
    </>
  )
}
