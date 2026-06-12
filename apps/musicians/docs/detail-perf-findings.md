# Musicians detail-page performance — live production findings (issue #164)

**Status:** 🛠️ FIRST PASS IMPLEMENTED (A+B1+C) — awaiting edge re-measure as the acceptance gate.
**Measured:** 2026-06-12, against **live production** (`https://musicians.jazzlore.com`),
Lighthouse 13.3 driving system Chrome, slow-4G mobile preset + desktop preset.
**Test page:** Miles Davis (`/musicians/wikidata:Q93341`) — a heavy page (113 records).

> This supersedes the P8 *local* numbers in #164 with on-edge measurements.

---

## 1. Headline scores (live edge, not local node-serve)

| Form factor | Perf | LCP | FCP | TBT | CLS | Speed Index |
|---|---|---|---|---|---|---|
| **Mobile** (median of 4 runs) | **~72** (range 70–77) | **11.6 s** (range 5.5–11.9 s) | 2.2 s | 30–40 ms | **0** | 3–4 s |
| **Desktop** (1 run) | **88** | 2.0 s | 0.5 s | 0 ms | 0 | 1.6 s |

- **LCP is the *only* failing metric.** TBT (30–40 ms), CLS (0), and Speed Index are all green. The page is not CPU-bound (only 2 long tasks, ~80 ms each) and has zero layout shift.
- **Desktop is essentially fine (88, LCP 2.0 s)** — unthrottled, the same page is healthy. The problem is specifically **mobile LCP under slow-4G**.
- **Mobile LCP is unstable** — 5.5 s to 11.9 s across runs. Three of four runs cluster at **11.4–11.9 s**; the one fast outlier (5.5 s) was a lucky run. Real-user mobile LCP is reliably **~11.5 s**.

Per the issue-#164 gate this lands in the **"< 75 → real optimization"** bucket, so this doc surfaces options and asks for a scope call rather than silently shipping cosmetic tweaks.

---

## 2. Root cause: the hero portrait paints late, starved by the cover strip

The LCP element is confirmed (every run) as the **hero portrait**:

```
main.desk-rail > figure.ident-photo > div.duo3 > img.duo3-photo
<img class="duo3-photo" alt="Miles Davis" loading="eager" referrerpolicy="no-referrer"
     src="https://upload.wikimedia.org/.../Miles_Davis_(...).jpg">
```

Lighthouse's **LCP-request-discovery** check fails 2 of 3:

| Check | Status |
|---|---|
| LCP image is **not** `loading=lazy` | ✅ already eager |
| `fetchpriority=high` applied | ❌ **missing** |
| Request **discoverable in initial HTML** | ❌ **missing** (SPA — see below) |

**The portrait file itself is not heavy.** Miles' Wikimedia original is **39 KB** (a low-res 1947 photo — it's actually *smaller* than 400 px wide, so there's nothing to resize). The image, once requested, loads in ~110–145 ms. So *byte size is not the problem* — and the Worker-resize idea from #164 buys **nothing for the portrait** (it's already tiny).

**What delays it is contention + discoverability:**

1. **It's a client-rendered SPA.** The portrait URL is only known *after* the JS bundle executes and the `/api/musicians/:id` BFF round-trip resolves. The browser cannot discover/preload it from the initial HTML (`requestDiscoverable: false`). LCP-breakdown shows ~0.5–1.5 s of *resource-load-delay* spent before the request even starts.

2. **The 113-record cover strip floods the connection.** `RecordsStrip` mounts **all** records at once (one horizontal `.rec-strip` row, each an `<img loading="lazy">`). Under slow-4G, the browser still pulls **~45 archive.org cover requests (~328 KB)** during initial load — and **each Cover Art Archive hotlink is a 302 redirect** to a rotating `dnNNN.*.archive.org` CDN node. These 45 redirect-laden requests saturate the simulated mobile connection pool and the cross-origin Wikimedia portrait request queues/paints behind them. This is why mobile LCP balloons to ~11.5 s while **desktop** (no connection throttle) paints in 2.0 s.

   > ⚠️ Tension with #164: P8 concluded "covers are perf-neutral (71 ≈ 72 blanked)." That A/B was **local** (node-serve, low-latency localhost covers) — it would not reproduce real archive.org redirect latency or slow-4G connection limits. The live data contradicts it. **Step 1 of any optimization must re-run the blank-covers A/B on the real edge** to confirm the contention hypothesis before investing in cover-strip work.

