// Accent-fold + original-offset highlight (Phase B contract).
//
// Landmine 9 / design "Implementation gotchas": match on the NFD-stripped
// fold, but render the ORIGINAL string — the `<em>` highlight offsets MUST
// index the original (accented) string, never the folded one, or the
// highlight drifts the moment a name carries a diacritic.
//
// `fold` is the canonical normaliser used everywhere (autosuggest corpus
// build, query normalisation). `matchRanges` returns original-string offsets
// by folding per-character and keeping a fold-index → original-index map, so
// a single original code point that NFD-expands to base+combining-mark still
// maps a contiguous fold run back to its single original index.

/** `fold(s)` = NFD + strip `\p{Diacritic}` + lowercase. Idempotent. */
export function fold(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

export interface MatchRange {
  /** Inclusive start index into the ORIGINAL string. */
  start: number
  /** Exclusive end index into the ORIGINAL string. */
  end: number
}

/**
 * All non-overlapping occurrences of `query` within `original`, accent-folded
 * on both sides, with offsets that index the ORIGINAL string so an `<em>`
 * highlight aligns with the rendered (accented) text.
 *
 * Returns `[]` for an empty/whitespace query or no match.
 */
export function matchRanges(query: string, original: string): MatchRange[] {
  const q = fold(query.trim())
  if (q === '') return []

  // Build the folded haystack and, for every folded-string index, the index
  // of the original code point it came from. Iterating with the string
  // iterator keeps astral characters as single units.
  let folded = ''
  const foldedToOriginal: number[] = []
  let originalIndex = 0
  for (const ch of original) {
    const f = fold(ch)
    for (let i = 0; i < f.length; i++) foldedToOriginal.push(originalIndex)
    folded += f
    originalIndex += ch.length // advance by UTF-16 code units
  }
  // Sentinel so a match ending at the very end maps to original.length.
  foldedToOriginal.push(original.length)

  const ranges: MatchRange[] = []
  let from = 0
  for (;;) {
    const hit = folded.indexOf(q, from)
    if (hit === -1) break
    const start = foldedToOriginal[hit]
    const end = foldedToOriginal[hit + q.length]
    if (start !== undefined && end !== undefined) ranges.push({ start, end })
    from = hit + q.length
  }
  return ranges
}
