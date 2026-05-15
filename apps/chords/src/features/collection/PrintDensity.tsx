/**
 * PrintDensity — controlled radio group for choosing print density.
 *
 * Density levels control which chord card body elements render in print:
 *   compact  — symbol + score only. ~12-15 cards per A4 page.
 *   medium   — + keyboard. ~8-10 cards per page. (default)
 *   expanded — + full name + intervals + note names. ~4-6 cards per page.
 *
 * This is a purely controlled component: parent holds the state and
 * persists it (e.g. to localStorage via music-core write()).
 */

export type PrintDensity = 'compact' | 'medium' | 'expanded'

const DENSITIES: ReadonlyArray<{ value: PrintDensity; label: string }> = [
  { value: 'compact', label: 'Compact' },
  { value: 'medium', label: 'Medium' },
  { value: 'expanded', label: 'Expanded' },
]

type Props = {
  density: PrintDensity
  onChange: (density: PrintDensity) => void
}

export default function PrintDensity({ density, onChange }: Props) {
  return (
    <fieldset className="flex items-center gap-3 text-sm">
      <legend className="sr-only">Print density</legend>
      {DENSITIES.map(({ value, label }) => (
        <label key={value} className="flex items-center gap-1">
          <input
            type="radio"
            name="chord-print-density"
            value={value}
            checked={density === value}
            onChange={() => onChange(value)}
          />
          {label}
        </label>
      ))}
    </fieldset>
  )
}
