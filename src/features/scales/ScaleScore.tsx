import * as abcjs from 'abcjs'
import { useEffect, useMemo, useRef } from 'react'
import { notesToAbcVoice } from './logic/abc'

type Props = {
  notes: string[] // e.g. ['Bb','C','Db','Eb','F','G','Ab']
  octave?: number // default 4
}

export default function ScaleScore({ notes, octave = 4 }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const notesKey = notes.join(',')

  // Derive abc voice once per change; useMemo keeps it stable for the effect dep
  // so we don't re-render whenever the parent passes a fresh `notes` array identity.
  const tune = useMemo(() => {
    const voice = notesToAbcVoice(notes, octave)
    if (!voice) return null
    return `X:1\nM:none\nK:C\n${voice}|`
    // notesKey is the stable serialization of `notes`; depending on the array
    // identity would re-derive needlessly on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notesKey, octave])

  useEffect(() => {
    const host = ref.current
    if (!host || !tune) return
    abcjs.renderAbc(host, tune, {
      scale: 1,
      staffwidth: 320,
      paddingtop: 0,
      paddingbottom: 0,
    })
    return () => {
      host.innerHTML = ''
    }
  }, [tune])

  return (
    <div
      ref={ref}
      role="img"
      aria-label={`Scale notation: ${notes.join(', ')}`}
      className="abcjs-container"
    />
  )
}
