// ConnRow — the spine of the detail page (design `ConnRow`, 88px min).
//
// The card that lets the user make an informed tap: who, what they play, the
// strongest shared record, the count, quick-listen. The full row navigates to
// the collaborator's detail page; the two listen buttons go to Spotify/Apple
// in a new tab (design "Connection card · anatomy"). Aria-label is verbatim
// per the design contract:
//   `${name} ${inst} ${count} records, most ${topRecord} ${year}`.
// Color is never the sole signal — instrument + relationship text is always
// present.
//
// Wave 1 / PR4a (audit Quality #15): the row's link target is a real <a>
// so cmd-click / right-click / copy-link-address all work. To avoid a
// nested-anchor invalid-HTML (the inner Spotify/Apple links are also <a>),
// the row's <a> uses `display: contents` — it carries the navigation
// semantics without claiming a grid cell, so the existing 3-column grid
// (duo3 64px | text 1fr | conn-act auto) stays unchanged. `display: contents`
// is accessibility-correct in WebKit 16.4+ / Chrome M105+ / Firefox 117+.

import type { MouseEvent } from 'react'
import type { Collaborator } from '../lib/types'
import type { MusicianMinimal } from '../hooks/useMusicianData'
import { spotifyMusicianUrl, appleMusicMusicianUrl } from '../lib/links'
import { Duo3 } from './Duo3'
import { SpotifyIcon, AppleIcon } from './icons'

type Props = {
  c: Collaborator
  pulse?: boolean
  /** Full-row activation (navigate to the collaborator's detail page). */
  onActivate?: (id: string) => void
  /** Optional handler for the "+N more" affordance. When supplied, the
   * "+N more" indicator becomes a `<button>` that opens the shared-records
   * sheet. When omitted, it renders as a plain `<span>` (backward-compat
   * for tests and fixtures that don't wire the sheet). */
  onShowSharedRecords?: (collabId: string) => void
  /** Optional portrait from the batch byIds fetch. When provided, renders the
   * real photo via Duo3 instead of the monogram-only fallback. */
  portrait?: MusicianMinimal
}

// Verbatim per the design contract (README "Connection card · anatomy"):
//   `${name} ${inst} ${count} records, most ${topRecord} ${year}`
// — note the literal comma before "most".
function ariaLabel(c: Collaborator): string {
  const head = [c.name, c.instrument].filter(Boolean).join(' ')
  const count = `${c.sharedRecordCount} record${c.sharedRecordCount === 1 ? '' : 's'}`
  if (!c.topRecord) return `${head} ${count}`.trim()
  const top = `most ${c.topRecord.title}${c.topRecord.year ? ` ${c.topRecord.year}` : ''}`
  return `${head} ${count}, ${top}`.trim()
}

export function ConnRow({
  c,
  pulse,
  onActivate,
  onShowSharedRecords,
  portrait,
}: Props) {
  // Listen buttons must not bubble to the row's <a> (design "Listen buttons
  // stop propagation"). They are real links that open Spotify/Apple in a new
  // tab — cmd-click etc. still works on them since they're proper anchors.
  const stop = (e: MouseEvent): void => e.stopPropagation()

  const role = c.instrument
    ? `${c.instrument}${c.relationship ? ` · ${c.relationship}` : ''}`
    : c.relationship

  return (
    <div
      className={`conn${pulse ? ' pulse' : ''}`}
      data-collab-id={c.id}
    >
      <a
        className="conn-link"
        href={`/musicians/${encodeURIComponent(c.id)}`}
        aria-label={ariaLabel(c)}
        onClick={(e) => {
          // Preserve native browser gestures — cmd/ctrl/shift-click (new
          // tab/window), Firefox alt-click ("Save link as…"), and
          // middle-click. Only intercept the plain left-click for SPA nav.
          // Keyboard activation is Enter-only (real anchor convention;
          // Space scrolls the page per the platform contract — was
          // Enter+Space on the prior <div role=link> shape).
          if (
            e.metaKey ||
            e.ctrlKey ||
            e.shiftKey ||
            e.altKey ||
            e.button !== 0
          )
            return
          e.preventDefault()
          onActivate?.(c.id)
        }}
      >
        <Duo3
          name={c.name}
          photo={portrait !== undefined ? portrait.photo : c.photo}
          portrait={portrait?.portrait}
          inst={c.instrument ?? null}
        />
        <div>
          <div className="nm">{c.name}</div>
          {role && <div className="role">{role}</div>}
          <div className="why">
            {c.topRecord ? (
              <>
                <span className="top">
                  Most:{' '}
                  <span className="t">&ldquo;{c.topRecord.title}&rdquo;</span>
                  {c.topRecord.year
                    ? ` '${String(c.topRecord.year).slice(-2)}`
                    : ''}
                </span>
                {c.sharedRecordCount > 1 &&
                  (onShowSharedRecords ? (
                    <button
                      type="button"
                      className="ct ct-btn"
                      aria-label={`View all ${c.sharedRecordCount} records with ${c.name}`}
                      onClick={(e) => {
                        // Swallow the click before the row's <a> SPA-nav
                        // observes it (same pattern as the Spotify/Apple
                        // icons below). preventDefault keeps any default
                        // anchor activation from running too.
                        e.stopPropagation()
                        e.preventDefault()
                        onShowSharedRecords(c.id)
                      }}
                    >
                      +{c.sharedRecordCount - 1} more
                    </button>
                  ) : (
                    <span className="ct">+{c.sharedRecordCount - 1} more</span>
                  ))}
              </>
            ) : (
              <span className="rel">
                {c.relationship ?? 'No record details on file'}
              </span>
            )}
          </div>
        </div>
      </a>
      <div className="conn-act">
        <a
          className="ic"
          href={spotifyMusicianUrl(c.name)}
          target="_blank"
          rel="noreferrer"
          aria-label={`Listen to ${c.name} on Spotify`}
          onClick={stop}
        >
          <SpotifyIcon />
        </a>
        <a
          className="ic"
          href={appleMusicMusicianUrl(c.name)}
          target="_blank"
          rel="noreferrer"
          aria-label={`Listen to ${c.name} on Apple Music`}
          onClick={stop}
        >
          <AppleIcon />
        </a>
      </div>
    </div>
  )
}
