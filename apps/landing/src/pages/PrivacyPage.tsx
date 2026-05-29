import { ThemeToggle } from '@jazzlore/ui'
import { Footer } from '../components/Footer'
import { useTheme } from '../lib/useTheme'

// Human, anti-template privacy copy. The whole point of this page is that a
// reader (or App Review) finishes it and believes there's genuinely nothing
// being collected — so it says exactly that, plainly, and frames the single
// backend the family has (Musicians) honestly rather than burying it.
//
// Plain <a href> back to home and out to GitHub — no client routing. Renders
// inside the shared .landing token scope so it inherits the same fonts,
// amber accent and dark theme as the home page.

const ISSUES_URL = 'https://github.com/winterized/jazzlore/issues'
const LAST_UPDATED = '29 May 2026'

export function PrivacyPage() {
  const { theme, toggle } = useTheme()
  return (
    <div className="landing">
      <header className="jzl-header">
        {/* Wordmark doubles as the link home. Full-page navigation — the
            landing bundle is tiny and this keeps the no-router promise. */}
        <a href="/" className="jzl-wordmark jzl-wordmark-link">
          <span className="jzl-wordmark-dot" aria-hidden="true" />
          <span className="jzl-wordmark-name">Jazzlore</span>
          <span className="jzl-wordmark-tag">privacy</span>
        </a>
        <div className="jzl-header-right">
          <a href="/" className="jzl-about-btn">
            Home
          </a>
          <ThemeToggle theme={theme} onToggle={toggle} />
        </div>
      </header>

      <main className="jzl-main jzl-privacy">
        <article className="jzl-privacy-article">
          <div className="jzl-privacy-eyebrow">
            <span className="jzl-privacy-eyebrow-dot" aria-hidden="true" />
            Privacy
          </div>

          {/* The summary IS the page heading — one sentence, the whole story. */}
          <h1 className="jzl-privacy-lede">
            Jazzlore apps don't collect personal data.
          </h1>
          <p className="jzl-privacy-intro">
            No accounts to make, nothing to sign in to, nothing watching you
            practise. Jazzlore is a small set of tools for jazz — scales,
            chords, a metronome, and a map of who played with whom — built by
            one person, for the love of it. This page explains, in plain
            terms, what that means for your data.
          </p>

          <section className="jzl-privacy-section">
            <h2 className="jzl-privacy-h2">What we don't do</h2>
            <ul className="jzl-privacy-list">
              <li>No accounts, logins, or profiles.</li>
              <li>No analytics — we don't measure how you use the apps.</li>
              <li>No tracking, no cookies set for following you around.</li>
              <li>No advertising and no ad networks.</li>
              <li>No telemetry or crash reporting phoning home.</li>
              <li>No third-party services collecting data about you.</li>
            </ul>
          </section>

          <section className="jzl-privacy-section">
            <h2 className="jzl-privacy-h2">The one exception, honestly</h2>
            <p className="jzl-privacy-body">
              One app, <span className="jzl-privacy-accent">Musicians</span>,
              talks to a backend — it has to, because it draws on a database
              of public information about jazz musicians and who they played
              with. When you open a musician, your device asks our server for
              that musician's public record. That request carries the
              musician's ID and nothing about you: no name, no account, no
              location, no identifier that points back to you. We don't log it
              to build a picture of anyone. The other apps — Scales, Chords,
              Metronome — don't send anything about you anywhere.
            </p>
          </section>

          <section className="jzl-privacy-section">
            <h2 className="jzl-privacy-h2">What stays on your device</h2>
            <p className="jzl-privacy-body">
              The few things the apps remember — your theme choice and other
              preferences, recently viewed items, anything you type in — live
              only in your browser or on your phone, in local storage on your
              device. They're never sent to us. Clear your browser data, or
              delete the app, and they're gone.
            </p>
          </section>

          <section className="jzl-privacy-section">
            <h2 className="jzl-privacy-h2">Questions</h2>
            <p className="jzl-privacy-body">
              Jazzlore is open source. If something here is unclear, or you
              spot something that doesn't match what you see, the best way to
              reach us is to{' '}
              <a
                href={ISSUES_URL}
                className="jzl-privacy-link"
                rel="noopener noreferrer"
              >
                open an issue on GitHub
              </a>
              . It's public, so others benefit from the answer too.
            </p>
          </section>

          <p className="jzl-privacy-updated">Last updated {LAST_UPDATED}</p>
        </article>
      </main>

      <Footer />
    </div>
  )
}
