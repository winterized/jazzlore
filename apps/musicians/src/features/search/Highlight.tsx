// Highlight — render an original (accented) string with the matched ranges
// wrapped in <em>. Offsets come from the FROZEN `matchRanges` and index the
// ORIGINAL string (landmine 9). Keys are positional+stable so React never
// remounts the <em> on a keystroke (design "Match-highlight <em> never
// re-mounted" — a remount drops focus / restarts the CSS).

import { Fragment, type ReactElement } from 'react'
import type { MatchRange } from '../../lib/fold'

export function Highlight({
  text,
  ranges,
}: {
  text: string
  ranges: MatchRange[]
}): ReactElement {
  if (ranges.length === 0) return <>{text}</>
  const parts: ReactElement[] = []
  let cursor = 0
  ranges.forEach((r, i) => {
    if (r.start > cursor) {
      parts.push(
        <Fragment key={`t${cursor}`}>{text.slice(cursor, r.start)}</Fragment>,
      )
    }
    parts.push(
      <em key={`m${r.start}`}>{text.slice(r.start, r.end)}</em>,
    )
    cursor = r.end
    if (i === ranges.length - 1 && cursor < text.length) {
      parts.push(
        <Fragment key={`t${cursor}`}>{text.slice(cursor)}</Fragment>,
      )
    }
  })
  return <>{parts}</>
}
