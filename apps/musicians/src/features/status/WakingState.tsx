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
}: Props) {
  const c = COPY[variant]
  const showCountdown = variant === 'waking' && typeof retryAfter === 'number'
  const [remaining, setRemaining] = useState(retryAfter ?? 0)
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
            >
              Try again
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
