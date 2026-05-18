// HomePage route — loads the curated list via the mockable BFF seam and
// renders HomeView. The waking/error/loading screens (D7) and the
// autosuggest combobox (D6) are wired in their own sub-steps; D2 ships the
// happy path + a minimal loading guard.

import { fixtureSource, useBffResource } from '../hooks/useMusicianData'
import { HomeView } from '../features/home/HomeView'
import { Autosuggest } from '../features/search/Autosuggest'

export default function HomePage() {
  const state = useBffResource(() => fixtureSource.curated(), [])

  if (state.kind !== 'ready') {
    // D7 replaces this with the calm waking/error screens.
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
