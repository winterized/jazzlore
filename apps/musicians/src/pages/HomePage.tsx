// HomePage route — loads the curated list via the mockable BFF seam and
// renders HomeView. Non-ready states resolve to the calm D7 screens: a
// quiet loading guard, the "waking up" countdown screen on a cold-Aura 503
// (frozen isWaking mapped it to `kind:'waking'` upstream), and the calm
// error screen on a hard failure — both with cached fallback names so the
// reader is never stranded. The D6 autosuggest combobox is the search slot.

import { useCallback, useState } from 'react'
import {
  defaultSource,
  useBffResource,
  type DataSource,
} from '../hooks/useMusicianData'
import { HomeView } from '../features/home/HomeView'
import { Autosuggest } from '../features/search/Autosuggest'
import { WakingState } from '../features/status/WakingState'
import { CURATED } from '../test/fixtures'

/** Cached names for the never-stranded fallback. The curated list is the
 * closest stand-in for "your last visit" until a real client cache lands. */
const FALLBACK = CURATED.slice(0, 5).map((c) => ({ id: c.id, name: c.name }))

export default function HomePage({
  source = defaultSource,
}: {
  /** BFF seam. Defaults to the real fetch-backed source; tests inject the
   * fixture source. */
  source?: DataSource
}) {
  const [attempt, setAttempt] = useState(0)
  const retry = useCallback(() => setAttempt((a) => a + 1), [])
  const state = useBffResource(() => source.curated(), [source, attempt])

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
  return (
    <HomeView curated={state.data.curated} searchSlot={<Autosuggest />} />
  )
}
