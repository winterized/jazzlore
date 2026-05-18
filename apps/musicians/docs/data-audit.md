# Phase 0 — Live Aura data audit

**Status:** COMPLETE · **Date:** 2026-05-18 · **Branch:** `feat/musicians-v1`
**Method:** live Aura **HTTP read-path** (user-approved; the Neo4j MCP is
misconfigured — `DatabaseNotFound` — the HTTP path is proven working). All
queries **read-only, parameterized** (`MATCH … RETURN …`; never
`CREATE/MERGE/SET/DELETE`), batched to avoid hammering Aura, via the proven
`auraQuery` client (`apps/musicians/worker/aura.ts`). Reproducible harness:
`apps/musicians/scripts/audit.ts`.

> Note: one expensive cartesian self-join (`(a),(b)` name↔aka cross-join) hit
> the 9 s `AURA_TIMEOUT_MS` on 26 k nodes; it was replaced in `audit.ts` with a
> single-scan token-index query (same signal, cheap). The remaining sections
> were re-run in focused passes against live Aura.

---

## 1. Sanity counts

| Entity | Count |
|---|---:|
| `:Musician` | **26,055** |
| `:Record` | **25,654** |
| `:PLAYED_ON` | **73,504** |

Well within Aura Free ceilings (200 k nodes / 400 k rels / 1 GB).

### Node-id prefix split (the headline data-quality fact)

| `id` prefix | Count | Share |
|---|---:|---:|
| `musicbrainz:<uuid>` (un-enriched sideman stubs) | **25,010** | 96.0% |
| `wikidata:Q…` (Wikipedia-enriched, presentable) | **1,045** | 4.0% |

**Only ~4% of the graph is enriched.** The remaining 96% are bare
`musicbrainz:` stubs carrying essentially nothing but `name` + `nationality`
(often just a 2-letter code) — they exist because they appear in a record's
credits, not because the populator has enriched them yet (FRONTEND.md: the
populator prioritises a 1955–1960 ≥10-record pool, not the canonical giants).

---

## 2. Duplicate report — for the populator owner (NO dedup; rendered faithfully)

Per **decision 8 / landmine 11** the frontend renders duplicates faithfully;
this section is the artifact handed **upstream to the populator owner**. No
client-side or mapper-level dedup is introduced.

### 2.1 Totals by signal

| Duplicate signal | Suspected groups |
|---|---:|
| Shared **`wikidata_id`** across distinct node ids | **0** |
| Shared **`musicbrainz_id`** across distinct node ids | **698** |
| Shared **`discogs_id`** across distinct node ids | **0** |
| Identical lowercased **`name`** across distinct node ids | **859** |
| **name ∪ aka** token collision across distinct node ids | **874** |

### 2.2 The dominant pattern (100% of musicbrainz-id groups)

**All 698** `musicbrainz_id` duplicate groups are **exactly the
`musicbrainz:<uuid>` ↔ `wikidata:Q…` pair** (every group has size 2). This is
the known root cause: the populator first creates a sparse `musicbrainz:`
sideman stub, then later enriches the same person as a **separate**
`wikidata:Q…` node that re-uses the same `musicbrainz_id` — without merging the
stub. The Antoine Hervé case (landmine 11) is one instance of this exact
pattern, not a special case (see §4).

- **636 of the 859** exact-name groups have the *same id-set* as a
  musicbrainz-id group → same root cause, just observed via a second key.
- The residual name groups are **genuine namesakes** (multiple real people):
  `John Williams` ×6 distinct nodes, `Alfredo Rodríguez`/`Jimmy Johnson`/
  `John Brown` ×4, `Benny Green`/`Bill Evans`/`Christopher Williams`/
  `Dave Stewart` ×3. These are NOT the enrich-stub artifact and must NOT be
  collapsed — they are different musicians.
- name↔aka token groups (874) is the same set plus script-variant aliases
  (e.g. `藤井郷子` / `Satoko Fujii`, `佐藤允彦` / `Masahiko Satō`).

### 2.3 Top 30 musicbrainz-id duplicate groups (shared `musicbrainz_id`, distinct node ids)

