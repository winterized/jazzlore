import { useEffect, useRef } from 'react'

type Props = {
  /** Complete ABC notation string ready for abcjs.renderAbc. */
  abc: string
  /** Accessible label for the rendered notation. Default: "Music notation". */
  'aria-label'?: string
  /** Staff width in pixels. Default: 320. */
  staffwidth?: number
  /** Padding above the staff in pixels. Default: 8. */
  paddingtop?: number
  /** Padding below the staff in pixels. Default: 14. */
  paddingbottom?: number
}

/**
 * Generic ABC notation renderer.
 *
 * Accepts a pre-built ABC string (e.g. from buildAbcTune or buildChordAbc in
 * @jazzlore/music-core) and renders it via abcjs into a host div.
 *
 * abcjs is lazy-imported so it stays out of the initial bundle. The `active`
 * flag prevents calling renderAbc on an unmounted component.
 *
 * Boundaries: this component is purely presentational — it knows nothing about
 * music theory, notes, chords or scales. All ABC string construction belongs
 * in @jazzlore/music-core or the consuming app.
 */
export default function AbcScore({
  abc,
  'aria-label': ariaLabel = 'Music notation',
  staffwidth = 320,
  paddingtop = 8,
  paddingbottom = 14,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = ref.current
    if (!host || !abc) return

    // Lazy-load abcjs: only needed when a score is rendered.
    // First mount fetches the chunk (~50 KB gz); subsequent mounts hit the module cache.
    // The `active` flag guards against the component unmounting before the import resolves.
    let active = true
    void (async () => {
      const abcjs = await import('abcjs')
      if (!active) return
      abcjs.renderAbc(host, abc, {
        scale: 1,
        staffwidth,
        // abcjs writes inline `height` + `overflow: hidden` on the host, which
        // defeats container padding (py-*). Use abcjs's own padding so the
        // SVG height includes breathing room and noteheads/stems aren't clipped.
        paddingtop,
        paddingbottom,
      })
    })()

    return () => {
      active = false
      host.innerHTML = ''
    }
  }, [abc, staffwidth, paddingtop, paddingbottom])

  return (
    <div
      ref={ref}
      role="img"
      aria-label={ariaLabel}
      className="abcjs-container flex justify-center"
    />
  )
}
