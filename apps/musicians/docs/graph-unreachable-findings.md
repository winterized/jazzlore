# "Graph unreachable" intermittent failure — investigation & fix

**Branch:** `fix/musicians-graph-unreachable` · **Date:** 2026-06-16 · Blocking: App Store submission

Symptom reported: opening a musician detail page intermittently shows the error
screen — headline **"The graph is napping"**, body **"We couldn't reach the
database just now"**. Retrying works. On 2026-06-16 ~07:13 UTC, Monk took 2
tries, Miles Davis (`wikidata:Q93341`) took 10+ tries. Framed as a *connectivity*
failure, with an explicit instruction **not** to assume it is the #155 CPU cause
without evidence.

## TL;DR conclusion (evidence-backed)

The failure is **Cloudflare Error 1102 (`worker_exceeded_resources`)** — the
runtime killing the Worker isolate for exceeding the **free-tier 10 ms CPU
budget** on the heavy high-degree detail pipeline. It is the **same root-cause
class as #155**, which Lever 1 (PR #156) *reduced* but did **not eliminate**.
It is **not** a new connectivity failure, not an Aura pause/throttle, not a
connection-limit, and not the 9 s query timeout.

It *presents* as a connectivity failure because of a frontend mapping quirk:
a 1102 returns HTTP **503 with Cloudflare's own error-page body**, which is not
the worker's `{status:"waking"}` envelope, so the client falls through to the
hard-`error` screen ("napping / couldn't reach the database") instead of the
`waking` screen ("waking up", with a countdown). Same UI a real network failure
would produce — hence the misread.

## How the symptom maps to the code (why "napping", not "waking up")

`apps/musicians/src/features/status/WakingState.tsx` has two distinct variants:

| Variant   | Copy                                                        | Trigger |
|-----------|------------------------------------------------------------|---------|
| `waking`  | "The graph is **waking up.**" + countdown, auto-retry      | BFF `503 {status:"waking"}` (worker's own envelope: 9 s abort / Aura 503-504) |
| `error`   | "The graph is **napping.** We couldn't reach the database…"| `bffGet` **rejects**: a non-`waking` non-ok HTTP, a network failure, or an `{status:"error"}` envelope |

`bffGet` (`src/hooks/useMusicianData.ts`) checks `isWaking(body)` **before**
`!res.ok`. A 1102 is `503` but its body is Cloudflare's
`{type:".../error-1102/", error_code:1102, …}` → `isWaking` is false → `!res.ok`
throws → `kind:'error'` → the **"napping"** screen. **The reported copy is the
`error` variant verbatim**, which is exactly what a 1102 produces.

## Data path (as-is)

- **Mechanism:** Neo4j **Aura HTTP Query API** via `fetch` — **not** the Bolt
  driver (`neo4j-driver` is incompatible with the CF V8 runtime; confirmed: no
  such dependency). `worker/aura.ts` → `POST /db/<db>/query/v2`, Basic auth.
- **Connection model:** stateless HTTP per query; the Workers runtime pools TLS
  to the Aura origin. There is **no** needless per-request Bolt connect to
  "reuse" — connection-reuse is not the lever here.
- **Per detail page:** the worker runs **two** sequential Aura queries
  (`detailCypher` then `peersByEraCypher`) under `handleDetail`. The CPU cost is
  the **parse + reshape + re-stringify** of the large `detailCypher` result for
  high-degree nodes, not the round-trips.
- **Timeouts/retries (before this PR):** one 9 s `AbortController` per query;
  **no retries**. Error mapping: abort & Aura 503/504 → `AuraWakingError` → 503
  `waking`; everything else → `AuraQueryError` → 502. A **1102 never reaches
  this mapping** — the isolate is killed by Cloudflare first, so `guard()`'s
  `try/catch` never runs and the client gets Cloudflare's page, not the 502.

## Reproduction (live prod, black-box) — the evidence

`apps/musicians/docs/repro-graph-unreachable.py` hits the **origin** (cache-busted
`?cb=` so each request bypasses the 1.5 h edge cache) for Miles (high-degree) and
Monk (lower-degree), sequential + concurrent. Captured status / timing / body /
`cf-ray` / `cf-cache-status`.

```
SEQUENTIAL miles ×30 → {200: 29, 503: 1}   min=219 p50=278 max=740 ms
  [miles 12] 503 289ms cache=None
    body={"type":".../error-1102/", ... "error_code":1102,
          "error_name":"worker_exceeded_resources"}   <<< THE FAILURE
SEQUENTIAL monk  ×30 → {200: 30}            min=200 p50=237 max=292 ms
CONCURRENT miles ×20 (10 workers) → {200: 20}
CONCURRENT monk  ×20 (10 workers) → {200: 20}
```

What this proves:

1. **The failure body is literally Cloudflare Error 1102** — definitive. Not a
   `{status:"waking"}` 503, not a worker `{status:"error"}` 502, not an Aura
   error. CPU-limit isolate kill.
2. **Degree-dependent.** Miles (113 records / 418 collaborators) trips; Monk,
   under *identical* load, never does. A connectivity/pause/throttle/connection-
   limit problem would be degree-*independent* → those are **ruled out**.
3. **Burst/rolling-budget-dependent.** The single Miles failure fell mid-burst
   (req 12 of a rapid run); 13–30 recovered as the rolling CPU budget refilled.
   The 289 ms wall-clock (vs the 9 s abort) confirms it is **not** a timeout.
4. **The edge cache never populates** — `cf-cache-status` was **absent on every
   response** (incl. organic, non-busted checks), despite
   `Cache-Control: …, s-maxage=5400`. Cloudflare does **not** edge-cache a
   Worker-synthesized `new Response()` from `Cache-Control` alone, so **every**
   request hits the origin and re-runs the heavy pipeline. This is the
   **amplifier**: there is no edge-HIT shielding subsequent loads (#155 flagged
   this too).

### Why "Miles took 10+ tries" — and why rapid retries make it *worse*

Free-tier CPU is a **rolling budget** across recent invocations. With the edge
cache not shielding anything, every load of Miles hits the origin. A user
rapidly retrying a failed load piles more heavy origin invocations onto an
already-depleted budget — so a retry storm can keep failing until the budget
refills in the gaps. "Retrying eventually works" = the budget recovering, not
the request getting cheaper. **More client retries deepen the deficit.**

## Cloudflare / Aura evidence

- I cannot pull dashboard metrics from outside the account (no authenticated CF
  access here). Historical metrics from #155 (owner-pulled): a cluster of 36
  `Exceeded CPU Time Limits` errors around 2026-06-07, then zero *post-Lever-1*;
  CPU P99 ~101 ms (aggregate dominated by pre-fix spikes). My **fresh** live
  repro shows 1102 still occurs under burst as of 2026-06-16 — Lever 1 lowered
  the rate but left residual headroom that high-degree + no-edge-cache still
  trips.
- **This PR enables Workers Logs** (`wrangler.musicians.jsonc` →
  `observability.enabled`) so the owner can read live invocation status / 1102
  counts / exceptions going forward. Within the free-tier logs allocation.
- **Aura is healthy and not implicated:** warm 200–740 ms latencies, no cold
  20–40 s starts, no pause/resume events observed, no Aura-level error bodies,
  and the lower-degree Monk is flawless under identical concurrency. No
  connection-limit or throttle signature.

## Failure-mode classification

| Candidate | Verdict | Evidence |
|-----------|---------|----------|
| Cloudflare CPU limit / Error 1102 (#155 class) | **CONFIRMED root cause** | 1102 body reproduced; degree- + burst-dependent; 289 ms (not 9 s) |
| Edge cache not populating | **CONFIRMED amplifier** | `cf-cache-status` absent on every response |
| 9 s query timeout (waking) | Ruled out | failure at 289 ms; body is 1102, not `{status:"waking"}` |
| Aura pause / cold start | Ruled out | warm latencies; no 20–40 s starts |
| Aura connection-limit / throttle | Ruled out | degree-dependent not load-dependent; Monk fine under same concurrency |
| Worker→Aura subrequest network blip | Possible (secondary) | not seen in this run; cheaply hardened anyway (see below) |

## Fix applied (safe, ungated, reversible)

Per the brief, only low-risk reversible mitigations are applied here; the
architectural pivots are **gated** below.

1. **Single bounded server-side retry on a transient `aura-fetch-failed`**
   (`worker/aura.ts` + `worker/env.ts`: `AURA_FETCH_RETRIES=1`,
   `AURA_RETRY_BACKOFF_MS=250`). Fires **only** when `fetch` itself throws
   *before* any HTTP response (TLS reset / connection refused / DNS blip) —
   **never** on the 9 s abort (cold Aura keeps its single `waking` signal),
   **never** on a returned HTTP error. It is **CPU-safe**: the retry happens
   before the body parse/reshape, so it adds **zero** CPU to the heavy path and
   **cannot worsen the 1102 budget**. Tests added in `worker/aura.test.ts`
   (recover-on-retry, give-up-after-budget, no-retry-on-abort,
   no-retry-on-HTTP-error).
   **Honest scope:** this hardens the *secondary* connectivity sub-mode the
   brief anticipated. It does **not** address the **dominant reproduced 1102**
   — that is uncatchable in-worker and needs a gated lever below.

2. **Workers Logs enabled** (`wrangler.musicians.jsonc`) — observability only;
   lets the owner watch live 1102 counts / CPU after deploy.

**Not changed:** Cypher and Aura-response parsing are untouched (the new retry
wraps the fetch only), so the live-Aura-smoke gate is not triggered by this PR.
OG/sitemap injection (`worker/og.ts`) and the SPA fallback are unchanged;
`worker/og.test.ts` + `worker/index.test.ts` stay green (115/115 worker tests,
typecheck + lint clean).

## Gated recommendations — Aurelien decides (not shipped here)

These are the levers that actually attack the 1102 root cause. They are
**architectural / product-visible / cost** changes and are deliberately **not**
applied unilaterally.

### A. Option 2 — Cache API read-through (`caches.default`) · **recommended primary**
Wrap the BFF reads (at least `detail`/`graph`) in an explicit
`caches.default.match` → on miss run the query → `cache.put` with the existing
`s-maxage`. Because the edge cache provably **never populates** today
(`cf-cache-status` absent), this is the highest-leverage fix: repeat traffic
becomes an edge HIT → **no Worker invocation → no CPU → no 1102**, and it shields
the rapid-retry storm. ~1–2 h, stays on free tier.
- *Tradeoff / residual risk:* the **first** cold miss per musician per TTL still
  runs the full heavy pipeline and can still 1102 (and a 1102 caches nothing, so
  a low-traffic musician could 1102 at the top of each window). Caching reduces
  *frequency*, not worst-case. Pairs well with B. Adds a small cache-correctness
  surface (key/TTL/invalidation) to maintain.
- *Go/no-go signal after shipping:* `cf-cache-status: HIT` on the 2nd same-id
  call within the TTL.

### B. Lever 2 — cap the collaborator collection in Cypher · **recommended complement**
Bound `detailCypher`'s collaborator expansion (e.g. top ~60–80 by shared-record
count; collaborators, **not** records — 418 sidemen is the real weight, records
are only ~113 even for Miles). Reduces worst-case per-invocation CPU so the
*cold miss* in A survives too.
- *Tradeoff:* **product-visible** — long-tail sidemen beyond the cap drop from
  the orbit/connections, and "+N more" counts reflect the capped set. The cap
  number and ordering are a genuine product decision (yours). Frontend degrades
  gracefully (everything `.map`s over arrays; nothing breaks). Changes the Aura
  response shape → triggers the **live-Aura-smoke** gate.

### C. Option 1 — Workers Paid ($5/mo: 30 s CPU, 50 ms default) · structural
A config flip + $5/mo makes the CPU limit **structurally irrelevant** — fixes
1102 outright with **zero code** and no cache/cap maintenance surface.
- *Tradeoff:* recurring cost; leaves the (good-hygiene) trimming/caching work
  undone. The honest "just make it go away" option.

**Suggested sequence:** ship **A** (caching) first and measure `cf-cache-status`
+ the now-enabled Workers Logs 1102 counter; if cold-miss 1102s persist, add
**B** (cap); hold **C** in reserve. A + B is the free-tier path to ~zero 1102;
C is the zero-code-but-paid escape hatch. (This mirrors #155's reserved
sequencing, now reinforced by the fresh "edge cache never populates" evidence.)
