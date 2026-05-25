import { ThemeToggle } from '@jazzlore/ui'
import { useTheme } from '../lib/useTheme'

type Props = {
  onAboutClick: () => void
}

export function Header({ onAboutClick }: Props) {
  const { theme, toggle } = useTheme()
  return (
    <header className="jzl-header">
      {/* Visually-hidden h1 satisfies axe page-has-heading-one without
          disturbing the visual hierarchy (the wordmark below renders as
          its banner-style label). Sits inside <header> so it counts as
          part of the banner landmark — keeping it outside would trip the
          region rule. */}
      <h1 className="sr-only">Jazzlore — A jazz musician's workbench</h1>
      <div className="jzl-wordmark">
        <span className="jzl-wordmark-dot" aria-hidden="true" />
        <span className="jzl-wordmark-name">Jazzlore</span>
        <span className="jzl-wordmark-tag">a workbench</span>
      </div>
      <div className="jzl-header-right">
        <button
          type="button"
          className="jzl-about-btn"
          onClick={onAboutClick}
        >
          About
        </button>
        <ThemeToggle theme={theme} onToggle={toggle} />
      </div>
    </header>
  )
}
