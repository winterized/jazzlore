// MusicianPage route — loads `/api/musicians/:id` via the mockable BFF seam
// and renders the mobile DetailView (desktop graph slot wired in a later
// step). Non-ready states resolve to the calm D7 screens: a quiet loading
// guard, the "waking up" countdown on a cold-Aura 503 (frozen isWaking
// mapped it upstream), and the calm error screen on a hard failure — both
// with cached fallback names so the reader is never stranded.

import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import {
  defaultSource,
  useBffResource,
  type DataSource,
} from '../hooks/useMusicianData'
import { useTitle } from '../hooks/useTitle'
import { DetailView } from '../features/detail/DetailView'
import { WakingState } from '../features/status/WakingState'
import { CURATED, SPARSE_DUPLICATE_ID } from '../test/fixtures'

const FALLBACK = CURATED.slice(0, 5).map((c) => ({ id: c.id, name: c.name }))

export default function MusicianPage({
  source = defaultSource,
}: {
  /** BFF seam. Defaults to the real fetch-backed source; tests inject the
   * fixture source. */
  source?: DataSource
}) {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [attempt, setAttempt] = useState(0)
  const retry = useCallback(() => setAttempt((a) => a + 1), [])
  const state = useBffResource(
    () => source.detail(id),
    [source, id, attempt],
  )
  // Reflect the loaded musician in the tab title. Called before any early
  // return so the hook order is stable across all render paths (waking /
  // error / loading / ready). Passing `null` while we don't yet have a name
  // keeps the default; the hook restores the default on unmount.
  const name = state.kind === 'ready' ? state.data.name : null
  useTitle(name ? `${name} — Jazzlore` : null)

  // Canonicalize the URL when the resolved id differs from the URL id —
  // i.e. the user landed via a stale alias (issue #84). `replace: true` so
  // the back button doesn't trap them on the stale URL. The follow-up
  // refetch under the canonical id is a BFF cache hit on prod.
  const canonicalId = state.kind === 'ready' ? state.data.id : null
  useEffect(() => {
    if (canonicalId !== null && canonicalId !== id) {
      navigate(`/musicians/${canonicalId}`, { replace: true })
    }
  }, [canonicalId, id, navigate])

  if (state.kind === 'waking') {
    return (
      <WakingState
        variant="waking"
        retryAfter={state.retryAfter}
        fallback={FALLBACK}
        onRetry={retry}
      />
    )
  }
  // A navigation that failed purely because the browser is offline gets the
  // calm "you're offline" screen with a Back affordance — distinct from a real
  // server error (5xx/404), which keeps the generic error screen below.
  if (state.kind === 'error' && state.offline === true) {
    return (
      <WakingState
        variant="offline"
        fallback={FALLBACK}
        onRetry={retry}
        // A cold offline deep-link / "Add to Home Screen" launch into a
        // musician URL (the feature's own target path) has no prior in-app
        // history, so `navigate(-1)` would dead-end. Fall back to home — the
        // SW serves its shell offline.
        onBack={() =>
          window.history.length > 1 ? navigate(-1) : navigate('/musicians')
        }
      />
    )
  }
  if (state.kind === 'error') {
    return (
      <WakingState variant="error" fallback={FALLBACK} onRetry={retry} />
    )
  }
  if (state.kind === 'loading') {
    return (
      <main aria-busy="true" style={{ padding: 24 }}>
        <p>Loading…</p>
      </main>
    )
  }
  // The Antoine sparse node has a known duplicate twin — the BFF (Phase C)
  // will supply this flag; until then derive it from the known fixture id.
  // NOT a dedup (landmine 11): a UI signal only.
  const duplicate =
    state.data.id === 'wikidata:Q2856321' ||
    state.data.id === SPARSE_DUPLICATE_ID
  return (
    <DetailView
      detail={state.data}
      duplicate={duplicate}
      sameEra={state.data.sameEra ?? []}
      source={source}
    />
  )
}
