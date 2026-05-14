import { useMemo } from 'react'
import { AbcScore } from '@jazzlore/ui'
import { buildAbcTune } from '@jazzlore/music-core'

type Props = {
  notes: string[] // e.g. ['Bb','C','Db','Eb','F','G','Ab']
  octave?: number // default 4
}

export default function ScaleScore({ notes, octave = 4 }: Props) {
  const notesKey = notes.join(',')

  // notesKey is the stable serialization of `notes`; depending on the array
  // identity would re-derive needlessly on every parent render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tune = useMemo(() => buildAbcTune(notes, octave), [notesKey, octave])

  if (!tune) return null

  return (
    <AbcScore
      abc={tune}
      aria-label={`Scale notation: ${notes.join(', ')}`}
      staffwidth={320}
      paddingtop={8}
      paddingbottom={14}
    />
  )
}
