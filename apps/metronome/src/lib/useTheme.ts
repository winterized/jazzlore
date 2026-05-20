import { useEffect, useState } from 'react'
import {
  applyTheme,
  resolveInitialTheme,
  setOverride,
  type Theme,
} from '@jazzlore/music-core'

/**
 * App-local theme hook. Mirrors apps/scales/src/lib/useTheme.ts, routed
 * through @jazzlore/music-core's primitives so the entire portfolio shares
 * one source of truth for the theme override.
 *
 * `@jazzlore/ui`'s ThemeToggle is frozen workspace-wide (per the workspace
 * memory), so the metronome's header renders its own `.ic` icon button that
 * invokes this hook's `toggle()`. The hook persists the override and applies
 * the new theme via the data-theme attribute on `<html>` so the .mt scope's
 * light/dark token override fires immediately.
 */
export function useTheme(): { theme: Theme; toggle: () => void } {
  const [theme, setTheme] = useState<Theme>(() => resolveInitialTheme())

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const toggle = (): void => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    setOverride(next)
  }

  return { theme, toggle }
}