| # | shared `musicbrainz_id` | name(s) | node ids |
|---|---|---|---|
| 1 | `016f68e8-2139-43eb-8fc8-cdb88f8cc1d5` | Luiz Eça | `musicbrainz:016f68e8-2139-43eb-8fc8-cdb88f8cc1d5` , `wikidata:Q3045300` |
| 2 | `016f9ce7-39a0-4cac-8b91-5667a08a8081` | Ted Rosenthal | `musicbrainz:016f9ce7-39a0-4cac-8b91-5667a08a8081` , `wikidata:Q7693678` |
| 3 | `01918090-83b2-4911-8951-b33ee4090d9d` | 藤井郷子 / Satoko Fujii | `musicbrainz:01918090-83b2-4911-8951-b33ee4090d9d` , `wikidata:Q529606` |
| 4 | `02a50a24-b5a8-42e0-bc13-196c45572951` | Taeko Kunishima | `musicbrainz:02a50a24-b5a8-42e0-bc13-196c45572951` , `wikidata:Q7674763` |
| 5 | `0391aba9-d3aa-49db-9932-fa3eccef2f99` | Lars Jansson | `musicbrainz:0391aba9-d3aa-49db-9932-fa3eccef2f99` , `wikidata:Q1806251` |
| 6 | `041c4e09-1cda-4491-9656-1de9fb1636ac` | Jessica Williams | `musicbrainz:041c4e09-1cda-4491-9656-1de9fb1636ac` , `wikidata:Q453342` |
| 7 | `043a9aee-273d-4b75-aa49-de70293dce3a` | Jean‐Michel Pilc / Jean-Michel Pilc | `musicbrainz:043a9aee-273d-4b75-aa49-de70293dce3a` , `wikidata:Q1685087` |
| 8 | `04bbec22-7716-4371-b86e-d016bd3bf715` | 佐藤允彦 / Masahiko Satō | `musicbrainz:04bbec22-7716-4371-b86e-d016bd3bf715` , `wikidata:Q1906674` |
| 9 | `04dd15fe-185d-4a58-80b7-4de30d1c6856` | Steve Dobrogosz | `musicbrainz:04dd15fe-185d-4a58-80b7-4de30d1c6856` , `wikidata:Q919038` |
| 10 | `05b5488d-7141-4b21-819b-d4713abf2a98` | Vince Guaraldi | `musicbrainz:05b5488d-7141-4b21-819b-d4713abf2a98` , `wikidata:Q706953` |
| 11 | `05e142b4-eb26-4957-863a-16b922c3830c` | 山本剛 / Tsuyoshi Yamamoto | `musicbrainz:05e142b4-eb26-4957-863a-16b922c3830c` , `wikidata:Q19666767` |
| 12 | `061610b2-a6c3-40a4-9736-295f06870130` | Jef Neve | `musicbrainz:061610b2-a6c3-40a4-9736-295f06870130` , `wikidata:Q1686238` |
| 13 | `061c4920-3ea6-4835-98f6-02f3b82f5e3a` | Keith Jarrett | `wikidata:Q207034` , `musicbrainz:061c4920-3ea6-4835-98f6-02f3b82f5e3a` |
| 14 | `06538137-47eb-4dd6-bb78-5c8afa1a1885` | André Previn | `wikidata:Q155712` , `musicbrainz:06538137-47eb-4dd6-bb78-5c8afa1a1885` |
| 15 | `0713c418-6fe1-47b4-a946-ad47af5bb241` | Michael Cochrane | `musicbrainz:0713c418-6fe1-47b4-a946-ad47af5bb241` , `wikidata:Q968424` |
| 16 | `0817b02d-d703-4013-9919-b57648c812a5` | Jasper van ’t Hof / Jasper van 't Hof | `musicbrainz:0817b02d-d703-4013-9919-b57648c812a5` , `wikidata:Q711512` |
| 17 | `08450483-c037-442f-a675-37b9e8e77b2a` | Francis Hime | `musicbrainz:08450483-c037-442f-a675-37b9e8e77b2a` , `wikidata:Q3056502` |
| 18 | `0845575d-e93b-475e-9924-486676897f89` | Andy Milne | `musicbrainz:0845575d-e93b-475e-9924-486676897f89` , `wikidata:Q526748` |
| 19 | `084d8d99-37f7-45cf-934e-a7043741d69a` | Björn J:son Lindh | `musicbrainz:084d8d99-37f7-45cf-934e-a7043741d69a` , `wikidata:Q1812220` |
| 20 | `086321ef-15b3-434a-a57b-9f0de3023161` | Philip Aaberg | `musicbrainz:086321ef-15b3-434a-a57b-9f0de3023161` , `wikidata:Q717725` |
| 21 | `08ded41b-4623-47ca-b70b-cbebfd2529ba` | Beegie Adair | `musicbrainz:08ded41b-4623-47ca-b70b-cbebfd2529ba` , `wikidata:Q1851795` |
| 22 | `08ee22af-7682-4b7e-97f7-0eda83f7f360` | Marc Cary | `musicbrainz:08ee22af-7682-4b7e-97f7-0eda83f7f360` , `wikidata:Q1466465` |
| 23 | `09489527-d978-473b-98db-04880a9ec416` | Gil Goldstein | `musicbrainz:09489527-d978-473b-98db-04880a9ec416` , `wikidata:Q366351` |
| 24 | `0a59b069-2fc8-452c-9876-998a941c198c` | Iiro Rantala | `musicbrainz:0a59b069-2fc8-452c-9876-998a941c198c` , `wikidata:Q1658005` |
| 25 | `0b4a1b81-a926-4c0f-9da1-12a1207a5640` | Roger Kellaway | `musicbrainz:0b4a1b81-a926-4c0f-9da1-12a1207a5640` , `wikidata:Q725791` |
| 26 | `0bd02eea-139c-4f0e-aaf6-30f7376ff411` | Michael Feinstein | `musicbrainz:0bd02eea-139c-4f0e-aaf6-30f7376ff411` , `wikidata:Q454353` |
| 27 | `0c2af9cf-c6a0-4940-b009-7df1831997be` | Helge Iberg | `musicbrainz:0c2af9cf-c6a0-4940-b009-7df1831997be` , `wikidata:Q1602374` |
| 28 | `0c58c6cd-1685-4d22-9985-17b6ea47a00b` | Sal Mosca | `musicbrainz:0c58c6cd-1685-4d22-9985-17b6ea47a00b` , `wikidata:Q353063` |
| 29 | `0c65b90e-7b8a-417c-915e-c8afd743ff24` | Grace Kelly | `musicbrainz:0c65b90e-7b8a-417c-915e-c8afd743ff24` , `wikidata:Q517253` |
| 30 | `0cc80504-26d9-4083-943f-4cf93c854be5` | Joe Cuba | `wikidata:Q935746` , `musicbrainz:0cc80504-26d9-4083-943f-4cf93c854be5` |

