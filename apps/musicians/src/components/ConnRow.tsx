// ConnRow — the spine of the detail page (design `ConnRow`, 88px min).
//
// The card that lets the user make an informed tap: who, what they play, the
// strongest shared record, the count, quick-listen. Entire row tappable; the
// two listen buttons stop propagation (design "Connection card · anatomy").
// Aria-label is verbatim per the design contract:
//   `${name} ${inst} ${count} records, most ${topRecord} ${year}`.
// Color is never the sole signal — instrument + relationship text is always
// present.

import type { KeyboardEvent, MouseEvent } from 'react'
import type { Collaborator } from '../lib/types'
import { spotifyMusicianUrl, appleMusicMusicianUrl } from '../lib/links'
import { Duo3 } from './Duo3'
import { SpotifyIcon, AppleIcon } from './icons'

type Props = {
  c: Collaborator
  pulse?: boolean
  /** Full-row activation (navigate to the collaborator's detail page). */
  onActivate?: (id: string) => void
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

export function ConnRow({ c, pulse, onActivate }: Props) {
  const activate = (): void => onActivate?.(c.id)
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      activate()
    }
  }
  // Listen buttons must not bubble to the row (design "Listen buttons stop
  // propagation"). They are real links (deep-link, open in a new tab).
  const stop = (e: MouseEvent): void => e.stopPropagation()

  const role = c.instrument
    ? `${c.instrument}${c.relationship ? ` · ${c.relationship}` : ''}`
    : c.relationship

  return (
    <div
      className={`conn${pulse ? ' pulse' : ''}`}
      data-collab-id={c.id}
      role="link"
      tabIndex={0}
      aria-label={ariaLabel(c)}
      onClick={activate}
      onKeyDown={onKeyDown}
    >
      <Duo3 name={c.name} photo={c.photo} />
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
              {c.sharedRecordCount > 1 && (
                <span className="ct">+{c.sharedRecordCount - 1} more</span>
              )}
            </>
          ) : (
            <span className="rel">
              {c.relationship ?? 'No record details on file'}
            </span>
          )}
        </div>
      </div>
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
