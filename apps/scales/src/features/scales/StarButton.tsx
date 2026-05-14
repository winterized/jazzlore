import { useState } from 'react'
import { isSaved, save, unsave } from '../collection/collectionStore'

type Props = { rootNote: string; scaleId: string }

export default function StarButton({ rootNote, scaleId }: Props) {
  const [pressed, setPressed] = useState(() => isSaved(rootNote, scaleId))
  const toggle = (): void => {
    if (pressed) {
      unsave(rootNote, scaleId)
      setPressed(false)
    } else {
      save({ rootNote, scaleId })
      setPressed(true)
    }
  }
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={pressed ? 'Remove from My scales' : 'Save to My scales'}
      onClick={toggle}
      className="rounded-md px-2 py-1 text-lg leading-none hover:bg-stone-200 dark:hover:bg-stone-800"
    >
      <span aria-hidden="true">{pressed ? '★' : '☆'}</span>
    </button>
  )
}
