import type { Theme } from '@jazzlore/music-core'
import { MoonIcon, SunIcon } from './icons'
import { StatusPill } from './StatusPill'
import type { Status } from '../state/metronomeReducer'

interface HeaderProps {
  theme: Theme
  status: Status
  onToggleTheme: () => void
}

/** Sticky translucent header: `jazzlore / metronome` wordmark · status pill ·
 *  theme toggle. The theme toggle is an app-local .ic icon button — the
 *  workspace-frozen @jazzlore/ui ThemeToggle is intentionally NOT imported
 *  here (per workspace memory). The hook contract is identical: toggle()
 *  routes through music-core's applyTheme + setOverride. */
export function Header({ theme, status, onToggleTheme }: HeaderProps) {
  return (
    <div className="hdr">
      <div className="brand">
        <b>jazzlore</b>
        <span className="div">/</span>
        <span className="sub">metronome</span>
      </div>
      <div className="spc" />
      <StatusPill status={status} />
      <button
        type="button"
        className="ic"
        onClick={onToggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        style={{ marginLeft: 8 }}
      >
        {theme === 'dark' ? <SunIcon size={15} /> : <MoonIcon size={15} />}
      </button>
    </div>
  )
}
