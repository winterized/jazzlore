// RecordsStrip — "Records they shaped" (design `RecordsStrip`). Horizontal
// scroll of record-art tiles, each a Spotify deep-link (frozen links.ts).
// Every cover renders its mandatory attribution caption whenever any
// license/attribution is non-empty (delegated to AttribAlbum →
// attributionCaption). Renders nothing when empty.

import type { RecordRef } from '../lib/types'
import { AttribAlbum } from './Attrib'

type Props = {
  records: RecordRef[]
}

export function RecordsStrip({ records }: Props) {
  if (records.length === 0) return null
  return (
    <>
      <div className="sec-h">
        <span>Records they shaped</span>
        <em>{records.length} key</em>
      </div>
      <div className="rec-strip">
        {records.map((r) => (
          <AttribAlbum key={r.id} rec={r} />
        ))}
      </div>
    </>
  )
}