3. **Secondary — a 770 ms redirect on unencoded-colon URLs.** `/musicians/wikidata:Q93341` (raw colon) → 307 → `/musicians/wikidata%3AQ93341` costs **770 ms** on the root document. **In-app navigation is unaffected** — every internal link already uses `encodeURIComponent` (→ 200, no redirect). This only bites externally-entered URLs (hand-typed, and possibly the **iOS widget deep-link / native share URL** if they emit raw colons — worth auditing). Real-user in-app LCP excludes this 770 ms.

4. **BFF server latency ~880 ms** (Lighthouse RTT estimate). The detail render is gated behind the BFF round-trip; `detailCypher` for Miles (113 records + collaborators) is the heaviest query in the app.

---

## 3. Options (cost / risk / expected gain)

Ordered cheapest-first. A + B1 together are the recommended first pass.

| # | Fix | Cost | Risk | Expected LCP gain | Notes |
|---|---|---|---|---|---|
| **A** | `fetchpriority="high"` on the hero `<img.duo3-photo>` (eager hero only) | **trivial** (1 prop, plumbed through `Duo3 eager` call-sites) | none | small–moderate | Lets the portrait win connection priority over the 45 covers. Do regardless. |
| **B1** | `content-visibility:auto` + `contain-intrinsic-size` on off-screen `.rec-tile`s | **~0.5 day** | low | **likely largest win** | Browser skips layout/paint **and the lazy-load trigger** for off-screen covers → stops ~40 covers competing during initial paint. Pure CSS. Re-measure. |
| **C** | Preconnect/dns-prefetch to `upload.wikimedia.org` (+ maybe archive.org) | trivial | none | small | `<link rel="preconnect">` in `index.html`. Shaves portrait connection setup. |
| **D** | Cap eager cover mounting — render `<img>` only for first N records, mount the rest on scroll (IntersectionObserver / virtualize the strip) | ~1–1.5 days | medium | moderate (if B1 insufficient) | More code; B1 may make this unnecessary. |
| **E** | Make the portrait **discoverable**: edge-inject `<link rel="preload" as="image" fetchpriority="high">` for the portrait in the Worker (Worker fetches BFF, inlines preload into the SPA shell) | ~1–2 days | medium | **large** | Removes the SPA discovery penalty (the 0.5–1.5 s load-delay). The architecturally "correct" LCP fix, but turns the static SPA shell into an edge-templated response. |
| **F** | Fix the 770 ms redirect — ensure widget deep-link / native share URLs emit `wikidata%3A…` (encoded) | ~0.5 day | low | 770 ms **for external entries only** | Audit `jazzlore-musicians://` deep-link + `canonicalShareUrl`. Doesn't help in-app nav. |
| **G** | **Worker image proxy/resize for covers** (the flagged question) | ~2–3 days | higher | moderate | Route covers through the musicians Worker → one origin (HTTP/2 multiplexing, **no 302 per cover**, edge-cached, smaller bytes). Cost: Worker CPU + Cloudflare Images billing + cache invalidation. **Note: does nothing for the *portrait* LCP** — only de-contends the strip. B1 achieves most of the same paint benefit for ~1/5 the cost. |
| **H** | Reduce BFF payload/latency (paginate/defer records) | ~1–2 days | medium | small–moderate | Touches the frozen record-ordering query. Lower priority. |

### Recommended first pass — **A + B1 + C** (~0.5–1 day, low risk)
1. Re-run the blank-covers A/B **on the edge** to confirm contention (cheap, decides everything below).
2. `fetchpriority="high"` on the eager hero portrait (A).
3. `content-visibility:auto` on off-screen record tiles (B1).
4. `preconnect` to Wikimedia (C).
5. Re-measure mobile median ×3–5. If ≥90 → done. If still short → escalate to **E** (edge preload) as the next lever; reserve **G** (Worker cover proxy) only if the strip is *still* the bottleneck after B1.

