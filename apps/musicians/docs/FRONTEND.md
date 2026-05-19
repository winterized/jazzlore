# JazzDBPopulator — Frontend Handoff

A short handoff for a frontend / Claude Design / new Claude Code session
building a UI on top of this project's data. Tells you what exists, where
it lives, and what to ignore.

## TL;DR

- The runtime data lives in a **Neo4j Aura Free** instance.
- You query it with **Cypher**.
- Treat Aura as **read-only** — writes happen via a separate populator
  (cron-driven; you never touch it).
- **Connection URI, username, and password come from the project owner**
  out-of-band (they're in the populator's `.env`, never in this repo).

## What's in the graph

> **Correction (2026-05-19, populator-reported).** An earlier read of this
> handoff inferred that the 10 user-facing fields (`bio_summary`,
> `picture_url`, `picture_license`, `picture_attribution`, `birth_year`,
> `death_year`, `primary_instruments`, `genres`, `nationality`,
> `wikipedia_url`) were "dropped at export" / "not yet exposed in Neo4j".
> **That is wrong.** All 10 were *always* exported — the schema table below
> has always been accurate. Field coverage rose because upstream nodes are
> now **enriched** (the P0 duplicate-merge + 12-curated + top-50 + nationality
> normalization landed), **not** from any export/schema change. The query
> contract is unchanged: **no query changes are needed.** The schema
> reference below stands as-is.

### Nodes

**`:Musician`** — one per musician (canonical jazz figures plus sidemen
who appear on records).

| Property | Type | Notes |
|---|---|---|
| `id` | string | Canonical, e.g. `"wikidata:Q132341"` (Wikidata-anchored) or `"musicbrainz:<mbid>"` (sideman stubs not yet enriched). |
| `name` | string | Display name. |
| `aka` | list[string] | Aliases / birth names. May be empty. |
| `primary_instruments` | list[string] | e.g. `["piano"]`. |
| `all_instruments` | list[string] | Instruments they're credited on anywhere. May be a superset of `primary_instruments`. |
| `birth_year` | int | Year only. May be absent. |
| `birth_date` | string | ISO `"YYYY-MM-DD"` when full date is known; absent otherwise. |
| `birth_place` | string | May be absent. |
| `death_year` | int | Year only. May be absent. |
| `death_date` | string | ISO `"YYYY-MM-DD"` when known; absent otherwise. |
| `death_place` | string | May be absent. |
| `years_active_start` | int | First year of recorded activity. |
| `years_active_end` | int | Last year of activity (absent if still active). |
| `nationality` | string | e.g. `"United States"`. May be absent. |
| `genres` | list[string] | e.g. `["bebop", "hard bop"]`. May be empty. |
| `picture_url` | string | Free-licensed Commons image. May be absent. |
| `picture_license` | string | e.g. `"CC BY-SA 3.0"`. **Required to display the picture per the license terms.** |
| `picture_attribution` | string | Author / photographer. **Required to display alongside any CC-BY image.** |
| `wikipedia_url` | string | English Wikipedia article. May be absent. |
| `wikidata_id` | string | e.g. `"Q132341"`. Useful for "open in Wikidata" links. |
| `musicbrainz_id` | string | UUID, e.g. `"ef05197e-…"`. Useful for "open in MusicBrainz" links. |
| `discogs_id` | string | e.g. `"262127"`. Useful for "open in Discogs" links. |
| `bio_summary` | string | First paragraph of Wikipedia article (~300-500 chars). May be absent. |

**`:Record`** — one per album / EP / live release. Always tied to a
MusicBrainz release-group.

