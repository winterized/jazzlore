import { useEffect, useState } from 'react'
import { read, write } from '../../lib/storage'

type Density = 1 | 2 | 3
const KEY = 'scales-print:v1'

function readDensity(): Density {
  const v = read<Density>(KEY)
  return v === 1 || v === 2 || v === 3 ? v : 2
}

export default function PrintDensity() {
  const [density, setDensity] = useState<Density>(readDensity)
  useEffect(() => {
    document.documentElement.style.setProperty('--print-columns', String(density))
    document.documentElement.setAttribute('data-density', String(density))
  }, [density])

  const choose = (d: Density): void => {
    setDensity(d)
    write(KEY, d)
  }

  return (
    <fieldset className="flex items-center gap-3 text-sm">
      <legend className="sr-only">Print density</legend>
      {([1, 2, 3] as const).map((d) => (
        <label key={d} className="flex items-center gap-1">
          <input
            type="radio"
            name="density"
            value={d}
            checked={density === d}
            onChange={() => choose(d)}
          />
          {d} per row
        </label>
      ))}
    </fieldset>
  )
}
