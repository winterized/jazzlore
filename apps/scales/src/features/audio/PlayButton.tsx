import { useState } from 'react'
import { audioDebugSummary, playScale, primeAudio, stopAll, unlockAudio } from '@jazzlore/music-core'

type Props = {
  notes: string[]
  ariaLabel: string
}

export default function PlayButton({ notes, ariaLabel }: Props) {
  const [loading, setLoading] = useState(false)
  const onClick = async (): Promise<void> => {
    // MUST be the first statement and run synchronously: iOS only unmutes the
    // AudioContext if resume() happens in the user-gesture task, before the
    // lazy Tone import is awaited below.
    primeAudio()
    const dbg =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).has('audiodebug')
    setLoading(true)
    try {
      stopAll()
      await unlockAudio()
      await playScale(notes)
    } finally {
      setLoading(false)
      if (dbg) window.alert(audioDebugSummary())
    }
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      aria-label={ariaLabel}
      aria-busy={loading}
      className="rounded-md border border-stone-300 bg-white px-3 py-1 text-sm hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-stone-700 dark:bg-stone-900 dark:hover:bg-stone-800"
    >
      <span aria-hidden="true">{loading ? '…' : '▶'}</span>
    </button>
  )
}
