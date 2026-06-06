import type { Theme } from '@jazzlore/music-core'
import { InstallOrAppStoreButton } from '@jazzlore/ui'
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
      {/* The transient status pill yields below 390px so the (undistorted, fixed
          aspect-ratio) App Store badge + theme toggle always fit on smaller
          phones (iPhone SE / mini / SE3). Status is recoverable on-screen; the
          badge + toggle are persistent controls. Only the iOS-browser badge makes
          the row this wide — the native shell hides the badge entirely, so the
          status pill is unaffected in the app. */}
      <div className="max-[389px]:hidden">
        <StatusPill status={status} />
      </div>
      <div style={{ marginLeft: 8, flexShrink: 0 }}>
        <InstallOrAppStoreButton
          appStoreKey="metronome"
          appName="Metronome"
          appIconHref="/icons/icon-192.png"
          appAccent="#a06b6b"
        />
      </div>
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
