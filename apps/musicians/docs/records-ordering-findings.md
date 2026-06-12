# Records ordering — P6 taste-gate findings

**Status:** Awaiting Aurélien's taste call · **Date:** 2026-06-12 · **Owner decision required (D2).**

The redesigned record strip makes the **first 3 tiles** the dominant visual on the
detail page. D2 (approved) ordered them by *collaborator-overlap* as an
"importance" proxy. **Live-Aura verification shows that proxy fails**, and a
bake-off across every other graph signal shows **none reliably surfaces a
musician's important records.** This is a genuine product call, not a bug — so
it's surfaced here for you rather than silently changed. The committed code
still ships the approved D2; the recommended change is a one-line Cypher diff
(below).

## What D2 actually produces (live Aura)

Top of the strip, current `collabCount DESC` ordering:

| Musician | #1 | #2 | #3 | Kind-of-Blue-class record |
|---|---|---|---|---|
| Miles Davis | Legrand Jazz '16 | Aura '89 | Music for Brass '57 | **Kind of Blue → #49** |
| John Coltrane | Legrand Jazz '16 | Legrand Jazz '58 | New York N.Y. '59 | A Love Supreme buried |
| Bill Evans | Late Night Cannonball Adderley '24 | Symbiosis '94 | Legrand Jazz '16 | Sunday at the Vanguard buried |

**Root cause:** `count(distinct collaborators on the record)` rewards **ensemble
size**, not influence. A star-studded big-band date (Michel Legrand's *Legrand
Jazz*, 1958) has the most graph musicians on it, so it tops **all three**
musicians. Small-combo masterpieces (Kind of Blue is a sextet) sink. Modern
various-artists compilations (*Late Night Cannonball Adderley*, 2024) also float
up. Net: the most prominent tiles are the *least* representative records.

## The bake-off — every graph-derived signal tested

`scripts/analyze-ordering.ts` (read-only, live Aura) ranks each musician's
records under five strategies. Verdicts:

| Strategy | Result | Verdict |
|---|---|---|
| **A. collabCount DESC** (= D2) | big-band + VA comps first | ✗ orchestra/comp bias |
| **B. leader-first** (focus is leader/co-leader) | Miles → "The Man With the Horn" '81, "We Want Miles" '96; A Love Supreme appears for Coltrane but so does "Bassoon XX" '02 | ✗ **role data too sparse** — Kind of Blue isn't even role-tagged leader; only a handful of (often late/odd) records carry the role |
| **C. leader-first + collab** | role-tagged big records (Everything's Beautiful '16, Symbiosis '94) | ✗ same sparsity, plus collab bias |
| **D. notable (Wikipedia/Wikidata link) first** | **collapses to chronological** | ✗ **records carry ZERO wiki links** — "0 notable" for Miles *and* Coltrane; the populator never enriched records with wiki IDs |
| **E. notable + leader** | same collapse | ✗ |

**The decisive fact:** the `:Record` nodes do **not** carry the two signals that
*would* encode importance — Wikipedia/Wikidata links (0% coverage) and reliable
leader roles (sparse). External popularity is also gone (Spotify `popularity`
removed Feb 2026; MB ratings sparse for jazz — see the design doc §3.2/§5). So
**there is no data-driven way to put "the masterpieces first."**

## The honest options (your call — D2)

Given the data can't rank importance, the choice is a framing decision:

| Option | One-liner | Pros | Cons |
|---|---|---|---|
| **1. Chronological, comps demoted** *(recommended)* | studio albums first (`is_various_artists` + compilation/live last), then `release_year ASC`, then title | clean discography timeline; predictable; removes the big-band/VA noise; never *claims* a false "importance" hierarchy | early-career records lead (not the icons); a timeline, not a greatest-hits |
| **2. Keep D2 (connectedness)** | collabCount DESC | thematically on-brand for a *connection graph* — "their most-collaborative dates"; already shipped | reads as importance but isn't; surfaces non-iconic records first (the screenshots) |
| **3. Editorial canon** | hand-curated "essential records" per the 12 curated musicians, then chronological | the ONLY way to get true "masterpieces first" | manual; only scales to the curated dozen; new populator/data work (was out of scope for this project) |
| **4. Recent first** | `release_year DESC` | shows latest reissues/activity | arbitrary for importance; surfaces 2-CD reissues |

### Recommended: Option 1 (chronological, comps demoted)

Rationale: with covers prominent, the safest order is one that's **meaningful and
honest** rather than a misleading importance proxy. A discography timeline reads
naturally ("their records, early → late"), removes the embarrassing
big-band/2024-compilation-first result, and needs no new data. It won't put Kind
of Blue first — nothing in the data can — but it never *pretends* to rank
importance, so the wrong-hierarchy problem disappears. If you want the icons
first, that's Option 3 (editorial), which is a separate, curated effort.

**Exact change** (replace the D2 `ORDER BY` in `worker/cypher.ts` `detailCypher`;
drop the `collabCount` `OPTIONAL MATCH`/`WITH` since no other tier needs it):

```cypher
OPTIONAL MATCH (m)-[fe:PLAYED_ON]->(r:Record)
WITH m, r, fe
ORDER BY coalesce(r.is_various_artists, false) ASC,           -- comps/VA last
         CASE WHEN r.type IN ['compilation','live'] THEN 1 ELSE 0 END ASC,
         coalesce(r.release_year, 99999) ASC,                 -- timeline
         r.title ASC
WITH m, collect(DISTINCT { record: r{...}, edge: properties(fe) }) AS records
```

This also *removes* the extra `(r)<-[:PLAYED_ON]-(co)` expansion, so it's
slightly cheaper than D2 (the 122ms Miles query gets faster, not slower).

The unit-test guard in `worker/cypher.test.ts` (`detailCypher — record ordering`)
would update to assert the new `ORDER BY` shape; `is_various_artists` ASC is
already there, so only the collab tier is removed and the comp-type tier added.

> Want me to apply Option 1 (or any other)? It's a ~10-line change + test update
> + re-run of the live-Aura smoke. Left unimplemented pending your taste call —
> the screenshots in `test-results/records-redesign/` show D2's current result so
> you can judge from pixels.
