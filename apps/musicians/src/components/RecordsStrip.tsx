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
  // The BFF can return a degenerate record with no `title` (and no `id`) for a
  // sparse "polished" musician — e.g. Lee Morse, surfaced via the v1.1 widget.
  // An untitled record is not displayable (no tile label, no usable search
  // deep-link, no stable React key), so drop it. This also guards the count
  // and the empty-state early return. `title`/`id` are typed required, so the
  // Boolean() filter both narrows the data and documents the contract violation.
  const shown = records.filter((r) => Boolean(r.title))
  if (shown.length === 0) return null
  return (
    <>
      <div className="sec-h">
        <span>Records they shaped</span>
        <em>{shown.length} key</em>
      </div>
      <div className="rec-strip">
        {shown.map((r) => (
          <AttribAlbum key={r.id ?? r.title} rec={r} />
        ))}
      </div>
    </>
  )
}
