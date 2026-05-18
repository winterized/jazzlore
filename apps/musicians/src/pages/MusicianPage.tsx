// MusicianPage route — loads `/api/musicians/:id` via the mockable BFF seam
// and renders the mobile DetailView (desktop graph slot wired in a later
// step). Non-ready states resolve to the calm D7 screens: a quiet loading
// guard, the "waking up" countdown on a cold-Aura 503 (frozen isWaking
// mapped it upstream), and the calm error screen on a hard failure — both
// with cached fallback names so the reader is never stranded.

import { useCallback, useState } from 'react'
import { useParams } from 'react-router'
import { fixtureSource, useBffResource } from '../hooks/useMusicianData'
import { DetailView } from '../features/detail/DetailView'
import { WakingState } from '../features/status/WakingState'
import { CURATED, SPARSE_DUPLICATE_ID } from '../test/fixtures'

const FALLBACK = CURATED.slice(0, 5).map((c) => ({ id: c.id, name: c.name }))

export default function MusicianPage() {
  const { id = '' } = useParams<{ id: string }>()
  const [attempt, setAttempt] = useState(0)
  const retry = useCallback(() => setAttempt((a) => a + 1), [])
  const state = useBffResource(
    () => fixtureSource.detail(id),
    [id, attempt],
  )

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
  return <DetailView detail={state.data} duplicate={duplicate} />
}
