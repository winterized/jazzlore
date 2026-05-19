# Neo4j DB enrichment brief — for the DB-populator

**To:** the Claude instance that populates / enriches the Jazzlore Musicians
Neo4j Aura database.
**From:** the Jazzlore Musicians frontend (v1, branch `feat/musicians-v1`).
**Grounded in:** `apps/musicians/docs/data-audit.md` (live-Aura HTTP audit,
2026-05-18). All numbers below cite that audit.
**Status of the frontend:** v1 ships now with **sparse cards by accepted
product decision** — the 12 curated iconic figures render as name + editorial
hook only (no photo, no bio) because their nodes are bare stubs. This is **not
a frontend bug**; the fix lives here, in the DB. Every item below makes the
existing frontend richer with **zero frontend change** — same node ids, same
queries, same UI.

---

## Priority-ordered checklist (do these in this order)

- [ ] **P0 — Merge the duplicate `musicbrainz:` ↔ `wikidata:` node pairs.**
      ~698 person-pairs, one node bare + high-degree, the twin enriched +
      low-degree. Single highest-leverage fix. (§2 below.)
- [ ] **P1 — Enrich by descending collaboration/edge count.** The most-visited
      nodes are the *least* presentable (48/50 top collaborators are 0-field
      stubs). Enrich high-degree first for the fastest lift to the modal
      experience. (§1 below.)
- [ ] **P1b — Explicitly ensure the 12 curated iconic figures are enriched.**
      They are ALL bare stubs today; they are the home screen. Ids listed in
      §1.3 — enrich exactly these. (§1.3 below.)
- [ ] **P2 — Stabilise the id scheme.** Keep node `id`s stable across re-runs;
      our curated list + future URLs pin them. (§3 below.)
- [ ] **P3 — Hit a coverage milestone** (suggest: top-2,000-by-edge-count
      fully enriched), not 100%. (§4 below.)

Out of scope / explicitly **not** asking: §5.

---

## §1 — Enrichment priority (highest impact)

### 1.1 The headline fact

From `data-audit.md` §1 + §3:

- **26,055** `:Musician` nodes total.
- Only **~4%** are enriched: `1,045` `wikidata:Q…` nodes vs `25,010`
  (96.0%) bare `musicbrainz:<uuid>` stubs.
- Whole-graph coverage of the fields our UI binds:
  `bio_summary` **4.0%** (1,030) · `picture_url` **2.6%** (672) ·
  `birth_year` **3.9%** (1,014) · `death_year` **1.8%** (459) ·
  `primary_instruments` **3.9%** (1,021) · `genres` **3.8%** (1,001) ·
  `wikipedia_url` **4.0%** (1,030) · `nationality` **70.8%** (18,443) **but
  mostly bare 2-letter codes** (e.g. `US`), not display names.
- In the **top-50 most-connected musicians**, only **2/50** have a bio or
  picture (Dizzy Gillespie, Barry Manilow). **48 of the 50 highest-traffic
  nodes are 0-field stubs.**

The structural consequence: the nodes a user is *most likely to land on*
(reached through hundreds of `:PLAYED_ON` edges) are exactly the ones with
nothing to show. The frontend already treats sparse as the modal path — but
that is a stopgap; the real fix is enrichment here.

### 1.2 The ask: enrich **by descending collaboration / edge count**

Order enrichment by each musician's distinct-collaborator (or `:PLAYED_ON`
edge) count, **highest first**. Rationale: edge count is a direct proxy for
how often a node is reached in the app, so each enriched high-degree node
removes a sparse render from the most user paths. (`data-audit.md` §3 lists
the top-50 with ids and collab counts as a starting batch — e.g. Paul Jackson
Jr. 831, Ron Carter 740, Randy Brecker 710.)

### 1.3 The 12 curated iconic figures — enrich these explicitly

These are the home-screen grid (`apps/musicians/src/data/curated.ts`). Today
**all 12 are bare `musicbrainz:` stubs** — confirmed live (`data-audit.md`
§5.2). They were chosen for editorial weight, so they are not necessarily the
highest-degree nodes; enrich them **regardless of where they fall in the
edge-count order**. Real node ids (pinned by our curated list):

