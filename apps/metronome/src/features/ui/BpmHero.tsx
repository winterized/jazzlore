import { useEffect, useRef, useState } from 'react'
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

interface BpmEditInputProps {
  onCommit: (bpm: number) => void
  onCancel: () => void
  onDraftChange: (draft: string) => void
}

/** The off-screen <input> that captures the iOS virtual keyboard and the
 *  user's typed digits. Mounts ONLY while `bpmEditing` is true — this is
 *  how the draft state resets between edit sessions without a
 *  setState-in-effect anti-pattern (each new edit session = fresh mount =
 *  fresh empty draft). Per CLAUDE.md item 10: font-size 16 px,
 *  autoCorrect/autoCapitalize off, spellCheck=false, inputMode=numeric. */
function BpmEditInput({ onCommit, onCancel, onDraftChange }: BpmEditInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [draft, setDraft] = useState<string>('')

  useEffect(() => {
    // Focus after mount so the iOS keyboard pops up.
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [])

  const commit = (): void => {
    if (draft === '') {
      onCancel()
      return
    }
    const parsed = Number.parseInt(draft, 10)
    if (Number.isNaN(parsed)) {
      onCancel()
      return
    }
    onCommit(parsed)
  }

  return (
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
      onChange={(e) => {
        const cleaned = e.target.value.replace(/[^0-9]/g, '').slice(0, 3)
        setDraft(cleaned)
        onDraftChange(cleaned)
      }}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          commit()
        } else if (e.key === 'Escape') {
          e.preventDefault()
          onCancel()
        }
      }}
    />
  )
}

/** The BPM hero: giant Geist-Mono number, italic Italian tempo name, and a
 *  pulse dot that animates on every beat (driven via DOM by the page's
 *  engine ref — see pages/MetronomePage.tsx, PR 2).
 *
 *  Editing flow: clicking the number sets `bpmEditing: true`. The
 *  BpmEditInput sub-component mounts on top of the visible number, captures
 *  the iOS virtual keyboard, and commits on Enter / blur. Esc cancels. */
export function BpmHero({
  bpm,
  bpmEditing,
  status,
  onEditStart,
  onEditCommit,
  onEditCancel,
}: BpmHeroProps) {
  const running = status === 'running'
  // The displayed digits while typing — mirrors the BpmEditInput's draft so
  // the visible giant number echoes what the user is typing.
  const [displayedDraft, setDisplayedDraft] = useState<string>('')

  return (
    <div className="bpm-hero">
      <div className="pre">{running ? 'Now playing' : 'Tempo'}</div>
      <div
        className="bpm-num"
        onClick={() => !bpmEditing && onEditStart()}
        role="button"
        tabIndex={bpmEditing ? -1 : 0}
        aria-label={`BPM ${bpm}, click or press Enter to edit`}
        onKeyDown={(e) => {
          if (!bpmEditing && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            onEditStart()
          }
        }}
      >
        {bpmEditing ? displayedDraft || bpm : bpm}
        {bpmEditing && <span className="edit-caret" aria-hidden />}
        {bpmEditing && (
          <BpmEditInput
            onCommit={(b) => {
              // Clear the parent's draft mirror BEFORE flipping bpmEditing
              // off — otherwise the next edit session briefly renders the
              // previous typed string until the first keystroke (e.g. user
              // types "999" → commits as clamped 240 → re-opens → hero
              // momentarily shows "999" instead of "240").
              setDisplayedDraft('')
              onEditCommit(b)
            }}
            onCancel={() => {
              setDisplayedDraft('')
              onEditCancel()
            }}
            onDraftChange={setDisplayedDraft}
          />
        )}
      </div>
      <div className="lab">
        BPM<b>{tempoName(bpm)}</b>
      </div>
      {running && <div className="pulse" data-pulse-target />}
    </div>
  )
}