### Explicitly **not** recommended
- **Worker-resize of the *portrait*** (#164's lead idea) — the portrait is already 39 KB; resizing saves nothing. (Resize could still apply to *covers* under option G, but that's a different target.)

---

## 3b. Confirmation experiments (2026-06-12)

**Edge A/B — block the covers (decides everything):** re-ran mobile Lighthouse ×3 against
live prod with `--blocked-url-patterns="*archive.org*"`:

| | Baseline (covers live) | archive.org blocked |
|---|---|---|
| LCP (median) | **~11.5 s** | **5.5 s** (4.8–7.9) |
| Perf | ~72 | 75 |

Blocking the cover strip **halves LCP** → the 113-record cover strip is the dominant LCP factor. (This contradicts #164's *local* "covers neutral" A/B; that test couldn't reproduce real archive.org redirect latency + slow-4G connection limits.)

**Trace proof the covers contend in the critical path:** in the 11.4 s run the portrait
*finished downloading at 715 ms* but wasn't painted as LCP until **11,415 ms**; **all 45 cover
requests started before the LCP timestamp** (earliest at 1,156 ms). Under Lighthouse's *simulated*
throttling the 45 cover requests saturate the connection pool and the simulator pushes the
portrait's effective paint far out — which is exactly why blocking them recovers ~6 s.

> Why `content-visibility` (not just `loading=lazy`, which the covers already have): Chrome's
> lazy-load distance-from-viewport threshold is **connection-aware** — on a slow effective
> connection it balloons and pulls the far-below-fold strip (≈ y 3,110 px) into range, so ~45
> covers load during the LCP window anyway. `content-visibility: auto` is strictly viewport-based
> (small UA margin, connection-independent) → it skips off-screen tile rendering *and* their
> lazy-load trigger. Confirmed locally that the strip is far below the fold and renders/scrolls
> correctly with CV applied; the cover-flood itself only reproduces under the edge's throttling,
> so the **edge re-measure is the acceptance gate** (claim no win until it shows).

**Redirect audit (option F) — CLEAN, no app fix.** The 770 ms 307 is Cloudflare path-normalization
on raw colons. Every app-generated URL already encodes the id: internal nav (`encodeURIComponent`),
the widget deep-link (`widgetDeepLinkPath` → `/musicians/${encodeURIComponent(id)}`), `canonicalShareUrl`
(re-bases an already-encoded `pathname`), and the worker sitemap/OG (`og.ts`). Only hand-typed raw-colon
URLs hit the redirect; nothing to change.

## 3c. First pass shipped — A + B1 + C

- **A — `fetchpriority="high"` on the hero portrait.** New `Duo3` `priority` prop, set only by
  `AttribPhoto` (the single detail-hero LCP image). Home eager rows stay byte-identical (4 high-priority
  hints would dilute). `apps/musicians/src/components/Duo3.tsx`, `Attrib.tsx`.
- **B1 — `content-visibility:auto` + `contain-intrinsic-size: auto 124px auto 309px` on `.rec-tile`.**
  Defers off-screen cover rendering+loading. `apps/musicians/src/components/components.css`.
- **C — `<link rel="preconnect" href="https://upload.wikimedia.org">`** (no crossorigin — the portrait
  `<img>` loads anonymously). `apps/musicians/index.html`.

Tests: new `primitives.test.tsx` cases assert `fetchpriority=high` on the priority hero and its
absence on plain eager portraits. 532 unit green, tsc 0, lint 0.

## 4. Process fix — add a detail-page perf gate

This went unnoticed because the canonical Lighthouse gate (`pnpm lighthouse:audit`) targets **home/collection** pages, never a **detail** page. **Action (do regardless of optimization scope):** add a musicians **detail** route to the perf gate so this category of regression is caught in future. Captured for CLAUDE.md once the optimization lands.

---

## 5. Reproduce

```bash
export CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
# real-user (encoded) URL, mobile:
node_modules/.bin/lighthouse "https://musicians.jazzlore.com/musicians/wikidata%3AQ93341" \
  --only-categories=performance --output=json --output-path=/tmp/lh.json \
  --chrome-flags="--headless=new --no-sandbox" --quiet
# desktop: add --preset=desktop. Run mobile ×3–5 and take the median — LCP is noisy (5.5–11.9 s).
```
Measure the **encoded** URL for the real-user number; the raw-colon URL adds a one-off 770 ms redirect (option F).
