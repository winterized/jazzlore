// ThemeToggleButton — reuses the `@jazzlore/ui` ThemeToggle (the only shared
// UI reuse here, per the architecture) wired to the app's frozen
// `useTheme()` (src/lib/useTheme.ts — applyTheme/setOverride on <html>,
// driving the frozen token layer). D8.

import { ThemeToggle } from '@jazzlore/ui'
import { useTheme } from '../lib/useTheme'

export function ThemeToggleButton() {
  const { theme, toggle } = useTheme()
  return <ThemeToggle theme={theme} onToggle={toggle} />
}