| Property | Type | Notes |
|---|---|---|
| `id` | string | Canonical, e.g. `"musicbrainz:<release-group-uuid>"`. |
| `title` | string | |
| `type` | string | Primary MusicBrainz type. One of `"album"`, `"ep"`, `"single"`, `"compilation"`, `"live"`, `"soundtrack"`, `"other"`. |
| `secondary_types` | list[string] | MB secondary types: `"Live"`, `"Soundtrack"`, `"Demo"`, `"Broadcast"`, etc. Empty for plain studio albums. (Records tagged `"Compilation"` are filtered at ingest, so you won't see them in Neo4j.) |
| `is_various_artists` | bool | True iff the record's MB artist-credit is the "Various Artists" sentinel entity. Almost always false (V/A records are filtered at ingest) but present so multi-artist samplers we deliberately let through can still be identified. |
| `release_year` | int | Year of first release. May be absent. |
| `recording_year` | int | Often the same as release_year for jazz, but can differ. May be absent. |
| `recording_location` | string | Studio / venue / city, e.g. `"Reeves Sound Studios, NYC"`. May be absent. |
| `label` | string | e.g. `"Riverside"`, `"Blue Note"`. May be absent. |
| `catalog_number` | string | e.g. `"RLP 12-317"`. May be absent. |
| `producer` | list[string] | May be empty. |
| `engineer` | list[string] | May be empty. |
| `track_count` | int | Number of tracks on the record. May be absent. |
| `cover_art_url` | string | Free-licensed cover art. May be absent. |
| `cover_art_license` | string | e.g. `"CC BY-SA 4.0"`. Display when the image is shown. |
| `wikipedia_url` | string | May be absent. |
| `wikidata_id` | string | May be absent. |
| `musicbrainz_id` | string | UUID. May be absent. |
| `discogs_id` | string | May be absent. |

### Edges

**`(:Musician)-[:PLAYED_ON]->(:Record)`**

| Property | Type | Notes |
|---|---|---|
| `instruments` | list[string] | What the musician played on this record, e.g. `["piano"]`, `["drums (drum set)"]`. |
| `role` | string | One of `"leader"`, `"co-leader"`, `"sideman"`, `"guest"`, `"vocalist"`, `"composer"`, `"arranger"`. |
| `tracks` | string \| list[int] | Either the literal string `"all"` (the musician is on the whole record) or a list of track numbers. |

### ⚠️ Image attribution is mandatory

When you display a `picture_url` or `cover_art_url`, you **must** also display
the corresponding `*_license` and `*_attribution` (for `picture_url`) values.
Wikimedia Commons CC-BY and CC-BY-SA licenses legally require attribution.
Public-domain images don't, but the field will be empty in that case anyway,
so just rendering "Photo: {attribution} ({license})" whenever non-empty is
the safest pattern.

### What's NOT (yet) exposed in Neo4j

- **Full track listings** with per-track titles, durations, and composers.
  Currently only `track_count` lands in Neo4j. Tracks are nested objects so
  they'd need to be modelled as separate `:Track` nodes with `:HAS_TRACK`
  edges. Easy to add when you need a tracklist UI — ping the populator owner.
- **Per-fact source provenance** (which sources vouch for each fact). Lives
  in the JSON store under each entity's `sources` field. Useful for an
  "audit trail" UI but not common; ask if you want it.
- **Recording dates** (specific session dates, when known).

If you need any of these, the export is in `jazzdb/store.py` —
`_cypher_create_musician` / `_cypher_create_record` / `_cypher_create_edge`
— and adding fields is straightforward.

## How to connect

### Recommended: thin BFF (backend-for-frontend)
Don't put Aura credentials in browser-side JS. Run a small backend that:
1. Holds credentials in env vars.
2. Exposes a small JSON / GraphQL API the browser can hit.

Node example:
```js
import neo4j from "neo4j-driver";
const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD),
);
```

Python example:
```python
from neo4j import GraphDatabase
driver = GraphDatabase.driver(uri, auth=(username, password))
```

### Prototyping shortcut: direct from browser
Aura speaks HTTPS, so a browser can talk to it directly. Acceptable for
design mocks and demos. **Not for production** — credentials end up in
the JS bundle.

## Sample Cypher queries

```cypher
// Pick a musician and see everything they played on
MATCH (m:Musician {name: "Bobby Timmons"})-[:PLAYED_ON]->(r:Record)
RETURN m, r
ORDER BY r.release_year
```

```cypher
// Who played with whom (collaborations via shared records)
MATCH (m:Musician {name: "Bobby Timmons"})-[:PLAYED_ON]->(r:Record)
      <-[:PLAYED_ON]-(other:Musician)
WHERE other <> m
RETURN DISTINCT other.name, r.title, r.release_year
ORDER BY r.release_year
LIMIT 50
```

```cypher
// Search by name (case-insensitive prefix)
MATCH (m:Musician)
WHERE toLower(m.name) STARTS WITH toLower($q)
RETURN m
LIMIT 20
```

```cypher
// All records on a label, sorted by year
MATCH (r:Record {label: $label})
RETURN r
ORDER BY r.release_year
LIMIT 100
```

```cypher
// Browse the hard-bop era
MATCH (m:Musician)-[:PLAYED_ON]->(r:Record)
WHERE r.release_year >= 1955 AND r.release_year <= 1960
RETURN m, r
LIMIT 200
```

```cypher
// Musicians with a Wikipedia bio + free picture (good detail-page candidates)
MATCH (m:Musician)
WHERE m.bio_summary IS NOT NULL AND m.picture_url IS NOT NULL
RETURN m.name, m.bio_summary, m.picture_url, m.picture_attribution, m.picture_license
LIMIT 20
```

```cypher
// Find by genre
MATCH (m:Musician)
WHERE "hard bop" IN m.genres
RETURN m.name, m.primary_instruments, m.birth_year
ORDER BY m.birth_year
LIMIT 50
```

```cypher
// Quick "what's actually in here" sanity check
MATCH (m:Musician) RETURN count(m) AS musicians;
MATCH (r:Record)   RETURN count(r) AS records;
MATCH ()-[p:PLAYED_ON]->() RETURN count(p) AS played_on;
```

## Data freshness & quotas

- The DB **grows every 4 hours** via a cron-driven populator (GitHub
  Actions). It prioritises musicians active 1955–1960 with ≥10 records,
  falling through to broader pools. Expect a few new musicians + their full
  discographies each run.
- Neo4j Aura Free **auto-pauses after 3 days idle**. If a fresh query
  hangs, someone has to click "Resume" in the Aura console. Plan for the
  first request after a quiet period to be slower.
- Aura Free tier ceilings: **200k nodes, 400k relationships, 1 GB
  storage**. Current usage is single-digit % of all three.

## What you can ignore

- The Python populator code in `jazzdb/`, the `Makefile`, the
  `.github/workflows/` files.
- The local JSON files under `data/musicians/`, `data/records/`,
  `data/edges.jsonl`.
- The queue file `data/queue.jsonl` (only the populator reads this).

The Aura instance is the only runtime contract.

## References

- Neo4j Aura console: https://console.neo4j.io
- Cypher manual: https://neo4j.com/docs/cypher-manual/current/
- Neo4j driver matrix (Python, JS, Java, Go, .NET): https://neo4j.com/docs/drivers-apis/
- Source repo (private): https://github.com/winterized/JazzDBPopulator
- Full populator schema (richer than what's in Neo4j): `jazzdb/schema.py`
