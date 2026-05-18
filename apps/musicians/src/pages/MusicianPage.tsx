// MusicianPage route — loads `/api/musicians/:id` via the mockable BFF seam
// and renders the mobile DetailView (desktop graph slot wired in a later
// step). The waking/error screens (D7) replace the loading guard in their
// sub-step.

import { useParams } from 'react-router'
import { fixtureSource, useBffResource } from '../hooks/useMusicianData'
import { DetailView } from '../features/detail/DetailView'
import { SPARSE_DUPLICATE_ID } from '../test/fixtures'

export default function MusicianPage() {
  const { id = '' } = useParams<{ id: string }>()
  const state = useBffResource(() => fixtureSource.detail(id), [id])

  if (state.kind !== 'ready') {
    return (
      <main aria-busy="true" style={{ padding: 24 }}>
        <p>Loading…</p>
      </main>
    )
  }
  // The Antoine sparse node has a known duplicate twin — the BFF (Phase C)
  // will supply this flag; until then derive it from the known fixture id.
  // NOT a dedup (landmine 11): a UI signal only.
  const duplicate = state.data.id === 'wikidata:Q2856321'
    || state.data.id === SPARSE_DUPLICATE_ID
  return <DetailView detail={state.data} duplicate={duplicate} />
}