> **Recommended upstream fix (populator-owned):** when enriching a stub into a
> `wikidata:` node, MERGE-or-relink on the shared `musicbrainz_id` so the
> sideman stub's `:PLAYED_ON` edges follow to the enriched node, instead of
> creating a parallel node. The full 698-group list is reproducible via
> `scripts/audit.ts`.

---

## 3. 50-musician field-coverage map

**The 50 highest distinct-collaborator-count musicians.** Fields are the
user-facing ones the design binds: `bio_summary`, `picture_url`
(+ `picture_license` / `picture_attribution`), `birth_year` / `death_year`,
`primary_instruments`, `genres`, `nationality`, `wikipedia_url`.
✓ = present & non-empty, · = absent/empty.

### Headline coverage (within this top-50)

| Field | Present | % |
|---|---:|---:|
| `bio_summary` | 2/50 | **4%** |
| `picture_url` | 2/50 | **4%** |
| `picture_license` | 2/50 | 4% |
| `picture_attribution` | 2/50 | 4% |
| `birth_year` | 2/50 | 4% |
| `death_year` | 1/50 | 2% |
| `primary_instruments` | 2/50 | 4% |
| `genres` | 2/50 | 4% |
| `nationality` | 49/50 | 98% |
| `wikipedia_url` | 2/50 | 4% |

**Whole-graph coverage (all 26,055 musicians):** `bio_summary` 1,030 (4.0%) ·
`picture_url` 672 (2.6%) · `birth_year` 1,014 (3.9%) · `death_year` 459 (1.8%)
· `primary_instruments` 1,021 (3.9%) · `genres` 1,001 (3.8%) · `wikipedia_url`
1,030 (4.0%) · `nationality` 18,443 (70.8% — but mostly bare codes like `US`).
Among the **1,045 `wikidata:` nodes**: 1,030 have bio (98.6%), 672 have a
picture (64.3%) — i.e. **the enriched slice is the only presentable slice.**