| # | Musician | Node id (pinned) | Collabs |
|---|---|---|---:|
| 1 | Miles Davis | `musicbrainz:561d854a-6a28-4aa7-8c99-323e6ce46c2a` | 199 |
| 2 | John Coltrane | `musicbrainz:b625448e-bf4a-41c3-a421-72ad46cdb831` | 165 |
| 3 | Bill Evans | `musicbrainz:8c7aa18e-9392-47c7-9d56-97d34d746a8b` | 112 |
| 4 | Thelonious Monk | `musicbrainz:8e8c7417-c905-46b1-b42a-5260b4274ed4` | 33 |
| 5 | Bobby Timmons | `musicbrainz:ef05197e-aacb-4dbf-9cc4-2a9abee82f03` | 28 |
| 6 | Charles Mingus | `musicbrainz:f3b8e107-abe8-4743-b6a3-4a4ee995e71f` | 89 |
| 7 | Art Blakey | `musicbrainz:601e7466-eaf5-4a91-9909-ffd770b7e04a` | 211 |
| 8 | Herbie Hancock | `musicbrainz:27613b78-1b9d-4ec3-9db5-fa0743465fdd` | 407 |
| 9 | Wayne Shorter | `musicbrainz:2379937f-6e0d-46a2-b8ff-633fafd72002` | 377 |
| 10 | Cannonball Adderley | `musicbrainz:a4c73ebe-b2c7-4f13-b99d-2fe1f9f27da8` | 75 |
| 11 | Sonny Rollins | `musicbrainz:3b47247e-5b57-49b6-a0ed-bad80243802a` | 36 |
| 12 | Wes Montgomery | `musicbrainz:663f8232-8c46-4851-803f-a91d31593b14` | 36 |

> Note for #3 Bill Evans: three same-name nodes exist; we pinned the
> highest-collaboration one (112 collabs). If the §2 merge pass touches this
> name, **keep this exact id** as the survivor (or ensure it stays an alias
> target) so our curated card does not break.

### 1.4 Required fields per enriched node — and *why* the UI needs each

Field names confirmed 1:1 against live Aura (`data-audit.md` §6; schema in
`docs/FRONTEND.md`). For each enriched musician:

| Field | Type | Why the frontend needs it |
|---|---|---|
| `bio_summary` | string | The detail-page biography paragraph. Absent → the identity block renders empty. |
| `picture_url` | string | The portrait on cards + detail + graph nodes. Absent → italic "no portrait" placeholder. |
| `picture_license` | string | **LEGAL — non-negotiable.** Wikimedia Commons CC-BY / CC-BY-SA *legally require* attribution. The UI renders the picture **only** when it can render the caption. No license → we cannot legally show the picture, so we won't. |
| `picture_attribution` | string | **LEGAL — same.** The author/photographer credit shown in the caption. Public-domain images may leave both empty (caption renders nothing) — but a CC image **must** carry both. |
| `birth_year` | int (year) | Identity line + era inference fallback. |
| `death_year` | int (year) | Identity line ("1926–1991"). |
| `primary_instruments` | list[string] | Card subtitle + detail identity (e.g. "Modal · trumpet"). |
| `genres` | list[string] | Primary signal for our editorial era label (Bebop / Hard bop / Modal / …). |
| `nationality` | string | Identity line. **Must be a display name** ("United States"), **not a bare code** ("US"). Currently 70.8% present but coded — coded values are unusable as-is. |
| `wikipedia_url` | string | "More about" deep link. |

> The picture is **gated on the license + attribution being present** — sending
> `picture_url` without `picture_license`/`picture_attribution` for a
> CC-licensed image means the frontend will (correctly, deliberately) **not**
> display that picture. Treat the trio as one unit.

---

## §2 — Merge the duplicate node pairs (the structural keystone, **P0**)

From `data-audit.md` §2:

- **698** groups share a `musicbrainz_id` across **distinct** node ids.
- **100% of them** are exactly the pattern
  **`musicbrainz:<uuid>` ↔ `wikidata:Q…`, group size 2** (§2.2).
