# `src/lib/` — frozen domain contract (Phase B)

Pure, **React-free, fetch-free** TypeScript. This is the seam every downstream
phase codes against:

- **Phase C (BFF)** produces these shapes from Aura HTTP Query API rows.
- **Phase D (mobile reader)** + **Phase E (desktop graph)** consume them via a
  mockable data hook (fixtures here let D/E proceed without C).

**Frozen at the end of Phase B.** C/D/E must not reshape these types or change
the public function signatures below.

## Public API (the C/D/E contract)

### Types — `types.ts`

`RawMusician`, `RawRecord`, `RawPlayedOn`, `RecordType`, `PlayedOnRole`
(raw Aura row shapes, mirror `docs/FRONTEND.md` 1:1) · `ImageAttribution` ·
`RecordRef` · `Collaborator` · `MusicianDetail` · `CuratedCard` ·
`SearchCorpusEntry` · `GraphNode` / `GraphEdge` / `GraphData` ·
BFF envelopes: `WakingResponse`, `CuratedResponse`, `MusicianDetailResponse`,
`GraphResponse`, `SearchIndexResponse`, `HealthResponse`, `BffResponse<T>` ·
guard `isWaking(r): r is WakingResponse`.

### Mappers — `map.ts`

```ts
mapMusicianDetail(result: RawDetailResult): MusicianDetail
mapRecordRef(record: RawRecord, opts?: { primaryArtist?: string }): RecordRef
mapCollaborator(row: RawCollaboratorRow): Collaborator
mapSearchCorpus(rows: RawMusician[]): SearchCorpusEntry[]
mapCuratedCard(pick: { id: string; hook: string }, m: RawMusician): CuratedCard
mapGraphData(result: RawDetailResult): GraphData
```

`RawDetailResult` / `RawCollaboratorRow` are declared in `fixtures.ts` (the
BFF shapes its Cypher result into these; mappers stay pure).

### Deep-links — `links.ts`

```ts
spotifyMusicianUrl(name): string
appleMusicMusicianUrl(name): string
spotifyRecordUrl(title, primaryArtist?): string
appleMusicRecordUrl(title, primaryArtist?): string
```

Search deep-links, both services at parity; record term = `"<title> <primaryArtist>"`.

### Attribution — `attribution.ts`

```ts
attributionCaption(a: ImageAttribution, label?: string): string | null
```

Renders **whenever any** of `license`/`attribution` is non-empty; `null` only
when all are empty (public domain). Legal requirement, not polish.

### Accent-fold — `fold.ts`

```ts
fold(s): string                                  // NFD + strip diacritics + lowercase
matchRanges(query, original): { start; end }[]   // offsets index the ORIGINAL string
```

`matchRanges` offsets index the **original** (accented) string so an `<em>`
highlight aligns with rendered text (landmine 9).

## Decisions / assumptions where `FRONTEND.md` is silent

These are UI-contract choices, not schema facts. Stated here so Phase 0 can
confirm or correct them with a localized change:

1. **`RecordRef.primaryArtist` is DERIVED.** The schema has no primary-artist
   property. The mapper picks the `:PLAYED_ON.role ∈ {leader, co-leader}`
   musician among the focus + collaborators, falling back to the focus
   musician's name so deep-links are never `"<title> undefined"`.
2. **`Collaborator.topRecord` = earliest `release_year` shared record**, ties
   broken by record `id` for determinism. The schema exposes no significance
   metric; earliest-defining-record is stable and matches the design's
   "Most: 'Moanin'' '58" reading. Revisit if Phase 0 surfaces a better metric.
3. **`era` is not invented in Phase B.** It is not a Neo4j field. `MusicianDetail.era`
   / `SearchCorpusEntry.era` stay `undefined`; the editorial era taxonomy
   (from `genres` + `years_active_*`) is Phase C's call.
4. **`Collaborator.relationship` stays `undefined`.** No schema field backs
   the design's free-text relationship line; left optional for the BFF/editorial.
5. **`photo` = `picture_url` presence only** (landmine 10), mirrored by
   `portrait.url`. Never a name heuristic.
6. **Duplicates are rendered faithfully** — NO mapper/client dedup
   (landmine 11). `fixtures.ts` includes the known Antoine Hervé double-node
   (two node ids, one `wikidata_id`); the corpus keeps both. The structured
   duplicate warning is the BFF's job in Phase C, not the mapper's.

## Reconcile-with-Phase-0

Phase 0 (live Aura MCP audit → `docs/data-audit.md`) is currently **blocked**
(Aura unreachable via MCP; escalated separately). This contract was built from
`docs/FRONTEND.md` as the schema source. When Phase 0 runs:

- Field-name corrections land in **`fixtures.ts`** (raw fixtures) and the
  raw→domain field reads in **`map.ts`** only.
- `types.ts` (the C/D/E contract) and the public function signatures above are
  intended to be **stable** across that reconciliation — keep the change
  localized to the raw layer.
- Re-confirm assumptions 1–4 above against real data; adjust `pickTopRecord` /
  `primaryArtistForRecord` if the audit reveals a better signal.
