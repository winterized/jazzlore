# Records project — design doc: cover art + tap-to-listen on record cards

**Status:** Draft for review · **Author:** autonomous research session (Claude Opus 4.8) · **Date:** 2026-06-06
**Scope:** Add album cover art and album-level streaming links to the Musicians `RecordsStrip`, with thoughtful ordering.
**This doc is research + design only.** No code was changed. Decision points are flagged for Aurélien at [§9](#9-decisions-you-need-to-make).

---

## 0. TL;DR — read this first

Three findings reframe the project before you start. Each contradicts an assumption in the original brief; all three are verified against the code or live APIs.

1. **Cover-art rendering is already fully plumbed end-to-end.** `cover_art_url` / `cover_art_license` exist as `Record` schema fields in the populator (`schema.py:161-162`), are projected to Aura (`store.py:679-680`), flow through the BFF (`r{.*}`), map to `RecordRef.cover` (`map.ts:95-97`), and render via `<Duo3 photo={Boolean(rec.cover.url)} />` (`Attrib.tsx:65`). **They are `None` for every record today.** The frontend will show covers the moment the populator writes URLs. The frontend cover-art work is therefore *much smaller than the brief implies* — it's mostly redesign/polish, not new plumbing.

2. **Album "tap-to-listen" is NOT implemented for Spotify.** The brief says it is. In fact `AttribAlbum` builds a **search URL** (`https://open.spotify.com/search/<title artist>`, `links.ts` + `Attrib.tsx:60`), not a resolved album deep-link. Apple Music on records is *entirely absent* — `appleMusicRecordUrl()` exists but is called nowhere. So both services start from zero at the album level; today's behaviour is a Spotify keyword search only.

3. **There is no record ordering today, and adding one needs zero new data.** The detail query uses `collect(DISTINCT …)` with **no `ORDER BY`** (`cypher.ts:144-145`); the mapper never re-sorts (`map.ts:217`, comment line 12-13). Records render in Neo4j storage order — effectively arbitrary. Every ordering signal you'd want (year, track count, collaborator overlap) is **already in the graph**. This matches your prior instinct: ordering is derivable, no populator expansion required.

**One more reframing of the disambiguation problem:** your records are *already keyed on MusicBrainz release-**group** MBIDs* (`schema.py:126`), not individual releases. So "which release do I canonicalize on?" is mostly already answered at the identity level. The residual problem is narrower and real: **cover art and streaming url-rels live at the release level, not the release-group level**, so any per-album enrichment must pick a *representative release* within the group. See [§4](#4-the-release-group--release-disambiguation-problem).

**Net effect on the estimate:** your ~1–1.5 week framing is right *if* you accept the Spotify reality (no usable API — see [§3.2](#32-album-level-streaming-urls-apple-music--spotify)) and treat cover-art frontend as polish rather than new infra. The honest range is **6–9 focused days**, dominated by populator enrichment runs and disambiguation tuning, not frontend. See [§10](#10-phased-implementation-plan).

---

## 1. Current state (verified)

### 1.1 The record card today

`RecordsStrip` (`apps/musicians/src/components/RecordsStrip.tsx`) renders a header "Records they shaped · *N* key" and maps every record to `<AttribAlbum>`. `AttribAlbum` (`Attrib.tsx:55-77`):

```tsx
<a className="rec-tile" href={spotifyRecordUrl(rec.title, rec.primaryArtist)} target="_blank" rel="noreferrer">
  <figure className="fig">
    <Duo3 name={rec.title} initials={false} photo={Boolean(rec.cover.url)} />
    <div className="rt">{rec.title}</div>
    <div className="rm">{[rec.primaryArtist, rec.label].filter(Boolean).join(' · ')}</div>
    {rec.releaseYear && <div className="ry">'{String(rec.releaseYear).slice(-2)}</div>}
    {caption && <figcaption>{caption}</figcaption>}
  </figure>
</a>
```

- The **whole tile** is one `<a>` → Spotify **search**. There is no Apple Music affordance.
- `Duo3 photo={Boolean(rec.cover.url)}` already renders the real cover when `cover.url` is present; otherwise a flat duotone surface (`initials={false}` suppresses the monogram/figure — records get *no* placeholder glyph today).
- `caption` fires `attributionCaption(rec.cover, 'Cover art')` whenever `license`/`attribution` is non-empty (legal requirement, see CLAUDE.md "Image attribution").

### 1.2 The data contract

`RecordRef` (`types.ts:126-143`):

| Field | Source | Notes |
|---|---|---|
| `id` | `musicbrainz:<release-group-uuid>` or `discogs:<id>` | the release-**group** MBID |
| `title`, `type`, `releaseYear`, `recordingYear`, `label`, `catalogNumber`, `trackCount` | Record node props | |
| `primaryArtist?` | **DERIVED** (`primaryArtistForRecord`, `map.ts:158`) | leader/co-leader on the record, else focus musician's name |
| `cover: { url?, license?, attribution? }` | `cover_art_url` / `cover_art_license` | `attribution` has **no backing field** (gap — see §7.2) |
| `links: { wikipediaUrl, wikidataId, musicbrainzId, discogsId }` | | |

**No album-level streaming URL field exists** on `RecordRef`, `RawRecord`, the Aura schema, or any populator sidecar.

### 1.3 BFF / ordering

- Detail records: `OPTIONAL MATCH (m)-[fe:PLAYED_ON]->(r:Record) WITH m, collect(DISTINCT {record: r{.*}, edge: properties(fe)}) AS records` — **no `ORDER BY`, no `LIMIT`** (`cypher.ts:144-145`). All records, arbitrary order, passed whole to `<RecordsStrip records={detail.records}>` (`DetailView.tsx:295`).
- Shared-records sheet (the "+N more" overlay, a separate endpoint) *does* sort: `ORDER BY year IS NULL, year DESC, r.title ASC` (`cypher.ts:462-463`). Reverse-chronological is the existing house style for records — worth matching.
- `r{.*}` returns **all** Record properties, so adding new Record node props requires **no Cypher change** — they flow through automatically. Only the mapper + types need updating.

### 1.4 The listen-button compliance pattern (must be mirrored)

Two existing, App-Review-passed patterns; a record button must follow the same discipline.

**Primary buttons — `DetailIdentity.tsx` `.listen` (flex row, Apple LEFT per §1.3):**
- Apple = official badge `<img src="/brand-assets/apple-music/US-UK_Apple_Music_Listen_on_Badge_RGB_072720.svg">`, vendored unmodified, never recoloured.
- Spotify = `currentColor` CSS mask (`.spfy-mark`), no green.
- 3-tier cascade: **curated track URL → resolved artist URL → name search**.

**Per-collaborator icons — `ConnRow.tsx:145-181` `.conn-act` (flex column, Apple TOP per §1.3):**
```tsx
<a className="ic" href={c.appleArtistUrl ?? appleMusicMusicianUrl(c.name)} …>
  <span className="ic-glyph ic-apple" aria-hidden="true" />
</a>
<a className="ic" href={c.spotifyArtistUrl ?? spotifyMusicianUrl(c.name)} …>
  <span className="ic-glyph ic-spotify" aria-hidden="true" />
</a>
```
- 2-tier cascade (no curated track at collaborator level): **resolved artist URL → name search**.
- Icons are decorative `<span aria-hidden>` with the accessible name on the `<a>`; click handler `e.stopPropagation()` so the icon doesn't trigger the row's SPA nav.
- Brand artwork at `apps/musicians/public/brand-assets/{apple-music,spotify}/`.

**Invariant for the record card:** Apple Music must lead (left/top), official artwork unmodified, Spotify may be mask+currentColor. (See the brand-compliance project memory + `musicians.md` "Listen-button branding".)

---

## 2. The populator's existing enrichment pattern (what to mirror)

From `~/Documents/JazzDBPopulator/` (Python, package `jazzdb/`). All read-only.

### 2.1 Apple Music artist enrichment ("Project 2")

- **Auth** (`sources/applemusic.py:46-63`): JWT **ES256**, `iss=APPLE_MUSIC_TEAM_ID`, header `kid=APPLE_MUSIC_KEY_ID`, signed with the `.p8` (`AuthKey_294P5WZ8GF.p8`, committed in `jazzdb/sources/`). 12 h TTL, `Authorization: Bearer`. No Music-User-Token.
- **Endpoints used:**
  - `GET /v1/catalog/{storefront}/search?term=<name>&types=artists&limit=5`
  - `GET /v1/catalog/{storefront}/artists/{id}/albums?limit=25` (for corroboration)
  - storefront defaults to `us`; stored URL = winning result's `attributes.url`.
- **Namesake corroboration** (`streaming.py:367-404`, `pick_apple_artist`): normalise candidate album titles (strip diacritics, edition/remaster/RVG suffixes, feat-credits; keep volume numbers) and intersect with the musician's known discography titles. A candidate corroborates iff **≥2 distinct title matches**, OR **exactly 1 non-generic, non-self-titled match** (30+ generic stoplist titles: "live", "best of", "ballads"…). Exactly one corroborating candidate → win; zero or ≥2 → abstain (`apple_api_unconfirmed`). Explicit bias: a wrong namesake is worse than no link.
- **3-step cascade**: ① MB `url-rels` → ② Wikidata P9831 → ③ Apple API. `apple_resolved_via` records the path.
- **Output**: appended to `data/streaming_ids.jsonl` (artist-level, ~500 lines). Hand-overrides in `data/streaming_overrides.jsonl` (13 track-level + 33 artist-level Apple).

### 2.2 Spotify — the API is gone

> **Critical, and it changes the plan.** `streaming.py:3` + the live API research: Spotify removed `top-tracks`, `popularity`, and (for Development-Mode apps) batch album lookup in **Feb/Mar 2026**. The populator's Spotify resolution is now **MusicBrainz-only**: ① MB artist `url-rels` (scan for `open.spotify.com/artist/`) → ② Wikidata P1902 → ③ none. There is no Spotify API call anywhere in the populator.

For albums, Client-Credentials **search/lookup still works** (catalog-only), but **`popularity` is permanently removed** and **search `limit` is capped at 10**. So Spotify *can* be queried for an album URL, but: (a) you'd be reintroducing a Spotify API client the populator deliberately dropped, and (b) you get no popularity signal from it. See [§3.2](#32-album-level-streaming-urls-apple-music--spotify).

### 2.3 Record ↔ MusicBrainz, and the schema slots already waiting

- Record `id` = `musicbrainz:<release-group-MBID>` (`schema.py:126`). The populator is **release-group-aware throughout** (`fetch_release_groups_for_artist`, `fetch_release_group`, queue keyed on release-group MBID). **No individual-release MBID is persisted** — `release_mbid` is used transiently for personnel ingestion only (`musicbrainz.py:317-333`).
- `Record` schema **already declares** `cover_art_url` + `cover_art_license` (`schema.py:161-162`), projected to Aura by `_record_row` (`store.py:664-686`). Both `None` everywhere today. **No album streaming property exists.**
- **No record-level sidecar exists** — unlike musicians (streaming_ids.jsonl), record enrichment is written directly into the on-disk per-record JSON (`data/records/<uuid>/…`, 26 015 dirs) and re-emitted via `_record_row` at `export-cypher` time.
- **Makefile pipeline**: `enrich-streaming-stage{1,2}` (artist MB+WD), `enrich-streaming-apple` (Apple gap-fill), `export-cypher` (on-disk → `graph.cypher`, incremental via `.last_publish.txt`), `publish-neo4j` (load to Aura via MERGE), `sync` (commit+push+publish).

---

## 3. Data sources

### 3.1 Album cover art — MusicBrainz Cover Art Archive (CAA)

**Recommended primary source.** Free, deterministic, keyed on the MBIDs you already store.

**Endpoint (release-group level — matches your record id):**
```
GET  https://coverartarchive.org/release-group/{rg-mbid}            → JSON listing (302 to a representative release's index.json)
GET  https://coverartarchive.org/release-group/{rg-mbid}/front      → 307 redirect to full-size front image
GET  https://coverartarchive.org/release-group/{rg-mbid}/front-250  → 307 redirect to 250px thumbnail
GET  https://coverartarchive.org/release-group/{rg-mbid}/front-500  → 307 redirect to 500px thumbnail
GET  https://coverartarchive.org/release-group/{rg-mbid}/front-1200 → 307 redirect to 1200px (NOT guaranteed to exist)
```
The `/front-NNN` shortcuts let you **skip JSON parsing entirely** — they 307-redirect straight to the image. Images are hosted on the Internet Archive (`dn*.ca.archive.org` CDN nodes) after a 2-hop redirect.

**JSON shape** (when you need fallback logic): `{ images: [ { image, thumbnails: {250,500,1200,small,large}, front: bool, back: bool, types: [...], approved } ] }`. Filter `front === true`; prefer `thumbnails["500"] ?? thumbnails["large"]`; for hi-res `thumbnails["1200"] ?? thumbnails["500"]` (never assume 1200 exists).

**Sizes:** 250 / 500 / 1200 / original. **500px is the sweet spot for a card; 250px for the strip thumbnail.**

**Rate limits & terms:** No documented hard rate limit on `coverartarchive.org` (CDN-served; *not* the MB 1 req/s limit). No User-Agent requirement (send a courteous one anyway). **Images are copyrighted — NOT CC0.** Display-via-hotlink in a reference/educational context is standard practice; pixel manipulation/redistribution is not. Your existing `cover_art_license` attribution caption covers the legal-display obligation; populate it with the CAA image's license string when present.

**CORS:** `<img src>` display works cross-origin **regardless of CORS** (verified-safe). `fetch()`/canvas pixel access is **likely blocked** (archive.org omits `Access-Control-Allow-Origin` — strong signal, not 100% confirmed). → **Known-unknown #1**, flag for a live test before any client-side fetch/dominant-colour extraction. For display we never need fetch, so this doesn't block the core feature.

**Coverage (verified, musicbrainz.org/statistics/coverart, June 2026):** 66.9% of *all* releases have art. Spot-checks all pass:

| Album | Release-group MBID | CAA art? |
|---|---|---|
| Kind of Blue — Miles Davis | `8e8a594f-2175-38c7-a871-abb68ec363e7` | ✅ |
| A Love Supreme — John Coltrane | `77cf47ba-58cd-3f3d-a5f9-79bf89860421` | ✅ |
| Time Out — Dave Brubeck Quartet | `035a7881-3e2c-39d2-b110-fe26a4de94e5` | ✅ |

**Estimate:** famous jazz canon (Blue Note / Impulse! / Columbia / Prestige / Verve) ≈ **near 100%**; obscure / small-label / session-bootleg long tail ≈ **20–40%**. Coverage correlates with digital/streaming availability. Plan for a real fallback (see [§6](#6-fallback-design-for-missing-covers)).

**Alternative cover source — Apple Music artwork.** If you resolve the Apple Music album anyway ([§3.2](#32-album-level-streaming-urls-apple-music--spotify)), its response carries `attributes.artwork.url` (a `{w}x{h}` template) — free hi-res covers. *But* Apple artwork has usage rules (the brand-compliance memory: never recolour; display in attributed contexts) and possible App-Review nuance. **Recommendation: CAA is the cleaner legal/visual primary; treat Apple artwork as a backfill only for records where CAA misses but Apple resolves.** → decision in §9.

### 3.2 Album-level streaming URLs — Apple Music + Spotify

#### Apple Music (the strong path)

- **Album search:** `GET /v1/catalog/{storefront}/search?term=<title artist>&types=albums` → each result has `attributes.url` (the `music.apple.com/.../album/...` link) and `attributes.artwork`.
- **Lookup by id:** `GET /v1/catalog/{storefront}/albums/{id}`.
- **★ Exact match by UPC:** `GET /v1/catalog/{storefront}/albums?filter[upc]={upc}` — *confirmed first-class endpoint.* This is the unlock: **MusicBrainz releases carry barcodes/UPCs**, so you can resolve the *exact* Apple album deterministically instead of fuzzy name-matching, sidestepping most of the namesake problem. (Falls back to name-search + the existing corroboration heuristic when a release has no barcode.)
- Same JWT ES256 auth, same corroboration toolkit as Project 2 — this is a genuine mirror of the artist work, one level down.

#### Spotify (the weak path — manage expectations)

- Client-Credentials **album search/lookup still works**: `GET /v1/search?type=album&q=<…>` (or `q=upc:<value>` for exact match), `GET /v1/albums/{id}` → `external_urls.spotify`, `images`. But **`popularity` is gone** and you'd be re-adding a Spotify client the populator dropped.
- MB **release** `url-rels` carry Spotify links (`"free streaming"` relation) **but only at the release level, not release-group** (live-verified on Kind of Blue) and coverage is sparse/community-edited.

> **Recommendation:** Make **Apple Music the resolved album-link tier** (UPC-first, name-search-fallback, corroboration-gated). For Spotify, **keep the existing search-URL behaviour** as the baseline and *optionally* upgrade to a resolved `spotify_album_url` only where MB release `url-rels` already provide one (cheap, no new API client) — otherwise search. This keeps link **parity** (both services always tappable) while being honest about where deterministic resolution is achievable. → decision in §9.

#### The album-level cascade (mirrors DetailIdentity's 3 tiers)

| Tier | Apple Music | Spotify |
|---|---|---|
| ① Curated | hand-picked `apple_album_url` for canonical records (extend `streaming_overrides.jsonl` with a record-id shape) | hand-picked `spotify_album_url` |
| ② Resolved | UPC filter → else name-search + corroboration → `attributes.url` | MB release `url-rels` (if present) |
| ③ Search fallback | `appleMusicRecordUrl(title, primaryArtist)` *(already exists, unused)* | `spotifyRecordUrl(title, primaryArtist)` *(current behaviour)* |

---

## 4. The release-group / release disambiguation problem

The brief frames this as "which release do you canonicalize on?" Two layers:

**Layer 1 — record identity: already solved.** Records are keyed on the **release-group** MBID. The release-group *is* MusicBrainz's "all versions of the same record" abstraction (`primary-type`, `first-release-date`, member releases). You are already at the right altitude for cover art and for the user's mental model of "the album". No change needed.

**Layer 2 — representative-release selection: the real, narrower problem.** Two things you need live *at the release level, not the group level* (live-verified):
- **Streaming `url-rels`** in MusicBrainz attach to individual releases.
- **CAA** ultimately stores art per release (the `/release-group/.../front` shortcut just picks one for you).
- **UPC/barcode** is a per-release property.

So when the populator enriches a release-group, it must pick **one representative release** for any release-level lookup. Proposed selection policy, in order:

1. Enumerate members: `GET /ws/2/release-group/{mbid}?inc=releases&fmt=json`.
2. Prefer **status = "Official"** + **format = "Digital Media"** (most likely to have a clean UPC + streaming link).
3. Among those, prefer **country US or XW (worldwide)**, then **earliest `date`** (closest to the canonical original; avoids "2019 Remastered" editions winning).
4. If no Digital Media, fall back to the **earliest official release overall**.
5. For **cover art specifically**, let CAA's `/release-group/.../front-500` choose (it already picks an approved front); only fall back to per-release HEAD probing when the group shortcut 404s but a member release has art.

**Recommendation: release-GROUP as the canonical identity (already true) + a "best representative release" selector for release-level lookups, biased to Official/Digital/earliest.** This gives the iconic original cover and a stable streaming target without you hand-curating release IDs. → decision in §9.

---

## 5. Record ordering / popularity signal

**Today: no order at all** (Neo4j storage order). Anything explicit is a strict improvement, and covers make order *visible* — the first three tiles set the visual hierarchy, so they should be the records that matter most.

What "important" can mean, and what it costs:

| Signal | Source | Cost | Verdict |
|---|---|---|---|
| **Release year (chronological)** | `release_year` already on node | Trivial — add `ORDER BY` to existing `r{.*}` collection, or sort in mapper | Baseline. Matches the shared-records sheet (`year DESC`). Predictable, but "newest first" ≠ "most important". |
| **Collaborator overlap** (how many graph artists appear on the record) | Derivable: `size((r)<-[:PLAYED_ON]-(:Musician))` or count distinct co-players | Cheap Cypher (one extra pattern in the detail query) | **Strong proxy for influential, cross-pollinated dates.** A record that connects many people in the graph is, in your dataset, a hub. No new data. |
| **Track count** | `track_count` already on node | Trivial | Weak alone (separates LPs from singles/compilations). Useful as a *tiebreaker* / compilation-demotion. |
| **`is_various_artists` / `secondary_types`** (compilation/live) | already on node | Trivial | Use to **demote** compilations/samplers below studio albums — covers of comps are often generic. |
| MB ratings / tags | MB API | 1 req/s crawl, sparse for jazz | Skip — poor jazz coverage, external dependency. |
| Spotify play counts | — | **Unavailable** (`popularity` removed) | Skip — dead. |
| Editorial "canonical recordings" | hand-curated | High human cost; only the 12 curated musicians | Optional gilding for the curated dozen; don't gate the feature on it. |

**Recommended ordering (all graph-derived, no populator expansion):**

> **Studio albums first, then by collaborator-overlap desc, then release-year asc, with compilations/live demoted.** Concretely, a sort key per record:
> 1. `is_various_artists` / compilation → sink to the bottom.
> 2. Primary sort: **distinct-collaborator-count on the record, desc** (graph hub-ness).
> 3. Tie-break: **release_year asc** (original eras first) — or `desc` if you prefer "recent first"; minor taste call.
> 4. Final tie-break: `title asc` for determinism.

This is computable either in Cypher (preferred — keeps the mapper pure and the order authoritative server-side, consistent with the codebase's "BFF supplies order, mapper never re-sorts" invariant) or as a pure helper in `lib/`. **Recommend Cypher**, adding a collaborator-count aggregation to the records collection in `detailCypher`. → decision in §9.

**Cap?** Today all records render. With covers, a long strip is heavier (images). Consider capping the *visible* strip (e.g. top 12–20 by the sort above) with the full set still reachable, OR lazy-load images below the fold. → minor decision, fold into §9 ordering.

---

## 6. Fallback design for missing covers

20–40% of long-tail records will have no CAA art. Today, a record with no `cover.url` shows Duo3's **flat duotone surface with no glyph** (records pass `initials={false}` and no `inst`, so the instrument `FIG_LIB` / `NoPhotoMark` system — which is *musician/instrument-keyed and explicitly excludes records* — never applies). That flat surface is acceptable but bland next to real covers.

Options:

| Fallback | Description | Effort | Notes |
|---|---|---|---|
| **Flat duotone (current)** | Coloured rectangle, title/artist text below | 0 | Works, but visually weak beside covers; inconsistent strip rhythm. |
| **Title-on-gradient "typographic cover"** | Generate a faux sleeve: family-palette gradient + the record title set in the display font | ~0.5 day | Best ratio. Reuses the family-colour palette (`graphView.css.ts`) the rest of the app uses. Every tile reads as a "cover", art or not. **Recommended.** |
| **Generic vinyl/album glyph** | One shared SVG icon | ~0.5 day | Honest but repetitive — 12 identical glyphs in a strip looks like a loading state. |
| **Record-type figure set** (à la NoPhotoMark) | Distinct art per record type (LP/live/comp) | ~1.5 days | Over-engineered for ≤40% of tiles; the type vocabulary is too coarse to be expressive. |

**Recommendation: typographic-cover fallback** (gradient + title), so the strip always reads as a record collection. It's the records analogue of NoPhotoMark without inventing a whole figure library. → decision in §9.

---

## 7. Backend changes

### 7.1 Populator (`JazzDBPopulator`)

New enrichment, mirroring the artist pattern but at release-group level. Writes directly into the per-record on-disk JSON (no new sidecar needed; or add an optional `streaming_overrides`-style record sidecar for hand-curation).

1. **Cover art** (`new module, e.g. sources/coverart.py`): for each record's release-group MBID, resolve `https://coverartarchive.org/release-group/{mbid}/front-500` (HEAD/GET, follow 307 → store the *final resolved image URL* or the stable CAA shortcut URL — see hosting decision §9). Populate `cover_art_url`; populate `cover_art_license` from the JSON listing where available. **These schema slots already exist** — this is the single highest-leverage populator job.
2. **Apple Music album URL** (extend `sources/applemusic.py` + `streaming.py`): representative-release selector (§4) → UPC filter (`filter[upc]`) → else name-search + album-title corroboration → store new `apple_album_url`. Reuse the JWT/ES256 client and the corroboration toolkit verbatim.
3. **Spotify album URL** (optional, cheap path only): read MB *release* `url-rels` for the representative release; store `spotify_album_url` when present. *Don't* build a new Spotify API client unless §9 says so.
4. **New Makefile target** `enrich-records` (cover art + album URLs), gap-fillable like `enrich-streaming-apple`, with a `.stage*_review.md` artifact for your calibration gate.

### 7.2 Aura schema (new `Record` properties)

| Property | Status | Notes |
|---|---|---|
| `cover_art_url` | **exists** (schema + Aura), always null today | populate via job #1 |
| `cover_art_license` | **exists**, always null today | populate for attribution caption |
| `cover_art_attribution` | **MISSING** — add to schema + `_record_row` + `RawRecord` + read in `mapRecordRef` | needed if any CAA image requires named attribution (CC-BY); the caption builder already supports an `attribution` field that currently has no backing data |
| `apple_album_url` | new | from job #2 |
| `spotify_album_url` | new (optional) | from job #3 |
| `apple_resolved_via` / `spotify_resolved_via` (record-level) | new (optional) | provenance, mirrors artist-level |

No `popularityScore` property — ordering is graph-derived (§5), nothing to persist.

### 7.3 BFF

- **Records query (`cypher.ts` `detailCypher`):** because `r{.*}` already returns all node props, the new `cover_art_*` / `*_album_url` fields **flow through with zero query change**. The only change needed is **ordering** — add the collaborator-count aggregation + `ORDER BY` to the records collection (§5). Mirror into `sharedRecordsCypher` if you want the "+N more" sheet consistently ordered.
- **Live-Aura-smoke** is mandatory before merging any Cypher/parse change (CLAUDE.md evergreen rule).

---

## 8. Frontend changes

Smaller than the brief implies — cover rendering already works. The work is redesign + the listen affordance.

1. **`RecordRef` + mapper:** add `appleAlbumUrl?`, `spotifyAlbumUrl?` (and read `cover_art_attribution` into `cover.attribution`). One field each in `types.ts`, one read each in `map.ts`. (`primaryArtist` derivation stays.)
2. **`AttribAlbum` redesign:**
   - Cover image stays the primary visual (already wired). Promote to a real `<img>`-quality cover with the typographic fallback (§6) when `!cover.url`.
   - **Replace the whole-tile-is-one-Spotify-link** with: tile body navigates/opens the *primary* listen action, plus a small Apple+Spotify icon pair (the `ConnRow` `.conn-act` pattern) — **Apple first per §1.3**, official artwork, `stopPropagation`. Cascade per record: `appleAlbumUrl ?? appleMusicRecordUrl(title, primaryArtist)` and `spotifyAlbumUrl ?? spotifyRecordUrl(title, primaryArtist)`. → "dual icons vs single primary action" is a §9 decision.
   - Keep title + `primaryArtist · label` + `'YY` year. Decide year-always vs year-on-hover (§9).
   - Keep the mandatory attribution `<figcaption>`.
3. **Mobile vs desktop:** the strip is already horizontal-scroll. Covers raise per-tile weight — lazy-load (`loading="lazy"` on `<img>`) below the first row; consider 250px thumbs on mobile, 500px on desktop.
4. **Tests (TDD, per repo convention):** ordering is a pure-helper/Cypher behaviour → assert order; dual-variant listen buttons → `getAllBy`/`within` (rule 11 + the dual-variant a11y memory); attribution caption fires when license/attribution non-empty; fallback renders when `cover.url` absent.

No change to `DetailIdentity`/`ConnRow` styling — reuse `.ic` / `.ic-apple` / `.ic-spotify` glyphs and brand assets as-is (compliance already passed).

---

## 9. Decisions you need to make

Each is framed with a recommendation, but it's your call.

| # | Decision | Options | Recommendation |
|---|---|---|---|
| **D1** | **Release canonicalization** | release-group identity (already true) + representative-release selector for release-level lookups | **Keep release-group identity; add Official→Digital→US/XW→earliest selector** (§4). |
| **D2** | **Ordering signal** | year / collaborator-overlap / track-count / hybrid / editorial | **Hybrid, graph-derived: studio-first, collaborator-overlap desc, year tiebreak, comps demoted** (§5). No populator expansion. |
| **D3** | **Cover-art hosting** | hotlink CAA `/front-500` directly · mirror to **R2** · store resolved archive.org URL | **Hotlink the CAA shortcut via `<img>`** for v1 (works without CORS, immutable, zero infra). Revisit R2 mirroring only if reliability/latency proves bad. |
| **D4** | **Listen affordance on the card** | dual Apple+Spotify icons (ConnRow pattern) · single primary action | **Dual icons, Apple-first** — consistent with collaborator rows, keeps link parity, brand-compliant. |
| **D5** | **Fallback for missing covers** | flat duotone (current) · typographic-cover · generic glyph · type-figure set | **Typographic-cover (gradient + title)** (§6). |
| **D6** | **Spotify album resolution depth** | search-only (current) · MB-release-url-rels upgrade · full Spotify API client | **MB-release-url-rels upgrade where free; search otherwise.** Don't rebuild a Spotify API client (§3.2). |
| **D7** | **Backwards compatibility** | migrate vs graceful fallback | **Graceful fallback** — unenriched records show typographic cover + search links; no migration. Enrichment backfills over time. |
| **D8** *(minor)* | **Year display + strip cap** | always-visible year vs on-hover; cap visible tiles vs render all | **Year always visible** (covers don't hide metadata well); **cap visible strip to ~12–20** by the D2 sort, lazy-load images. |
| **D9** *(minor)* | **Apple artwork as cover backfill** | CAA-only vs CAA→Apple-artwork backfill | **CAA-only for v1**; revisit Apple-artwork backfill if long-tail coverage hurts, mindful of Apple usage rules. |

---

## 10. Phased implementation plan

Dependencies: P5/P6/P7 (frontend) depend only on the *contract* (P4), not on enrichment being complete — they ship against graceful fallback and light up as data lands. P1–P3 (populator) are independent of each other and can run in parallel.

| Phase | Deliverable | Depends on | Risks | Est. (focused days) |
|---|---|---|---|---|
| **P0** | Investigation deepening: live CORS test (KU#1); barcode-coverage spot-check across the catalog (how many records have a UPC for exact Apple matching); confirm CAA `/release-group/front` 404-rate on a sample of obscure jazz records | — | CORS/coverage worse than estimated | 0.5 |
| **P1** | Populator **cover-art** job → populate existing `cover_art_url`/`cover_art_license` (+ add `cover_art_attribution`) | P0 | long-tail 404s; license-string variability | 1.0–1.5 |
| **P2** | Populator **Apple Music album URL** (UPC-first + name-search corroboration), `enrich-records` target + review artifact | P0; reuses §2.1 | corroboration false-negatives (abstain rate); UPC sparsity | 1.5–2.0 |
| **P3** | Populator **Spotify album URL** via MB release url-rels (cheap path only) | P2 (shares representative-release selector) | sparse MB coverage → mostly search fallback | 0.5 |
| **P4** | Aura schema props + BFF **ordering** Cypher (collaborator-count + ORDER BY) + mapper/`RecordRef` fields; **live-Aura-smoke** | P1–P3 contract (not full data) | Cypher perf of extra aggregation on high-degree nodes | 1.0 |
| **P5** | Frontend `AttribAlbum` redesign: cover + dual Apple/Spotify icons (compliance), lazy-load, mobile/desktop | P4 contract | brand-compliance regressions | 1.0–1.5 |
| **P6** | Ordering wired + verified end-to-end (visual hierarchy check with covers) | P4, P5 | order "feels wrong" → taste iteration | 0.5 |
| **P7** | Typographic-cover fallback + attribution captions audited | P5 | — | 0.5 |
| **P8** | E2E + a11y (axe 0, dual-variant `getAllBy`) + acceptance harness predicates + deploy + post-deploy bundle poll | all | App-Review nuance on album linking (see §11) | 1.0 |

**Total: ~6.5–9 focused days.** Your ~1–1.5 week framing **holds**, with the caveat that the centre of gravity is the *populator enrichment + disambiguation tuning* (P1–P3 ≈ 3–4 days), not the frontend. The frontend is light precisely because cover rendering is already plumbed. The single biggest schedule risk is the Apple album corroboration abstain-rate (P2) — budget for hand-overrides on the canonical dozen, mirroring how `streaming_overrides.jsonl` already mops up artist-level abstentions.

---

## 11. Open questions & risks (non-blocking)

1. **CORS (KU#1):** confirmed-needed only for client-side `fetch`/canvas (e.g. dominant-colour theming). `<img>` display is safe. If you ever want colour extraction, proxy through the BFF Worker. *Test before relying on client fetch.*
2. **UPC coverage in your graph:** the populator stores `catalog_number` but it's unclear how many records carry a true **barcode/UPC** from MusicBrainz. UPC-exact Apple matching is the disambiguation unlock — if barcode coverage is low, P2 leans harder on fuzzy name-matching + corroboration (more abstentions, more hand-overrides). **Quantify in P0.**
3. **App Review — album vs artist linking:** the artist-level Apple Music branding passed review (PR #147/#148). Album linking *should* fall under the same Identity Guidelines (official badge/icon, Apple-first §1.3, no recolouring). But confirm there's no album-specific clause (e.g. linking to a specific album page vs an artist page) before shipping the iOS rebuild. The web app is unaffected; only the Capacitor app hits review.
4. **Apple artwork usage rules (D9):** if you ever backfill covers from Apple's `artwork.url`, Apple's terms govern display (size, attribution, no modification) — stricter than CAA. Keep CAA primary to avoid entangling cover art with Apple's brand rules.
5. **Spotify API drift:** Spotify removed endpoints twice in 2026 (Feb/Mar). Any Spotify album-API dependency is fragile; the MB-url-rels + search approach (D6) insulates you. The amber-styled primary Spotify button treatment from the compliance work is unaffected.
6. **CAA representative-release vs cover mismatch:** the `/release-group/front` shortcut occasionally picks a release whose cover differs from the iconic original (regional variant). Low-stakes for jazz canon; acceptable for v1. Per-release selection (§4) is the escape hatch if a specific record looks wrong.
7. **Strip weight / performance:** Lighthouse perf ≥ 90 is a hard gate. Covers are the heaviest thing on the detail page — enforce `loading="lazy"`, 250px mobile thumbs, and the visible-cap (D8). Measure before merge.
8. **Duplicate records:** the no-client-dedup policy means duplicate release-groups (data-quality issue owned by the populator) will show duplicate covers. Faithful rendering stays; the populator's duplicate-warning path is the fix surface, not the frontend.

---

*End of design doc. No code changed; no commits made. Ready for review.*
