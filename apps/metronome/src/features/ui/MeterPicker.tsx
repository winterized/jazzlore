import { BEATS_MIN, BEATS_MAX } from '../../lib/pattern'

interface MeterPickerProps {
  beats: number
  onSelect: (beats: number) => void
}

/** Six buttons (2…7) for selecting beats per bar. The active button gets
 *  `.on` (amber fill, accent-fg text). Numbers `1` and `8+` are intentionally
 *  out of range — the spec is 2..7. */
export function MeterPicker({ beats, onSelect }: MeterPickerProps) {
  const options: number[] = []
  for (let n = BEATS_MIN; n <= BEATS_MAX; n++) options.push(n)
  return (
    <>
      <div className="sec-h">
        <span>Beats per bar</span>
        <span className="meta">{beats} / 4</span>
      </div>
      <div className="meter" role="radiogroup" aria-label="Beats per bar">
        {options.map((n) => {
          const selected = n === beats
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={selected}
              className={selected ? 'on' : ''}
              onClick={() => onSelect(n)}
            >
              {n}
            </button>
          )
        })}
      </div>
    </>
  )
}
