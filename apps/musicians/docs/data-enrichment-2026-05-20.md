# Data enrichment — 2026-05-20 → 2026-05-21

End of the Discogs collaboration-density push (multi-day arc that started
2026-05-18 with the realisation that whole iconic records — *Kind of Blue*,
*'Round About Midnight* — existed in the DB with half-empty personnel
because MusicBrainz per-recording credits are genuinely sparse for
pre-1970 jazz). Discogs has those missing sidemen; we now gap-fill from
Discogs with hard guard-rails (id-only resolution, never name; Discogs
tier 1 never overwrites MB tier 3; explicit consolidation toolkit for the
recurring case).

## Headline numbers (since baseline `a73593d8`, ~2026-05-18)

| | Baseline | After top-2000 + toolkit | Δ |
|---|---:|---:|---:|
| Total PLAYED_ON edges | 75,881 | **95,864** | **+19,983** |
| Person↔person collaboration pairs (new) | — | — | **+86,679** |
| Total musicians | 26,359 | **32,177** | +5,818 |
| `discogs:<id>` stub musicians | 0 | **6,730** | +6,730 |
| Records with ≥3 musicians (deep coverage) | low | high | **1,706 records jumped from ≤1 → ≥3** |
| `id_aliases.jsonl` rows (consolidation audit) | 2,176 | **2,791** | +615 |
| MB edge integrity (downgrades) | — | **0** | trust-tier rule held |

## What the top-2000 finished

- **4,633 records processed** across the top 2,000 highest-degree musicians.
- **+9,374 Discogs gap-fill edges** added during the run.
- **8,867 distinct Discogs artists resolved** through the 3-tier id-only bridge (Wikidata P1953 → QID → existing `wikidata:` node; QID → P434 → `musicbrainz:` node; or MB-side `discogs` artist url-rel → mbid).
- **+3,582 `discogs:<id>` stubs minted** — Discogs-only sidemen with no Wikidata/MB anchor for the bridge to resolve. They are real-person leaf nodes in the graph (never bands; the band-stub-drop fix is active).
- Wall-clock 11 h 27 m on commit `3ba4e5b2`. Rate stable at ~150 figs/hour by the tail end.

## Curated 12 — coverage check