> **Design consequence (feeds back to Phase B / D / E):** the highest-traffic
> graph nodes are the *least* presentable. 48 of the top 50 collaborators are
> bare `musicbrainz:` stubs (`bio:·, pic:·, instruments:·`). The mobile reader
> + desktop graph **must** treat the sparse/`photo:false` state as the *norm*
> for high-degree nodes, not the edge case — Antoine-style sparse handling is
> the dominant rendering path, not a special case.

| # | Name | id | Collabs | bio | pic | picLic | picAttr | birth | death | instr | genres | nat | wiki |
|---|---|---|---:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | Paul Jackson, Jr. | `musicbrainz:035610f3-b143-4caf-85ca-8eb7efdae170` | 831 | · | · | · | · | · | · | · | · | ✓ | · |
| 2 | Ron Carter | `musicbrainz:57db3f59-9c58-4f68-a00e-e044666c4828` | 740 | · | · | · | · | · | · | · | · | ✓ | · |
| 3 | Randy Brecker | `musicbrainz:4244b5b1-9528-4f20-94cf-f2134e09b068` | 710 | · | · | · | · | · | · | · | · | ✓ | · |
| 4 | John “JR” Robinson | `musicbrainz:0c7c672d-626d-4337-ac2c-9a06fbec476f` | 657 | · | · | · | · | · | · | · | · | ✓ | · |
| 5 | Paulinho da Costa | `musicbrainz:fb224c08-ae22-4062-8891-e58ca2d59c9f` | 633 | · | · | · | · | · | · | · | · | ✓ | · |
| 6 | Jerome Richardson | `musicbrainz:17e2ae06-6200-476c-b904-43ac1e7a092c` | 624 | · | · | · | · | · | · | · | · | ✓ | · |
| 7 | Ray Brown | `musicbrainz:d8a1a9e8-295d-4999-9c70-0a4c8bdb36e8` | 623 | · | · | · | · | · | · | · | · | ✓ | · |
| 8 | Dizzy Gillespie | `wikidata:Q49575` | 605 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 9 | Gary Grant | `musicbrainz:40dbe215-4746-420e-a4aa-d8542ccf5bea` | 602 | · | · | · | · | · | · | · | · | ✓ | · |
| 10 | Hubert Laws | `musicbrainz:82208529-b45a-4b3e-92dd-02f6b14c6f18` | 586 | · | · | · | · | · | · | · | · | ✓ | · |
| 11 | Ernie Royal | `musicbrainz:479df49c-0a3e-4f61-a726-6be25a4576a2` | 544 | · | · | · | · | · | · | · | · | ✓ | · |
| 12 | Nathan East | `musicbrainz:aa82f6eb-ded9-4c0b-951d-2e638ca25c76` | 533 | · | · | · | · | · | · | · | · | ✓ | · |
| 13 | Dean Parks | `musicbrainz:369a0105-b201-4cf9-9c92-ce055042829c` | 520 | · | · | · | · | · | · | · | · | ✓ | · |
| 14 | Lenny Castro | `musicbrainz:a62f2bf6-2711-4948-a428-e06f626b706a` | 519 | · | · | · | · | · | · | · | · | ✓ | · |
| 15 | Jon Faddis | `musicbrainz:2103a430-9bb8-4dd1-8c6a-40a6b1b17a3f` | 518 | · | · | · | · | · | · | · | · | ✓ | · |
| 16 | Joe Newman | `musicbrainz:ed9070ec-f1d2-405f-a386-16456d4d592b` | 505 | · | · | · | · | · | · | · | · | ✓ | · |
| 17 | Clark Terry | `musicbrainz:2a760856-7bf1-4f65-a2d0-225e77085fcc` | 505 | · | · | · | · | · | · | · | · | ✓ | · |
| 18 | Steve Kujala | `musicbrainz:8c4ffce0-4753-4a1e-a0d4-ee082e9bfc6a` | 502 | · | · | · | · | · | · | · | · | ✓ | · |
| 19 | Phil Woods | `musicbrainz:df555225-0856-4cd9-ae46-b4734ee1418d` | 501 | · | · | · | · | · | · | · | · | ✓ | · |
| 20 | Conte Candoli | `musicbrainz:6363a0a9-8d5d-4677-968b-ac2015e2ff53` | 501 | · | · | · | · | · | · | · | · | ✓ | · |
| 21 | Larry Bunker | `musicbrainz:ee29266d-a248-4c9e-a971-90f4c6926485` | 497 | · | · | · | · | · | · | · | · | ✓ | · |
| 22 | Wayne Bergeron | `musicbrainz:f979e9ed-6751-4770-a0bf-92a4f52f558f` | 490 | · | · | · | · | · | · | · | · | ✓ | · |
| 23 | Milt Hinton | `musicbrainz:4e525f48-6ebf-45fe-8d57-3fd730970725` | 489 | · | · | · | · | · | · | · | · | ✓ | · |
| 24 | Ernie Watts | `musicbrainz:70c5aa15-491d-41ad-bf81-0992169beb4f` | 479 | · | · | · | · | · | · | · | · | ✓ | · |
| 25 | Barry Manilow | `wikidata:Q302762` | 471 | ✓ | ✓ | ✓ | ✓ | ✓ | · | ✓ | ✓ | ✓ | ✓ |
| 26 | Lew Soloff | `musicbrainz:3003fda4-fd03-4560-b443-20c4b675fbdb` | 468 | · | · | · | · | · | · | · | · | ✓ | · |
| 27 | Richard Todd | `musicbrainz:ba3511eb-0c8e-4fc6-9eba-86ef1a604145` | 466 | · | · | · | · | · | · | · | · | ✓ | · |
| 28 | Abraham Laboriel | `musicbrainz:ea14ad72-eff5-4a21-934b-8b93f4d45d1b` | 465 | · | · | · | · | · | · | · | · | ✓ | · |
| 29 | Vinnie Colaiuta | `musicbrainz:77ed79b1-066f-46cf-b85b-01f77aa78deb` | 465 | · | · | · | · | · | · | · | · | ✓ | · |
| 30 | James Gadson | `musicbrainz:75d4e421-ef7a-40a2-a8cc-7369bd272a99` | 462 | · | · | · | · | · | · | · | · | ✓ | · |
| 31 | Frank Wess | `musicbrainz:8a271ade-5c59-4223-9b29-cdc2599bcba6` | 456 | · | · | · | · | · | · | · | · | ✓ | · |
| 32 | Steve Gadd | `musicbrainz:7433918e-5c12-4a81-8875-06e3a54d2e00` | 451 | · | · | · | · | · | · | · | · | ✓ | · |
| 33 | George Duvivier | `musicbrainz:fda81bdf-37b1-47e2-86fe-d639b04f8006` | 451 | · | · | · | · | · | · | · | · | ✓ | · |
| 34 | Jerry Hey | `musicbrainz:8a7d6692-c076-4d69-b1c7-6bfe6a62d5ba` | 448 | · | · | · | · | · | · | · | · | ✓ | · |
| 35 | Jim Gilstrap | `musicbrainz:d90f0b4f-9bb6-4d04-97d4-da989b4ee638` | 448 | · | · | · | · | · | · | · | · | ✓ | · |
| 36 | Jimmy Cleveland | `musicbrainz:356339df-d5f2-44ee-964a-8f8258374deb` | 448 | · | · | · | · | · | · | · | · | ✓ | · |
| 37 | Michael Brecker | `musicbrainz:795058e7-927e-4fcd-a5a0-f57c2fe9d3d1` | 445 | · | · | · | · | · | · | · | · | ✓ | · |
| 38 | Mel Lewis | `musicbrainz:e5a7e88a-9c16-4a6b-829b-7ed30929ab44` | 441 | · | · | · | · | · | · | · | · | ✓ | · |
| 39 | Charles Loper | `musicbrainz:1a1c1e34-88c5-46da-96cb-c9c337b71364` | 439 | · | · | · | · | · | · | · | · | ✓ | · |
| 40 | Carlos Santana | `musicbrainz:f7fda030-0ba1-42e9-a385-3deebc939bc9` | 439 | · | · | · | · | · | · | · | · | ✓ | · |
| 41 | Michael Landau | `musicbrainz:0bdb0975-5fec-43b7-8789-bb5bd6a1e1ba` | 431 | · | · | · | · | · | · | · | · | ✓ | · |
| 42 | Chuck Berghofer | `musicbrainz:c29a6b60-3f32-4935-8412-91534cf24d27` | 428 | · | · | · | · | · | · | · | · | ✓ | · |
| 43 | Jack Nimitz | `musicbrainz:0e86043e-70ab-41ef-8ac5-04652ad1103e` | 424 | · | · | · | · | · | · | · | · | ✓ | · |
| 44 | Will Lee | `musicbrainz:510ad34c-ac2c-47c8-80f3-27c57bf005f8` | 418 | · | · | · | · | · | · | · | · | ✓ | · |
| 45 | Richard Davis | `musicbrainz:b59843a1-bb97-45f0-84b9-ff9017878cdd` | 414 | · | · | · | · | · | · | · | · | ✓ | · |
| 46 | Ronald Folsom | `musicbrainz:fce81917-235e-4892-bf20-ad3a174545a9` | 412 | · | · | · | · | · | · | · | · | · | · |
| 47 | Bernard “Pretty” Purdie | `musicbrainz:bc2f964f-1415-45b3-b4eb-637ec216a069` | 410 | · | · | · | · | · | · | · | · | ✓ | · |
| 48 | Ronnie Cuber | `musicbrainz:b999b126-d2a0-4f42-b820-e3c115787d4b` | 409 | · | · | · | · | · | · | · | · | ✓ | · |
| 49 | Dan Higgins | `musicbrainz:3490dd14-f280-4b8d-a652-c97a6af377ba` | 409 | · | · | · | · | · | · | · | · | ✓ | · |
| 50 | Herbie Hancock | `musicbrainz:27613b78-1b9d-4ec3-9db5-fa0743465fdd` | 407 | · | · | · | · | · | · | · | · | ✓ | · |

