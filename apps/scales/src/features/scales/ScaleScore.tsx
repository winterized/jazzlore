import { useEffect, useMemo, useRef } from 'react'
import { buildAbcTune } from '@jazzlore/music-core'

type Props = {
  notes: string[] // e.g. ['Bb','C','Db','Eb','F','G','Ab']
  octave?: number // default 4
}

export default function ScaleScore({ notes, octave = 4 }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const notesKey = notes.join(',')

  // notesKey is the stable serialization of `notes`; depending on the array
  // identity would re-derive needlessly on every parent render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tune = useMemo(() => buildAbcTune(notes, octave), [notesKey, octave])

  useEffect(() => {
    const host = ref.current
    if (!host || !tune) return

    // Lazy-load abcjs: it's only needed once a scale is rendered.
    // First mount fetches the chunk (~50 KB gz); subsequent mounts hit the module cache.
    // The `active` flag guards against the component unmounting before the import resolves.
    let active = true
    void (async () => {
      const abcjs = await import('abcjs')
      if (!active) return
      abcjs.renderAbc(host, tune, {
        scale: 1,
        staffwidth: 320,
        // abcjs writes inline `height` + `overflow: hidden` on the host, which
        // defeats container padding (py-*). Use abcjs's own padding so the
        // SVG height includes breathing room and noteheads/stems aren't clipped
        // into the keyboard below.
        paddingtop: 8,
        paddingbottom: 14,
      })
    })()

    return () => {
      active = false
      host.innerHTML = ''
    }
  }, [tune])

  return (
    <div
      ref={ref}
      role="img"
      aria-label={`Scale notation: ${notes.join(', ')}`}
      className="abcjs-container flex justify-center"
    />
  )
}
