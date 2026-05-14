import { useEffect, useState } from 'react'
import { applyTheme, resolveInitialTheme, setOverride, type Theme } from '@jazzlore/music-core'

export function useTheme(): { theme: Theme; toggle: () => void } {
  const [theme, setTheme] = useState<Theme>(() => resolveInitialTheme())
  useEffect(() => applyTheme(theme), [theme])
  const toggle = (): void => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    setOverride(next)
  }
  return { theme, toggle }
}