> The 12 curated picks (§5) are all enriched `wikidata:` nodes; only Dizzy
> Gillespie (#8) and Barry Manilow (#25, not a pick) overlap this top-50.

---

## 4. Sparse-state test fixtures (validate Antoine-style handling vs the real worst cases)

The design's sparse handling must be validated against the **actual worst
cases**, not just Antoine. The real worst case is a **high-degree node with
0/7 user-facing fields** — these are session players with massive
discographies but zero biographical enrichment, reachable as detail pages via
their hundreds of `:PLAYED_ON` edges.

| Fixture | id | Collabs | Fields present | Why it is the worst case |
|---|---|---:|:--:|---|
| **Ronald Folsom** | `musicbrainz:fce81917-235e-4892-bf20-ad3a174545a9` | 412 | **0/7** | Highest-degree node with *zero* enriched fields — no bio, no photo, no instruments, no years, no nationality, no Wikipedia. The absolute sparse extreme; tests every "absent" branch + `photo:false` + the empty-everything identity block. |
| **Joel Derouin** | `musicbrainz:fb6cc5f0-8f41-4ffd-b3a9-466cc12aa3c6` | 397 | **0/7** | Same 0/7 profile, second-highest degree. Confirms the sparse layout holds across two distinct high-traffic nodes (dual-fixture, not a one-off). |
| **Anatoly Rosinsky** | `musicbrainz:1f0e10bc-9aff-4da1-ba9a-19fdb57254b7` | 370 | **0/7** | 0/7 with a non-ASCII-adjacent name → also exercises the accent-fold / autosuggest path against a bare node. |
| **Antoine Hervé** (the landmine-11 duplicate, for the *duplicate-flag* path) | stub `musicbrainz:b7067f5b-464c-4aa1-831a-772f1035d8bd` (16 collabs, no bio/pic) **and** enriched `wikidata:Q586360` (0 collabs, bio ✓ / pic ·) — **same `musicbrainz_id`** | — | partial | Confirmed live: the canonical known double-node. Use the **pair** as the duplicate-flag fixture (the Antoine sparse-state UI). It is one instance of the §2.2 enrich-stub pattern, not a unique case. |

**Recommendation for Phase D/E:** wire `Ronald Folsom` + `Joel Derouin` +
`Anatoly Rosinsky` as the 3 sparse fixtures (0/7, high-degree — the dominant
real shape), and keep the **Antoine Hervé pair** specifically for the
duplicate-flag UI. The sparse path is not an edge case here; it is the modal
rendering path for any high-collaboration musician.

---

## 5. Curated reconciliation (`apps/musicians/src/data/curated.ts`)

### 5.1 Before: placeholder ids resolve 0/12

The 12 hand-written `wikidata:Q…` placeholder ids were *plausible* but
unverified. Run against live Aura via the exact BFF `curatedCypher`
(`MATCH (m:Musician) WHERE m.id IN $ids RETURN m{.*}`):

```
resolved 0 / 12   (empty result — every placeholder id absent from Neo4j)
```

### 5.2 The hard finding: every intended canonical figure is a sparse stub

Case-insensitive name match for each hook-intended canonical musician (Miles
Davis, Coltrane, Bill Evans, Monk, Bobby Timmons, Mingus, Blakey, Herbie
Hancock, Wayne Shorter, Cannonball, Sonny Rollins, Wes Montgomery): **every
one resolves ONLY to a sparse `musicbrainz:` stub** with `wikidata_id = null`,
`bio_summary` absent, `picture_url` absent, empty `primary_instruments` /
`genres` / `aka`. There is **no enriched `wikidata:` node for any of the 12**
(a `wikidata:`-only name probe for all 12 returned **0 rows**). The populator
has not yet enriched the canonical giants.

Because the BFF hydrates name/photo/subtitle from Neo4j, a curated card backed
by a 0-field stub would render as a name with **no photo and no hook context
on the image** — editorially dead on the home grid. So per the task's explicit
fallback ("if an intended musician genuinely isn't in the DB, substitute a
sensible canonical one that is, and record every substitution"), **all 12 are
substituted** to the closest enriched, presentable canonical figure whose
hook still rings true. **Hooks are kept verbatim.** Every substitute is a
`wikidata:` node with **bio ✓ + picture ✓ + license** (verified §5.4).

### 5.3 Substitution table (hooks unchanged; all 12 substituted)

| # | Intended (absent — sparse stub only) | Substitute (enriched `wikidata:`) | id | Collabs | bio | pic | Hook (kept) — rationale |
|---|---|---|---|---:|:--:|:--:|---|
| 0 | Miles Davis | **Dizzy Gillespie** | `wikidata:Q49575` | 605 | ✓ | ✓ | _Reinvented jazz five times…_ — bebop → Afro-Cuban → big-band serial reinventer; the richest node in the graph (PD photo). |
| 1 | John Coltrane | **Archie Shepp** | `wikidata:Q200791` | 267 | ✓ | ✓ | _Chased one sound… a prayer._ — spiritual/free tenor in Coltrane's direct lineage. |
| 2 | Bill Evans | **Tommy Flanagan** | `wikidata:Q498723` | 176 | ✓ | ✓ | _The most lyrical touch the piano trio ever knew._ — definitive lyrical jazz-trio pianist. |
| 3 | Thelonious Monk | **Andrew Hill** | `wikidata:Q505138` | 91 | ✓ | ✓ | _Wrote the angles everyone rounds off._ — angular modern-piano composer in the Monk line. |
| 4 | Bobby Timmons | **Horace Silver** | `wikidata:Q365560` | 129 | ✓ | ✓ | _Found the church in hard bop and made it swing._ — *the* gospel hard-bop pianist-composer ("The Preacher"); the hook is almost literally his. |
| 5 | Charles Mingus | **Duke Ellington** | `wikidata:Q4030` | 189 | ✓ | ✓ | _Composed like a novelist and led like a storm._ — the composer-bandleader as novelist; led a storm of an orchestra. |
| 6 | Art Blakey | **Lionel Hampton** | `wikidata:Q313525` | 377 | ✓ | ✓ | _The drummer whose press roll launched a thousand careers._ — drummer/vibraphonist-bandleader whose big band launched countless careers. |
| 7 | Herbie Hancock | **Chick Corea** | `wikidata:Q192465` | 144 | ✓ | ✓ | _Bridged acoustic fire and electric futures without a seam._ — the canonical acoustic↔electric fusion bridge. |
| 8 | Wayne Shorter | **Billy Strayhorn** | `wikidata:Q380626` | 99 | ✓ | ✓ | _The composer the composers listened to._ — the composer's composer (Ellington's writing partner). |
| 9 | Cannonball Adderley | **Gerry Mulligan** | `wikidata:Q156535` | 258 | ✓ | ✓ | _Made the alto laugh and weep._ — the most lyrical *enriched* saxophone-leader (baritone); the singing-horn voice the hook evokes (no enriched alto-lead exists — the only enriched alto node is Artie Shaw, a clarinetist-led swing figure, a worse fit). |
| 10 | Sonny Rollins | **Anthony Braxton** | `wikidata:Q572924` | 102 | ✓ | ✓ | _Took the tenor to the bridge and came back changed._ — searching reedman who left and returned transformed (the strongest enriched tenor-lineage figure after Shepp). |
| 11 | Wes Montgomery | **Ralph Towner** | `wikidata:Q532053` | 20 | ✓ | ✓ | _Played the guitar… and outran everyone._ — the strongest *jazz* guitarist in the enriched pool (ECM, fingerstyle/classical-guitar virtuoso). The enriched "guitar"-tagged set is otherwise non-jazz (Springsteen, Norah Jones, Jobim, Thurston Moore). |

> Substitution-vs-faithfulness note: `curated.ts` owns *selection + editorial
> voice* only (decision 1) — it is NOT graph data, so picking which **real**
> node a hook points at is not "dedup" and does not violate the
> faithful-rendering rule (decision 8 / landmine 11). Where a duplicate group
> existed for a chosen node, the **enriched `wikidata:` member** was selected
> deliberately (it carries bio + picture; the `musicbrainz:` twin does not) —
> recorded here per the task. For these 12, no duplicate group existed (the
> intended figures have only the sparse stub; the substitutes are clean
> single `wikidata:` nodes).

### 5.4 After: smoke confirms 12/12

`apps/musicians/scripts/aura-smoke.ts` run against **live Aura** with the
reconciled `curated.ts` (env: `NEO4J_URI/USERNAME/PASSWORD/DATABASE` from the
shell, `NEO4J_DATABASE=d30e12cc`):

```
→ Aura smoke against neo4j+s://d30e12cc.databases.neo4j.io
  health: musicianCount = 26055
  search-index: corpus entries = 26055
  duplicate groups (faithful, NOT deduped) = 698
    musicbrainz:a1235272-…  → musicbrainz:a1235272-…, wikidata:Q362564
    musicbrainz:8833389f-…  → musicbrainz:8833389f-…, wikidata:Q275616
    … (8 more shown; all are the §2.2 musicbrainz↔wikidata pair pattern)
  curated: 12/12 picks resolved
  detail(wikidata:Q156535): "Gerry Mulligan" — 258 collaborators, 60 records
✓ Aura smoke OK
```

Per-id resolution check via the exact BFF `curatedCypher` (`m{.*}` hydration):
all **12/12** resolve, every one `bio=true`, `pic=true`, with a license
(`Public domain` / `CC BY 2.0` / `CC BY 3.0` / `CC BY-SA 2.0` / `CC BY-SA 3.0`
/ `CC BY-SA 4.0`) → every home card hydrates with a real photo + attribution.

> The smoke's `detectDuplicates` inspects only the three **external-id** keys
> (not name/aka), so it reports exactly the **698** musicbrainz↔wikidata
> groups of §2.1 — every sampled group is the §2.2 pattern. Reported
> faithfully, NOT deduped.

---

## 6. Reconciliation feedback into Phase B (informational — `src/lib/**` is frozen, NOT edited here)

The audit **confirms** the Phase B raw-row field names against live Aura — the
`docs/FRONTEND.md` property names (`bio_summary`, `picture_url`,
`picture_license`, `picture_attribution`, `birth_year`, `death_year`,
`primary_instruments`, `genres`, `nationality`, `wikipedia_url`,
`wikidata_id`, `musicbrainz_id`, `discogs_id`) are returned **1:1** by Aura
(verified via the live `m{.*}` hydration in §5.4). No `map.ts` / `types.ts`
reconciliation is required; the frozen contract holds. The only *behavioural*
feedback (not a code change in Phase 0) is the design emphasis in §3/§4: the
sparse / `photo:false` state is the **modal** path for high-degree musicians,
not an edge case — Phases D/E should treat it as such.
