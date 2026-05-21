// RandomJumpPage — `/musicians/journey/random`.
//
// On mount: load the corpus via defaultSource.searchIndex(), pick a random
// entry, replace-navigate to /musicians/:id. The route exists so the URL
// is shareable (each visit re-rolls); `replace: true` so the browser back
// button returns wherever the reader came from, NOT to /random (which
// would just re-roll).
//
// On any non-happy path — cold Aura ('waking'), empty corpus, fetch
// error — replace-navigate to /musicians. The home page is the right
// recovery surface (curated 12 + search), and the redirect is silent so
// the user just experiences "random landed them on home" instead of
// "random crashed."

import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { defaultSource } from '../../hooks/useMusicianData'
import { isWaking } from '../../lib/types'
import { Shell } from '../../components/Shell'

export function RandomJumpPage() {
  const navigate = useNavigate()

  useEffect(() => {
    let live = true

    function go(path: string): void {
      if (live) void navigate(path, { replace: true })
    }

    defaultSource
      .searchIndex()
      .then((r) => {
        if (isWaking(r) || r.corpus.length === 0) {
          go('/musicians')
          return
        }
        const pick = r.corpus[Math.floor(Math.random() * r.corpus.length)]
        go(pick ? `/musicians/${encodeURIComponent(pick.id)}` : '/musicians')
      })
      .catch(() => go('/musicians'))

    return () => {
      live = false
    }
  }, [navigate])

  return (
    <Shell>
      <main className="journey-rolling" aria-busy="true">
        <p>Rolling the dice…</p>
      </main>
    </Shell>
  )
}
