// SharedRecordsSheet — the "+N more" drawer/popover.
//
// Lists the records the focus + collab pair both played on, fetched on
// demand from `/api/musicians/:focusId/collaborators/:collabId/records`.
// Renders as a bottom drawer on mobile and a centered modal on desktop;
// portalled to document.body so it overlays the detail page (not nested
// in the scrolled detail panel — same lesson as MoreAboutSheet).
//
// Header carries the collab name + record count. When the BFF response
// surfaces `totalCount > records.length`, the count subheading reads
// "N of M records · most recent first" so the user knows the slice is
// partial (densest pairs are intentionally capped at 100 server-side, R1).

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useFocusTrap } from '@jazzlore/ui'
import type { RecordRef } from '../../lib/types'
import {
  useBffResource,
  type DataSource,
  type SharedRecordsResponse,
} from '../../hooks/useMusicianData'

type Props = {
  /** Focus musician (the page the user is on). */
  focusId: string
  /** Collaborator the user opened the +N more for. */
  collabId: string
  /** Collab display name (already known from ConnRow — saves a fetch
   * round-trip for the heading). */
  collabName: string
  /** BFF seam — defaults to the real fetch-backed source; tests inject
   * the fixture source. */
  source: DataSource
  onClose: () => void
}

function RecordCard({ record }: { record: RecordRef }) {
  const year = record.releaseYear ?? record.recordingYear
  return (
    <li
      className="records-row"
      data-record-id={record.id}
    >
      <div className="records-row-title">{record.title}</div>
      <div className="records-row-sub">
        {year !== undefined ? <span>{year}</span> : null}
        {year !== undefined && record.primaryArtist !== undefined ? (
          <span aria-hidden="true"> · </span>
        ) : null}
        {record.primaryArtist !== undefined ? (
          <span>{record.primaryArtist}</span>
        ) : null}
      </div>
    </li>
  )
}

function SubheadingCount({
  records,
  totalCount,
}: {
  records: RecordRef[]
  totalCount: number
}) {
  if (totalCount > records.length) {
    return (
      <p className="records-subheading" data-truncated="true">
        {records.length} of {totalCount} records · most recent first
      </p>
    )
  }
  return (
    <p className="records-subheading">
      {totalCount} record{totalCount === 1 ? '' : 's'}
    </p>
  )
}

export function SharedRecordsSheet({
  focusId,
  collabId,
  collabName,
  source,
  onClose,
}: Props) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const titleId = 'shared-records-title'
  const [entered, setEntered] = useState(false)
  const state = useBffResource<SharedRecordsResponse>(
    () => source.sharedRecords(focusId, collabId),
    [source, focusId, collabId],
  )
  useFocusTrap(sheetRef, true)

  // Mount-time slide-in: rAF flip from `translateY(100%)` to `0` so the
  // mobile-drawer enter transition runs even on first paint.
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <>
      <div
        className={`mu3-sheet-backdrop${entered ? ' open' : ''}`}
        data-testid="shared-records-backdrop"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        data-testid="shared-records-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`mu3-sheet mu3-records-sheet${entered ? ' open' : ''}`}
      >
        <div className="more-handle" aria-hidden="true" />
        <div className="more-head">
          <h2 className="ttl" id={titleId}>
            Records with <em>{collabName}</em>
          </h2>
          <button
            type="button"
            className="close"
            aria-label={`Close — records with ${collabName}`}
            onClick={onClose}
          >
            close ×
          </button>
        </div>
        <div className="more-body records-body">
          {state.kind === 'loading' ? (
            <p className="records-loading" role="status">
              Loading…
            </p>
          ) : state.kind === 'waking' ? (
            <p className="records-loading" role="status">
              Waking up · retry in {state.retryAfter}s…
            </p>
          ) : state.kind === 'error' ? (
            <p className="records-error" role="alert">
              Couldn&rsquo;t load the records. Close this and try again.
            </p>
          ) : state.data.records.length === 0 ? (
            <p className="records-empty">
              No shared records on file for this pair.
            </p>
          ) : (
            <>
              <SubheadingCount
                records={state.data.records}
                totalCount={state.data.totalCount}
              />
              <ul className="records-list">
                {state.data.records.map((r) => (
                  <RecordCard key={r.id} record={r} />
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </>,
    document.body,
  )
}
