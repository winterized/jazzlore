import { useRef, useState } from 'react'
import { tempoName } from '../../lib/tempo'
import type { Status } from '../state/metronomeReducer'

interface BpmHeroProps {
  bpm: number
  bpmEditing: boolean
  status: Status
  onEditStart: () => void
  onEditCommit: (bpm: number) => void
  onEditCancel: () => void
}

/** The BPM hero: giant Geist-Mono number, italic Italian tempo name, and a
 *  pulse dot that animates on every beat (driven via DOM by the page's
 *  engine ref — see pages/MetronomePage.tsx).
 *
 *  Editing flow: the off-screen <input> is ALWAYS mounted — invisibly
 *  positioned over the giant number via the .bpm-num-input CSS (transparent
 *  color + caret). When the user taps the number, the click handler
 *  synchronously calls inputRef.current.focus() INSIDE the gesture — iOS
 *  pops the virtual keyboard only when focus is tied to a still-active
 *  touch; deferring focus to a useEffect (as an earlier draft did) shows
 *  the caret but not the keyboard, requiring a second tap. */
export function BpmHero({
  bpm,
  bpmEditing,
  status,
  onEditStart,
  onEditCommit,
  onEditCancel,
}: BpmHeroProps) {
  const running = status === 'running'
  const inputRef = useRef<HTMLInputElement | null>(null)
  // The user-typed digits while editing. Mirrors what's visible in the
  // giant number (via the `{bpmEditing ? draft || bpm : bpm}` render below)
  // so the user sees what they're typing in real time.
  const [draft, setDraft] = useState<string>('')

  const startEdit = (): void => {
    if (bpmEditing) return
    // Reset the draft IN THE EVENT HANDLER (not in a useEffect) — keeps
    // the react-hooks/set-state-in-effect lint quiet AND ensures the
    // next render shows the giant BPM number as the placeholder (since
    // `draft || bpm` falls back to bpm when draft is the empty string).
    setDraft('')
    inputRef.current?.focus()
    onEditStart()
  }

  const commit = (): void => {
    if (draft === '') {
      onEditCancel()
      return
    }
    const parsed = Number.parseInt(draft, 10)
    if (Number.isNaN(parsed)) {
      onEditCancel()
      return
    }
    onEditCommit(parsed)
  }

  return (
    <div className="bpm-hero">
      <div className="pre">{running ? 'Now playing' : 'Tempo'}</div>
      {/* Wrapper is the positioned container; the input is a SIBLING of
          .bpm-num (not a child) so we don't nest an interactive inside a
          role=button — axe flags that as both 'nested-interactive' and
          'no-focusable-content'. The input has pointer-events: none in
          theme.css so taps pass through to .bpm-num; programmatic
          .focus() still works regardless of pointer-events. */}
      <div className="bpm-num-wrap">
        <div
          className="bpm-num"
          onClick={!bpmEditing ? startEdit : undefined}
          role={!bpmEditing ? 'button' : undefined}
          tabIndex={bpmEditing ? -1 : 0}
          aria-label={bpmEditing ? undefined : `BPM ${bpm}, click or press Enter to edit`}
          onKeyDown={(e) => {
            if (!bpmEditing && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault()
              startEdit()
            }
          }}
        >
          {bpmEditing ? draft || bpm : bpm}
          {bpmEditing && <span className="edit-caret" aria-hidden />}
        </div>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={draft}
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className="bpm-num-input"
          aria-label="Edit BPM"
          aria-hidden={!bpmEditing}
          tabIndex={bpmEditing ? 0 : -1}
          onChange={(e) => {
            const cleaned = e.target.value.replace(/[^0-9]/g, '').slice(0, 3)
            setDraft(cleaned)
          }}
          onBlur={bpmEditing ? commit : undefined}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commit()
            } else if (e.key === 'Escape') {
              e.preventDefault()
              onEditCancel()
            }
          }}
        />
      </div>
      <div className="lab">
        BPM<b>{tempoName(bpm)}</b>
      </div>
      {running && <div className="pulse" data-pulse-target />}
    </div>
  )
}
