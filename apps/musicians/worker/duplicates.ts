// Duplicate OBSERVABILITY — structured warning only, NO dedup (Phase C).
//
// Decision 8 / landmine 11: duplicates are an upstream data-quality issue
// OWNED BY THE POPULATOR. The frontend renders them faithfully; the BFF does
// NOT filter or merge. Its only job here is to emit a structured warning to
// the Worker logs when the same external id (wikidata / musicbrainz / discogs)
// appears across DISTINCT node ids, so the populator owner can fix it at the
// source. Data is returned untouched.

import type { RawMusician } from '../src/lib/types'

export interface DuplicateGroup {
  /** Which external identifier collided. */
  idType: 'wikidata' | 'musicbrainz' | 'discogs'
  /** The shared external id value. */
  externalId: string
  /** The distinct Neo4j node ids that share it (≥2). */
  nodeIds: string[]
}

const EXTERNAL_KEYS: { idType: DuplicateGroup['idType']; field: keyof RawMusician }[] =
  [
    { idType: 'wikidata', field: 'wikidata_id' },
    { idType: 'musicbrainz', field: 'musicbrainz_id' },
    { idType: 'discogs', field: 'discogs_id' },
  ]

/** Group `rows` by each external id; report groups spanning >1 distinct node
 * id. Pure — no logging, no mutation (testable in isolation). */
export function detectDuplicates(rows: RawMusician[]): DuplicateGroup[] {
  const groups: DuplicateGroup[] = []
  for (const { idType, field } of EXTERNAL_KEYS) {
    const byExternal = new Map<string, Set<string>>()
    for (const m of rows) {
      const raw = m[field]
      const ext = typeof raw === 'string' ? raw.trim() : ''
      if (ext === '') continue
      let set = byExternal.get(ext)
      if (set === undefined) {
        set = new Set<string>()
        byExternal.set(ext, set)
      }
      set.add(m.id)
    }
    for (const [externalId, nodeIds] of byExternal) {
      if (nodeIds.size > 1) {
        groups.push({ idType, externalId, nodeIds: [...nodeIds].sort() })
      }
    }
  }
  return groups
}

/** Detect + emit one structured `console.warn` line per duplicate group.
 * Returns the groups (so callers/tests can assert). Data is NEVER filtered. */
export function warnOnDuplicates(
  rows: RawMusician[],
  source: string,
  logger: Pick<Console, 'warn'> = console,
): DuplicateGroup[] {
  const groups = detectDuplicates(rows)
  for (const g of groups) {
    logger.warn(
      JSON.stringify({
        level: 'warn',
        event: 'duplicate-musician-suspected',
        source,
        idType: g.idType,
        externalId: g.externalId,
        nodeIds: g.nodeIds,
        note: 'upstream/populator-owned; rendered faithfully, NOT deduped',
      }),
    )
  }
  return groups
}
