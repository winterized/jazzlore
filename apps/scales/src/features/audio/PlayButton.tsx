import { useState } from 'react'
import { playScale, stopAll, unlockAudio } from '@jazzlore/music-core'

type Props = {
  notes: string[]
  ariaLabel: string
}

export default function PlayButton({ notes, ariaLabel }: Props) {
  const [loading, setLoading] = useState(false)
  const onClick = async (): Promise<void> => {
    setLoading(true)
    try {
      stopAll()
      await unlockAudio()
      await playScale(notes)
    } finally {
      setLoading(false)
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
      <span aria-hidden="true">{loading ? '…' : '♪'}</span>
    </button>
  )
}