- Root cause: the populator first creates a sparse `musicbrainz:` sideman
  stub (which accrues the `:PLAYED_ON` edges), then later enriches the **same
  person as a *separate* `wikidata:` node** reusing the same `musicbrainz_id`
  — **without merging**. So enrichment lands on a **low-degree twin** while
  the **high-degree stub stays bare**. (`0` groups share `wikidata_id` or
  `discogs_id` — `musicbrainz_id` is the reliable join key.)
- The Antoine Hervé case (the known landmine) is **one instance of this exact
  pattern**, not a special case: stub `musicbrainz:b7067f5b-…` (16 collabs,
  no bio) + enriched `wikidata:Q586360` (0 collabs, bio ✓) — same
  `musicbrainz_id`.

### The ask

Run a one-time **MERGE pass keyed on shared `musicbrainz_id`** (then
`wikidata_id` as a secondary key), so the sideman stub's `:PLAYED_ON` edges
and the enriched node's biographical fields collapse onto **one** node. This
is the single highest-leverage fix: it simultaneously (a) raises effective
enrichment coverage on the high-traffic nodes, (b) fixes the duplicate-render
the frontend currently shows faithfully, and (c) makes §1 enrichment land
where the traffic is.

**Do NOT collapse genuine namesakes** (`data-audit.md` §2.2): `John Williams`
×6, `Alfredo Rodríguez` / `Jimmy Johnson` / `John Brown` ×4,
`Benny Green` / `Bill Evans` / `Christopher Williams` / `Dave Stewart` ×3 are
**different real people** — they do **not** share an external id and must stay
separate. Merge on shared external id only, never on name alone.

---

## §3 — Id scheme / stability

- Our originally-authored placeholder `wikidata:Q…` ids resolved **0/12**
  against live Aura (`data-audit.md` §5.1). The canonical figures exist only
  as `musicbrainz:<uuid>` stubs.
- The frontend now **pins the real node `id`s** (the §1.3 table) in
  `curated.ts`, and future per-musician URLs will be `/musicians/:id` using
  these exact ids.
- **Ask:** keep node `id`s **stable across re-runs / re-populations**. If a
  re-run would change a node's `id` (or the §2 merge changes which id
  survives), the surviving id for the §1.3 musicians must remain reachable
  (same id, or the old id kept as an alias/redirect target). A changed id
  silently drops a curated card or 404s a shared URL.
- Please confirm the **canonical id scheme** going forward (is `wikidata:Q…`
  the intended canonical form once enriched, with `musicbrainz:` as the
  pre-enrichment placeholder? — if so, the §2 merge should make the
  `wikidata:` id the survivor, and we will re-pin the curated ids once).

---

## §4 — Coverage target (a milestone, not "everything")

We are **not** asking for 100% enrichment of 26,055 nodes. A reasonable v1
milestone:

- **Top-2,000 musicians by `:PLAYED_ON` edge count fully enriched** (all §1.4
  fields), **plus** the 12 curated (§1.3), **plus** the §2 merge applied
  graph-wide.

Rationale: edge count is the traffic proxy; the long tail of ~24k single-
appearance sidemen can stay sparse — the frontend handles that state by
design. Top-2,000 + curated covers essentially every node a casual user will
actually reach.

---

## §5 — Explicitly OUT of scope (do **not** spend effort here for v1)

The frontend v1 does **not** need any of these — please don't block
enrichment on them:

- **Per-track listings** on record pages (`docs/FRONTEND.md` notes the data
  isn't exposed; v1 doesn't render it).
- **Per-fact provenance / citations** (we cite Wikipedia at the page level via
  `wikipedia_url`; no field-level sourcing needed).
- **Session dates / recording dates** beyond `release_year` on records.
- **100% coverage** of the 26,055 nodes (see §4 — a top-2,000 milestone is
  enough).
- **`all_instruments`** completeness (we bind `primary_instruments`;
  `all_instruments` is nice-to-have, not required).
- New relationship types or schema changes — the current schema
  (`docs/FRONTEND.md`) is sufficient; this is an **enrichment + merge** ask,
  not a remodelling one.

---

*Reproducible evidence for every number above: `apps/musicians/docs/data-audit.md`
and its harness `apps/musicians/scripts/audit.ts` (read-only, parameterized,
live Aura). The 12-id resolution is reproducible via
`apps/musicians/scripts/aura-smoke.ts` (curated = 12/12).*