All twelve curated `wikidata:Q…` IDs surfaced on the home grid are canonical (no aliases hit). The four currently-known data gaps (issue #3 on `winterized/JazzDBPopulator`):

- **Q132341 Bobby Timmons** — `years_active_end` + `picture_url` missing
- **Q105875 Herbie Hancock** — `years_active_end` missing
- **Q299208 Sonny Rollins** — `years_active_end` missing
- **Q298601 Wes Montgomery** — `years_active_end` missing

These pre-date the discogs phase — the Wikidata fetch populates `years_active_start` (P2031) but never infers `years_active_end` from death date / "present" for living artists. **The era-strip query** in the BFF (`peersByEraCypher`) gates on both endpoints non-null, so these four cards self-hide their "From the same era" rail. Fix is a small populator-side patch (post-arc follow-up); frontend is shape-correct already.

## Iconic collaboration pairs strengthened

Since baseline (incorporates the cleanup-arc that merged 319 ghost MB stubs into their `wikidata:` survivors + the top-2000 Discogs gap-fill):

| Pair | Before | After | Δ |
|---|---:|---:|---:|
| **Sun Ra Arkestra core** | | | |
| Sun Ra ↔ John Gilmore | 32 | 52 | +20 |
| Marshall Allen ↔ John Gilmore | 25 | 45 | +20 |
| Sun Ra ↔ Marshall Allen | 26 | 45 | +19 |
| **Coltrane Quartet** | | | |
| Coltrane ↔ McCoy Tyner | 24 | 42 | +18 |
| Coltrane ↔ Elvin Jones | 23 | 41 | +18 |
| **The Adderley brothers** | | | |
| Cannonball ↔ Nat Adderley | 5 | 30 | +25 |
| **Miles Davis Quintets** | | | |
| Paul Chambers ↔ Miles | 31 | 41 | +10 |
| Miles ↔ Herbie Hancock | 13 | 24 | +11 |
| Miles ↔ Wayne Shorter | 10 | 19 | +9 |
| Miles ↔ Ron Carter | 13 | 22 | +9 |
| Miles ↔ Coltrane | 29 | 33 | +4 |
| **Misc** | | | |
| Sam Jones ↔ Bobby Timmons | 8 | 12 | +4 |
| Cannonball ↔ Bobby Timmons | 0 | 2 | +2 |

## Records that went from sparse to fully populated (top 20)

| Before → After | Title |
|---|---|
| 0 → 161 | *For Four Orchestras* (Anthony Braxton) |
| 0 → 135 | *Falling Down* |
| 0 → 124 | *Eddy Louiss et Multicolor Feeling Fanfare: Live* |
| 0 → 102 | *The Good Shepherd: Original Motion Picture Soundtrack* |
| 0 → 76 | *Multicolor Feeling Fanfare* |
| 0 → 74 | *And Justice for All* |
| 0 → 73 | *Porgy & Bess* |
| 1 → 69 | *The Greatest Love Songs of All Time* |
| 0 → 67 | *Live in PARIS (Palais Des Congrès)* |
| 0 → 67 | *Live in 2004* |
| 0 → 65 | *The Planet Is Alive... Let It Live!* |
| 0 → 58 | *Maria Maria / Ultimo trem* |
| 1 → 56 | *Big Man: The Legend of John Henry* |
| 0 → 52 | *Minas* |
| 0 → 50 | *Hair* |
| 0 → 47 | *No One Home* |
| 0 → 46 | *Assim seja* |
| 0 → 46 | *Árvore* |
| 0 → 45 | *Patrice* |
| 0 → 44 | *Sentimental Feeling* |

Total: 1,706 records jumped from ≤1 to ≥3 musicians.

## Stubs consolidated by class

| Class | Count |
|---|---:|
| MB-redirect (Pass-1, `consolidate-mb-redirects`) | 1 (Dr. John this week; 7 in earlier cleanup arc) |
| Within-record name-match (Pass-2, `consolidate-by-record-name`) | 308 (this top-2000 batch) + 435 (earlier in the arc) |
| Disambig-aware (Pass-3, `consolidate-by-disambig`) | 0 auto-merges (no identical-disambig clusters in scope) |
| **Genuine namesakes preserved** (different MB bio years) | **6** Carl Perkins · George Lewis · Dave Matthews · Michael Thompson · Hal McKusick (new) · Dr. John (Pass-1 caught the duplicate; an unrelated namesake remains separate) |

The 26 indeterminate clusters from Pass-3 are in `data/.pending_review_indeterminate_namesakes.md` in the populator repo — case-by-case review for the user (cannot be merged without their approval per the discipline).

## `id_aliases.jsonl` for frontend re-pinning

- Current row count: **2,791**.
- Path: populator repo `data/id_aliases.jsonl` (or raw on GitHub: `https://raw.githubusercontent.com/winterized/JazzDBPopulator/main/data/id_aliases.jsonl`).
- Format: JSONL `{old_id, new_id, name}` per line; multi-hop chains may exist (follow until stable).
- High-profile aliases the frontend should be aware of (curated home-grid coverage): all 12 curated already canonical (no aliases hit per the 2026-05-20 probe noted in issue #3). The aliases primarily affect the broader sideman network — Paul Chambers, Jimmy Cobb, Sam Jones, Cannonball Adderley, Elvin Jones, Art Taylor, Nat Adderley, Percy Heath, Johnny Lytle, Ray Lucas, William "Peppy" Hinnant, and ~2,000 others were absorbed from `musicbrainz:<mbid>` ghosts into their `wikidata:Q…` survivors during the cleanup arc.

## Anomalies surfaced and resolved mid-run

1. **Phantom self-pairs** (Paul Chambers ↔ Paul Chambers on *Kind of Blue* and 27 others) — root cause: 319 ghost `musicbrainz:<mbid>` stub files left on disk after consolidate-musicians absorbed them into their `wikidata:Q…` twins. Fixed by `cleanup-consolidated-stubs` + alias-redirect resolver guard (commits `fb50382c`, `56ff97af`, `cbf100bf`).
2. **Engineer leak** — `_DROP_ROLE` in the role normalizer was missing `recorded` / `supervised`, so Rudy Van Gelder was being minted as a performing musician from "Recorded By" credits. Fixed; regression test asserts it stays fixed.
3. **Band-stub minting** — Discogs `rel.artists` for group artists ("The Bobby Timmons Trio") was being promoted to a Musician node. User direction was "band as relationship, not entity"; the `rel.artists → personnel` block was dropped (commit `662221fd`).
4. **Edge-loss kill risk** — initial `backfill-discogs-personnel` accumulated all candidate edges in memory and only flushed in `finally:` at run-end. Added periodic flush every 50 figures (commit `e416a033`) capping kill-risk to ~80 min.
5. **Orphan process** — a SIGTERM in the kill-and-restart flow targeted the wrong PID; the python child ran for 2h 41m orphaned on stale code. Caught by checking `git status` before committing the next work; the orphan's output was preserved and labeled (commit `c4a158ee`).
6. **Carl Perkins / George Lewis / Dave Matthews / Michael Thompson** — confirmed genuine same-name-different-person cases via MB bio probes; correctly kept separate (the discipline holds; `consolidate-mb-redirects` skips `different_bio` clusters).

## Recurring consolidation toolkit (shipped 2026-05-20)

Three CLI commands, dry-run by default, `APPLY=1` commits, idempotent re-runs, all reuse `_consolidate_stub_into(defer_edges=True)` + `drain_edge_remap_journal` (lever #3):

- `make consolidate-mb-redirects` — probe MB for redirect / same-bio pairs.
- `make consolidate-by-record-name` — within-record name-match for `discogs:<id>` stubs (the rule extension: "by id OR by exact name match within a deterministically-linked Discogs↔MB release").
- `make consolidate-by-disambig` — auto-merge identical-disambig, emit review doc for the rest.

Plus two cross-run caches (commit `87f72fef`) shipped just before this run:

- `Record.discogs_id_checked` — persisted MB↔Discogs link cache (~3 h cut per future re-run).
- `data/discogs_id_resolution.jsonl` — cross-run `discogs_id → musician_id` resolution cache covering all 3 tiers (~30–60 min cut per future re-run).

## Aura state

- Latest publish: **2026-05-21 ~02:40 CEST** — 99,372 statements via UNWIND in ~35 s (lever #2 batching). 309 DETACH DELETEs purged this round.
- Constraints: `:Musician(id)` and `:Record(id)` uniqueness intact (lever #1).
- The frontend should see the new collaboration pairs and stub musicians on the next BFF response — no frontend change required.

## Next steps (post-v1 followup)

1. Issue #3 fix — Wikidata fetch should infer `years_active_end` from death date / "present"; backfill the 4 curated. Small populator PR.
2. Bob Murphy / John Peña — 2 merge candidates flagged in the disambig review doc, awaiting user approval (case-by-case per the human-in-the-loop rule).
3. (Optional, deferred) MB↔Discogs parallelisation or local MB mirror — would cut another ~15 h off a re-run; cost/risk discussion documented in the chat log.

— *End of v1 data work.*
