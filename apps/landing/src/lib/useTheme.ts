import { useEffect, useState } from 'react'
import {
  applyTheme,
  resolveInitialTheme,
  setOverride,
  type Theme,
} from '@jazzlore/music-core'

export function useTheme(): { theme: Theme; toggle: () => void } {
  const [theme, setTheme] = useState<Theme>(() => resolveInitialTheme())
  useEffect(() => applyTheme(theme), [theme])
  const toggle = (): void => {
    // Functional updater — captures the freshest state under React 19
    // StrictMode double-render. setOverride runs after the queued update
    // settles by reading the same flipped value (synchronous derivation).
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark'
      setOverride(next)
      return next
    })
  }
  return { theme, toggle }
}
