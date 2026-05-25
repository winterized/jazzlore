const REPO_URL = 'https://github.com/winterized/jazzlore'

export function Footer() {
  return (
    <footer className="jzl-footer">
      <div className="jzl-footer-left">jazzlore.com · mmxxvi</div>
      <div className="jzl-footer-right">
        <a
          href={REPO_URL}
          className="jzl-footer-link"
          rel="noopener noreferrer"
        >
          Source
        </a>
        {/* Colophon is a future page (attribution + tech stack + thanks).
            Until it ships, render as a disabled button styled like a link
            so the slot is visible without lying about a destination. */}
        <button
          type="button"
          className="jzl-footer-link jzl-footer-link-disabled"
          disabled
          aria-disabled="true"
          title="Colophon coming soon"
        >
          Colophon
        </button>
      </div>
    </footer>
  )
}
