// WakingState — the calm "we missed a beat / waking up" screen (design
// `ErrorState`, pass-4/5 "Error tone calm, fallback names cached locally so
// the user is never stranded").
//
// Three variants over the SAME layout:
//   - `waking`  → BFF 503 {status:"waking"} (Aura cold-paused; frozen
//                 isWaking already mapped it upstream). A polite role=status,
//                 a live retry countdown that auto-re-fires `onRetry` at zero.
//   - `error`   → a hard failure (rejection). A role=alert, no countdown,
//                 a single full-width "Try again" as the one intentional action.
//   - `offline` → a navigation that failed because the browser is offline
//                 (navigator.onLine === false at fetch-reject time). A calm
//                 role=status, no countdown, a "Back" affordance (`onBack`)
//                 that returns the reader to where they were.
//
// Either way the cached fallback names are real navigable links so the reader
// is never stranded. Reduced-motion safe: the only motion is the CSS
// `.err-mark` (clamped by the global prefers-reduced-motion block in
// components.css); the countdown is text, not animation.

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Shell } from '../../components/Shell'
import { ThemeToggleButton } from '../../components/ThemeToggleButton'
import { retryCooldownSeconds } from './retryBackoff'

export type FallbackName = { id: string; name: string }

type Props = {
  variant: 'waking' | 'error' | 'offline'
  /** Seconds until the next auto-retry (waking only; absent on hard errors). */
  retryAfter?: number
  /** Names cached from a previous successful load (never stranded). */
  fallback: FallbackName[]
  /** Re-run the failed BFF call (button + countdown-zero both call it). */
  onRetry: () => void
  /** Return the reader to where they were (offline variant only). */
  onBack?: () => void
  /**
   * Manual retries already fired in the current error episode (`error`
   * variant only). Drives the escalating Try-again cooldown so a struggling
   * backend isn't hammered — 0 = retry immediately, then 1s/2s/4s, capped 5s.
   * The page resets this to 0 on a successful load. See `retryBackoff.ts`.
   */
  retryCount?: number
}

const COPY = {
  waking: {
    mark: '∿',
    title: (
      <>
        The graph is <em>waking up.</em>
      </>
    ),
    body: "Our database auto-sleeps when it's quiet. Nobody's gone anywhere — they're all still here the moment it stirs.",
  },
  error: {
    mark: '∿',
    title: (
      <>
        We <em>missed a beat.</em>
      </>
    ),
    body: "We couldn't load this just now. Nobody's gone anywhere — try again in a moment.",
    // Small print: name the failure plainly so the reader knows it's on us, not
    // something they did. (Only the hard-error variant carries this.)
    tech: 'Technical error on our end — the server didn’t respond just now.',
  },
  offline: {
    mark: '∿',
    title: (
      <>
        Couldn’t load this — <em>you’re offline.</em>
      </>
    ),
    body: "You're not connected to the internet right now. Anyone you've already opened is still here.",
  },
} as const

function nowUtc(): string {
  return new Date().toISOString().slice(11, 19) + ' UTC'
}

export function WakingState({
  variant,
  retryAfter,
  fallback,
  onRetry,
  onBack,
  retryCount = 0,
}: Props) {
  const c = COPY[variant]
  const showCountdown = variant === 'waking' && typeof retryAfter === 'number'
  const [remaining, setRemaining] = useState(retryAfter ?? 0)
  // Escalating cooldown on the hard-error Try-again button (other variants are
  // never throttled). Fixed for this mount — the screen remounts fresh per
  // retry with the next retryCount — so it's a one-shot countdown to zero.
  const cooldown = variant === 'error' ? retryCooldownSeconds(retryCount) : 0
  const [cooldownLeft, setCooldownLeft] = useState(cooldown)
  // Lazy state, not a ref: computed once at mount, stable across renders, and
  // safe to read during render (a ref's `.current` is not — react-hooks/refs).
  const [checkedAt] = useState(nowUtc)
  const retryRef = useRef(onRetry)
  // Keep the interval's retry callback fresh without a render-phase ref write.
  useEffect(() => {
    retryRef.current = onRetry
  }, [onRetry])

  // Tick the countdown once a second; at zero, auto-retry exactly once. The
  // interval clears itself so a stale tick can't double-fire after unmount.
  useEffect(() => {
    if (!showCountdown) return
    // Legitimate reset-on-dep-change: a fresh 503 carries a new retryAfter
    // and the countdown must restart from it (mirrors the documented
    // setState-in-effect in hooks/useMusicianData.ts).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRemaining(retryAfter ?? 0)
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id)
          retryRef.current()
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [showCountdown, retryAfter])

  // Tick the manual-retry cooldown down to zero, then re-enable the button.
  // Unlike the waking countdown this NEVER auto-fires — it only gates how soon
  // the reader may click again. `cooldown` is fixed for this mount, so the
  // effect runs once and self-clears.
  useEffect(() => {
    if (cooldown <= 0) return
    const id = setInterval(() => {
      setCooldownLeft((s) => {
        if (s <= 1) {
          clearInterval(id)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [cooldown])

  return (
    <Shell>
      <header className="hdr">
        <div className="hdr-row">
          <div className="brand">
            Jazz<b>lore</b> · Musicians
          </div>
          <div className="spacer" />
          <ThemeToggleButton />
        </div>
      </header>

      <main>
        <section
          className="err"
          role={variant === 'error' ? 'alert' : 'status'}
          aria-live={variant === 'error' ? 'assertive' : 'polite'}
        >
          <div className="err-mark" aria-hidden="true">
            {c.mark}
          </div>
          <h1>{c.title}</h1>
          <p>{c.body}</p>
          {'tech' in c && <p className="err-tech">{c.tech}</p>}

          <div className="actions">
            {variant === 'offline' && onBack && (
              <button type="button" className="btn" onClick={onBack}>
                Back
              </button>
            )}
            <button
              type="button"
              className={variant === 'offline' ? 'btn alt' : 'btn'}
              onClick={onRetry}
              disabled={cooldownLeft > 0}
            >
              {/* Accessible name stays "Try again"; the live "· Ns" suffix is
                  aria-hidden so the role=alert region doesn't re-announce it
                  every second. The `disabled` state conveys the wait to AT. */}
              Try again
              {cooldownLeft > 0 && (
                <span className="btn-cd" aria-hidden="true">
                  {' '}
                  · {cooldownLeft}s
                </span>
              )}
            </button>
          </div>

          <div className="meta">
            checked {checkedAt}
            {showCountdown && ` · retry in ${remaining}s`}
          </div>

          {fallback.length > 0 && (
            <div className="fallback">
              <div className="fallback-h">Or read offline</div>
              <p className="fallback-list">
                {fallback.map((m, i) => (
                  <span key={m.id}>
                    <Link to={`/musicians/${encodeURIComponent(m.id)}`}>
                      {m.name}
                    </Link>
                    {i < fallback.length - 1 ? ' · ' : ' '}
                  </span>
                ))}
                — cached locally from your last visit.
              </p>
            </div>
          )}
        </section>
      </main>
    </Shell>
  )
}
