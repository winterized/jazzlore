// RandomJumpPage — `/musicians/journey/random`.
//
// On mount: pick a random musician from the "polished pool" (musicians with
// BOTH a bio summary AND a portrait — `/api/musicians/polished-ids`, ~200
// today) and replace-navigate to /musicians/:id. Wave 1 / PR6 / audit
// Quality #1 + #17: the prior implementation rolled over the full corpus
// (~30k entries) and routinely landed first-time users on sparse musicians
// (no portrait, no bio, "1911–present" though died 1985 — Big Joe Turner
// was the audit's canonical example). The polished pool is the editorial
// answer to "this site is half-built" on the first tap.
//
// Graceful degradation chain:
//   polishedIds() → searchIndex() (full corpus, less polished) → /musicians
// Each step is best-effort: a cold/waking/empty/error response on the
// polished pool falls THROUGH to the full corpus pick so the user always
// gets a random musician. Only a total failure of BOTH endpoints lands the
// user on /musicians.
//
// `replace: true` so the browser back button returns wherever the reader
// came from, NOT to /random (which would just re-roll).

import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { defaultSource, type DataSource } from '../../hooks/useMusicianData'
import { isWaking } from '../../lib/types'
import { Shell } from '../../components/Shell'

type Props = {
  /** BFF seam. Defaults to the production fetch source; tests inject a
   *  deterministic mock so the polished-first-then-fallthrough flow can
   *  be asserted without `fetch`. */
  source?: DataSource
}

export function RandomJumpPage({ source = defaultSource }: Props = {}) {
  const navigate = useNavigate()

  useEffect(() => {
    let live = true

    function go(path: string): void {
      if (live) void navigate(path, { replace: true })
    }
    function pickFromPool(pool: readonly string[] | null): string | null {
      if (!pool || pool.length === 0) return null
      const idx = Math.floor(Math.random() * pool.length)
      return pool[idx] ?? null
    }

    async function roll(): Promise<void> {
      // Try the polished pool first. Treat waking / error / empty as soft
      // failures — fall through to the broader searchIndex pick.
      try {
        const polished = await source.polishedIds()
        if (!live) return
        if (!isWaking(polished)) {
          const pick = pickFromPool(polished.ids)
          if (pick !== null) {
            go(`/musicians/${encodeURIComponent(pick)}`)
            return
          }
        }
      } catch {
        // fall through
      }

      try {
        const corpus = await source.searchIndex()
        if (!live) return
        if (isWaking(corpus) || corpus.corpus.length === 0) {
          go('/musicians')
          return
        }
        const ids = corpus.corpus.map((c) => c.id)
        const pick = pickFromPool(ids)
        go(pick !== null ? `/musicians/${encodeURIComponent(pick)}` : '/musicians')
      } catch {
        go('/musicians')
      }
    }

    void roll()
    return () => {
      live = false
    }
  }, [navigate, source])

  return (
    <Shell>
      <main className="journey-rolling" aria-busy="true">
        <p>Rolling the dice…</p>
      </main>
    </Shell>
  )
}
