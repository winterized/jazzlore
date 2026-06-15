# Jazzlore SEO audit — findings & tiered fix plan

**Scope:** all five public surfaces — `jazzlore.com` (apex), `musicians.jazzlore.com`, `chords.jazzlore.com`, `scales.jazzlore.com`, `metronome.jazzlore.com`.
**Date:** 2026-06-15. **Author:** automated audit session (investigation-only; no code changed).
**Trigger:** `site:musicians.jazzlore.com` on Google returns zero indexed pages.

> Method note: every "live" claim below was verified with `curl` against production using a Googlebot User-Agent **and** an `Accept: text/html` header (the header matters — see §1). Code claims cite `file:line`. Nothing here was taken on faith from the design docs; several design assumptions turned out to be wrong (flagged inline).

> ⚠️ **2026-06-15 ADDENDUM (read [§13](#13-addendum--live-deployment-verification-of-robotstxt-and-sitemapxml) first).** A browser navigation to `/sitemap.xml` and `/robots.txt` returned the SPA home page, appearing to contradict §1's "real sitemap + robots" claim. Verified: the **files are served correctly to Googlebot/curl**; the browser failure is the **musicians PWA service worker's navigation fallback** masking those paths for installed browsers only (Googlebot runs no service worker). One piece of the original framing was imprecise and is corrected in §13: robots.txt/sitemap.xml are **not** served via HTMLRewriter. Net effect on plan: **musicians' sitemap is safe to submit to GSC**; chords/scales/apex sitemaps genuinely don't exist and must be created first.

---

## 1. Executive summary

The starting assumption — "these are SPA shells with no SEO, so the body is invisible and that's the whole problem" — is **only half right, and the wrong half is the urgent one.**

1. **Musicians is in much better shape than assumed.** Detail pages (`/musicians/:id`) already get **per-musician `<title>`, `<meta description>`, full Open Graph + Twitter Card tags, and an `og:image`**, injected server-side at the edge via Cloudflare `HTMLRewriter` (`apps/musicians/worker/og.ts`). There is a real, dynamic, 30,134-URL `sitemap.xml` and a permissive `robots.txt`. This is a deliberate, documented v1 posture ("OG/meta injected per-request; JS-hidden body explicitly accepted for v1").
2. **The likely reason for zero indexing is mundane: the domains are ~4 weeks old (first commit 2026-05-18), have near-zero authority, and have almost certainly never been submitted to Google Search Console.** A brand-new zero-authority domain publishing 30k thin, JS-rendered URLs gets a *microscopic* crawl budget; "Discovered / Crawled – currently not indexed" (or not-yet-crawled) is the textbook expected state at this age. This is **not** a hard rejection and **not** primarily an SSR problem.
3. **The single highest-leverage action costs zero engineering and is Aurélien's hands only:** verify the properties in Google Search Console, submit the sitemaps, and "Request indexing" on a handful of seed URLs. Everything else is secondary to that.
4. **There are three concrete, cheap bugs worth fixing regardless** (§4, §9): (a) musicians detail pages emit **two** `<meta name="description">` tags — the static generic one is never removed, so Google may pick the generic over the per-musician one; (b) `chords`/`scales` `robots.txt` advertise a `sitemap.xml` that **does not exist** (the path returns the SPA HTML shell); (c) there are **no `rel=canonical`** tags anywhere and **no JSON-LD** anywhere.
5. **Full body SSR is the most-discussed and least-urgent lever.** Google renders JS (second wave) and will eventually see the body; the catalog apps (chords/scales) have purely local data and could be *build-time pre-rendered* cheaply if/when wanted. Spend the first dollar on discovery + the cheap bugs, not on an edge SSR rewrite.

**If you read one thing:** do §10 Tier S. It's mostly free and it's the actual blocker.

---

## 2. Crawlability audit (§1 of brief)

### Per-surface matrix

| Surface | Server-rendered body? | Per-route meta in initial HTML? | OG / Twitter? | `robots.txt` | Real `sitemap.xml`? | JSON-LD? |
|---|---|---|---|---|---|---|
| `musicians.jazzlore.com` **/musicians/:id** | ❌ empty `<div id=root>` | ✅ **title + description** (per musician) | ✅ **full OG + Twitter + image** | ✅ allow-all + sitemap ref | ✅ **dynamic, 30,134 URLs** | ❌ |
| `musicians.jazzlore.com` **/musicians** (home) | ❌ | ❌ static default only | ❌ | ✅ | (covered by the one sitemap) | ❌ |
| `chords.jazzlore.com` | ❌ | ❌ static default only | ❌ | ✅ allow-all **+ sitemap ref that 404s** | ❌ **referenced but missing** | ❌ |
| `scales.jazzlore.com` | ❌ | ❌ static default only | ❌ | ✅ allow-all **+ sitemap ref that 404s** | ❌ **referenced but missing** | ❌ |
| `metronome.jazzlore.com` | ❌ | ❌ static default only | ❌ | ✅ allow-all, **no sitemap line** | ❌ (single page — not really needed) | ❌ |
| `jazzlore.com` (apex) | ❌ | ❌ static default only | ❌ | ⚠️ **no robots.txt** (path returns SPA HTML) | ❌ | ❌ |

### The critical methodological catch (worth internalizing)

My first `curl` of a musician detail page returned the **generic** title and description, which looked like "no per-route SEO at all." That was a **false negative.** The Worker only injects OG for *document navigations*, gated by:

```ts
// apps/musicians/worker/index.ts:50-55
function isDocumentNavigation(request: Request): boolean {
  if (request.method !== 'GET') return false
  const dest = request.headers.get('Sec-Fetch-Dest')
  if (dest) return dest === 'document'
  return (request.headers.get('Accept') ?? '').includes('text/html')
}
```

Bare `curl` sends `Accept: */*` → not a document nav → falls through to the static SPA shell. Real Googlebot/Bingbot/social crawlers send `Accept: text/html,...`, so **they do get the injected metadata.** Re-tested with the correct header, a detail page returns:

```
<title>Kenny Burrell — Jazzlore</title>
<meta property="og:type" content="profile" />
<meta property="og:title" content="Kenny Burrell — Jazzlore" />
<meta property="og:description" content="Kenneth Earl Burrell is an American jazz guitarist..." />
<meta property="og:url" content="https://musicians.jazzlore.com/musicians/wikidata%3AQ255355" />
<meta name="twitter:card" content="summary_large_image" />
<meta property="og:image" content="https://upload.wikimedia.org/wikipedia/commons/5/51/Kenny_Burrell_2.jpg" />
```

**Implication for any future testing/monitoring:** always send `Accept: text/html` when probing these routes, or you'll measure the shell and conclude the SEO is broken when it isn't.

### Body content is genuinely absent from first-wave HTML (all surfaces)

Every surface serves `<body><div id="root"></div></body>` — the musician names, bios, records, chord/scale catalogs are all client-rendered. For musicians, the **head** is enriched but the **body** is not. Google's Web Rendering Service will execute the JS (second indexing wave) and *can* see the body, but:

- The musicians body additionally requires a **BFF round-trip to Neo4j Aura** during render. Aura Free cold-starts and returns `503 {status:"waking"}`; if Googlebot renders during a cold window it sees an empty/loading page. This is a real reliability tax on a 30k-page crawl.
- Non-Google engines (Bing has limited JS rendering; most others none; LLM crawlers / GPTBot generally don't render) see **only the head** → title + description, no body. For musicians that's still a usable snippet; for chords/scales/metronome/apex it's a generic shared title and nothing else.

---

## 3. Indexing state (§2 of brief)

Direct measurement needs Google Search Console, which this session cannot and must not touch. Inferences:

- **Site age:** OG/sitemap infra first committed **2026-05-18**; musicians went live ~2026-05-20; the repo went **public on GitHub 2026-05-27**. So everything is **under one month old.** "Zero indexed" at this age for a zero-authority domain is expected, not alarming.
- **Discoverability / backlinks:** the **public GitHub repo `README.md`** contains real markdown links to all four sites and the apex (`README.md:7,13-16`). github.com is high-authority and crawled constantly, so Google almost certainly *can* discover the domains from there — discovery is probably not the blocker; **crawl-budget + indexing-priority** is. There appear to be no other inbound links (no blog, no social per scope).
- **Internal cross-linking is JS-only.** The apex landing tiles are real `<a href="https://chords.jazzlore.com">` anchors (`apps/landing/src/tiles/*.tsx`), but they're **client-rendered**, so they're invisible to first-wave crawling and to non-rendering engines. The four apps do **not** link to each other or back to the apex in any server-visible way. So there's no server-side internal link graph distributing authority across the family.
- **Worker-log evidence of actual Googlebot visits: GAP.** This session has no authenticated Cloudflare access and cannot read Worker logs / Analytics. **Recommend Aurélien check** (a) Cloudflare dashboard → the `jazzlore-musicians` Worker → Logs/Analytics, filter UA for `Googlebot`, and (b) GSC → Crawl Stats, once verified. This is the fastest way to distinguish *not-crawled* from *crawled-not-indexed*, which changes the fix priority.

**Best guess at the true state (to confirm via GSC URL Inspection):** musicians detail URLs are most likely **"Discovered – currently not indexed"** (Google found them in the sitemap but hasn't spent budget crawling/rendering 30k thin pages on a new domain). Chords/scales/metronome/apex are likely **not yet crawled or crawled-not-indexed** (no sitemap, generic single-title, near-zero unique content).

---

## 4. Meta tags state (§4 of brief)

| Route | `<title>` source | `<meta description>` | OG / Twitter | Notes |
|---|---|---|---|---|
| musicians `/musicians/:id` | **server, per-musician** (`og.ts:31`) | **server, per-musician bio** (300-char slice) | **full set + image** | ⚠️ **duplicate description bug** (below) |
| musicians `/musicians` (home) | static `Jazzlore — Jazz musicians` | static generic | none | client `useTitle` exists but doesn't set home |
| chords `/chords/:root` | static `Jazzlore — Jazz chords reference` | static generic | none | client sets `Chords on C# — Jazzlore` (`ChordsPage.tsx:121`) **after hydration → invisible to crawlers** |
| scales `/scales/:root` | static `Jazzlore — Jazz scales reference` | static generic | none | same pattern as chords |
| metronome `/` | static `Jazzlore — Metronome` | static generic (good copy) | none | single page; static is acceptable |
| apex `/` | static `Jazzlore — A jazz musician's workbench` | static generic | none | gate page; static acceptable, but **add OG** |

### Findings

- **No head-management library** (no `react-helmet`, `@unhead`, etc. anywhere — confirmed across all `package.json`). Client-side title is done with raw `document.title` effects (`apps/musicians/src/hooks/useTitle.ts`, `apps/chords/src/pages/ChordsPage.tsx:120`). **Client-side head mutation is invisible to the first crawl wave** and unreliable for SEO (Google may use the rendered title, but only after deferred rendering; other engines never). The good copy in those effects buys nothing for SEO today.
- **🐞 Bug — duplicate `<meta name="description">` on every musician detail page.** `injectOg` *appends* a new description into `<head>` (`og.ts:84-89`) but never removes the static one baked into `apps/musicians/index.html:7`. Live pages therefore carry **both** the generic "Tap through jazz musicians…" description **and** the per-musician bio. Google's behavior with duplicate descriptions is to pick one (often the first / the one it deems most relevant) — there's a real risk the **generic** description wins, defeating the per-page work. The `<title>` is correctly *rewritten in place* (`og.ts:79-83`); only the description doubles up. **Cheap fix:** rewrite the existing `<meta name=description>` in place via `HTMLRewriter` (same pattern as `<title>`) instead of appending a second one.
- **No `<link rel="canonical">` anywhere** (the earlier grep hit was a code *comment* about the web manifest, not a tag). Musicians has alias IDs and URL-encoding variants (`wikidata:Q…` vs `wikidata%3AQ…`, plus `also_known_as_ids` aliases that the app canonicalizes *client-side* via `useNavigate({replace})`). Without a server `rel=canonical`, Google may treat alias/encoding variants as duplicate URLs and split signals. Low severity today (low traffic) but cheap to add in the existing injection path.
- The static descriptions for chords/scales/metronome/apex are actually **well-written and keyword-relevant** (e.g. chords: "every jazz chord built on it — triads, sixth chords, seventh chords, tensions, and extended chords"). The problem isn't copy quality; it's that **every route under a domain shares one title+description** (12 chord-root pages all say "Jazzlore — Jazz chords reference"), which reads as duplicate/non-specific to Google.

---

## 5. SSR / pre-rendering architecture (§3 of brief)

### Current state (verified)

- **No SSR or build-time prerender anywhere.** All five apps are pure client-rendered Vite SPAs (no `ssr`/`prerender`/`ssg` in any `vite.config.ts`, no `vite-react-ssg`/`vite-plugin-ssr` dependency).
- **Worker topology:**
  - `wrangler.musicians.jsonc` has a Worker `main` (`./apps/musicians/worker/index.ts`) → **BFF + HTMLRewriter head injection + dynamic sitemap.** This is the only app with server-side logic.
  - `wrangler.jsonc` (apex/landing), `wrangler.chords.jsonc`, `wrangler.scales.jsonc`, `wrangler.metronome.jsonc` are **assets-only** (no `main`) → pure static SPA serving with `not_found_handling: "single-page-application"`. No hook to inject anything.

### The honest cost/strategy table per app

| App | Body data source | Cheapest path to crawlable body | Effort | Verdict |
|---|---|---|---|---|
| **chords** | 100% local (chord catalog, 12 root pages) | **Build-time SSG** (render each `/chords/:root` to static HTML at build) — or per-root meta injection via a tiny worker | ~2–3 days SSG | **Best ROI of the SSR work** — local data, finite routes, no runtime cost |
| **scales** | 100% local (38 scales, 12 root pages) | Same as chords (share the SSG approach) | ~1 day after chords | Do alongside chords |
| **musicians** | BFF → Neo4j Aura (30k pages, cold-start-prone) | **Edge streaming SSR** in the existing Worker (render React to a stream, reuse `detailCypher`) | **~1–2 weeks**, real risk | **Lowest urgency** — head is already done, Google renders JS, and Aura cold-starts make runtime SSR fragile. Defer. |
| **metronome** | Single app-shell page, no content | None needed | — | Static is correct; SSR would add nothing |
| **apex** | Static gate page | Optionally pre-render the tile links into the shell so the internal link graph is server-visible | ~0.5 day | Cheap win for cross-site link equity (§9) |

### The partial-solution sweet spot (recommended over full SSR)

The brief's own suggestion — *"render meta tags server-side, leave body client-rendered"* — is **exactly what musicians already does**, and it captures most of the SEO value for a fraction of full-SSR cost. Extending that pattern is far better ROI than full body SSR:

1. **Musicians:** keep head-injection; **add JSON-LD** to the same `HTMLRewriter` pass (§6). Near-free, big rich-result upside.
2. **Chords/scales:** the catalog is local and finite (~12 routes each). **Build-time SSG** gives *complete* first-wave HTML (head **and** body) with **zero runtime cost and zero Aura dependency** — strictly better than runtime SSR here. This is the one place where full pre-rendering is genuinely cheap and worth it.
3. **Full edge SSR for musicians' 30k pages** is the only "days, not hours" item and should be **last** — its main beneficiaries are non-Google engines and render-reliability, not Google ranking, and it couples every crawl to a cold-start-prone DB.

---

## 6. Structured data opportunities (§5 of brief)

**None today** (zero `application/ld+json` anywhere). The musicians BFF already returns everything needed for high-value schema, and the injection mechanism already exists — so this is unusually cheap.

| Content type | Schema | Fields available in BFF | Search value | Cost |
|---|---|---|---|---|
| Musician detail | **`schema:Person`** (or `MusicGroup` for bands) | `name`, `bio_summary`, `primary_instruments`, birth/death years, **`sameAs`** ← `wikidata:`/`musicbrainz:`/`discogs:` IDs are gold for entity reconciliation / knowledge-panel candidacy, `image` (portrait) | **High** — entity understanding, knowledge-panel eligibility, sameAs links Jazzlore to authoritative graphs | **~1 day** (data already in `detailCypher`/`reshapeDetail`; emit JSON-LD in `og.ts`/`injectOg`) |
| Records on a detail page | **`schema:MusicAlbum`** with `byArtist`, `datePublished` (release_year), `name`; `recordLabel` where present; `image` (cover art) | Records already projected with year/title/cover (post-#155 explicit projection) | **Medium-High** — album rich results, ties albums to the artist entity | **~0.5 day** added to the above (same pass) |
| Home pages | **`schema:WebSite`** + optionally `SearchAction` (sitelinks search box) — musicians has client-side search over `/api/musicians/search-index` | n/a (static) | **Low-Medium** — sitelinks searchbox is mostly deprecated by Google but `WebSite`/`Organization` still helps entity grounding | **~0.5 day** (static JSON-LD in each `index.html`) |
| Chord / scale pages | — | — | **Low** — no widely-supported schema for music-theory entities; skip | — |

**`sameAs` is the standout.** Emitting `sameAs: ["https://www.wikidata.org/entity/Q255355", "https://musicbrainz.org/artist/…"]` on each Person tells Google "this page is about the *same entity* as these authoritative records," which is the strongest signal a small new site can give for knowledge-panel candidacy. The IDs are already in the node id / `also_known_as_ids`.

---

## 7. Performance for SEO (§6 of brief)

Core Web Vitals are a (minor) ranking factor, and a tie-breaker. Best current data is `apps/musicians/docs/detail-perf-findings.md` (Lighthouse 13.3, system Chrome):

| Surface / form factor | LCP | CLS | TBT/INP proxy | Google "good" verdict |
|---|---|---|---|---|
| musicians detail — **mobile (slow-4G)** | **~11.5 s real / 4.0 s after PR #165 partial fix** | 0 ✅ | TBT 30–40 ms ✅ | **LCP "poor"** (good ≤ 2.5 s); the only failing metric |
| musicians detail — desktop | 2.0 s ✅ | 0 ✅ | 0 ms ✅ | good |
| musicians home, chords, scales, metronome, apex | not formally measured (light app-shell pages) | likely fine | likely fine | **measure before claiming** |

**Read for SEO specifically:**

- **CWV is *not* what's blocking indexing.** A zero-authority new domain doesn't get demoted to "unindexed" over LCP; it gets indexed (or not) based on crawl budget + content quality first. CWV matters for *ranking among already-indexed competitors*, which is a later-stage concern.
- **Mobile LCP on the musicians detail page is genuinely "poor"** (≤2.5 s is "good"; the page sits well above even after the #165 partial fix). Root cause is documented and *not* byte size: the off-screen record-cover strip floods the slow-4G connection pool and the SPA can't preload the hero portrait (URL only known after the BFF round-trip). The fix (#166, edge `<link rel=preload as=image fetchpriority=high>` for the portrait) is **already queued** and dovetails with any future edge-SSR work.
- **The other four surfaces are app-shell-shaped and almost certainly fine**, but the canonical `pnpm lighthouse:audit` historically only measured list pages — **measure each at least once** so "good CWV" isn't an assumption. This is cheap.
- **Net:** treat CWV as Tier B for SEO purposes. It's real but it's not why `site:` is empty.

---

## 8. Content & keyword strategy (§7 of brief)

The four apps have *wildly* different SEO surface area. Opinionated take:

### musicians — the crown jewel, enormous long-tail
- **Query classes:** `"<musician> sidemen"`, `"who did <musician> play with"`, `"<musician> collaborators"`, `"<musician A> <musician B> recordings"`, `"<musician> discography"`, `"<musician> jazz"`.
- **Competition:** head terms (`"Miles Davis"`) are owned by Wikipedia/AllMusic/Discogs — unwinnable. But the **relational long-tail** (`"who played with Hank Mobley"`, `"Shelly Manne collaborators"`) is *exactly* Jazzlore's unique data and is **weakly contested**. 30k entity pages = 30k potential long-tail landings.
- **Status:** content exists in the graph; the head metadata is already crawlable; **the body (the actual collaborator lists — the unique value) is JS-only.** This is the strongest argument for eventually getting musicians' *body* crawlable (SSG/SSR or at least server-rendering the collaborator list + records into the shell). Even a server-rendered **text list of collaborators + records** (no styling) in the body would unlock the long-tail.
- **Verdict:** highest content potential of the family; gated by body-crawlability + domain authority.

### chords / scales — finite catalog, defined intent
- **Query classes:** `"Cmaj7 chord piano"`, `"C altered scale notes"`, `"jazz chords on D"`, `"melodic minor modes"`, `"<root> <quality> voicing"`.
- **Competition:** **fierce and mature** — pianochord.com, scales-chords.com, jguitar, musictheory.net, Ultimate Guitar. These are high-authority and answer the head terms directly. Winning `"Cmaj7"` is unrealistic short-term.
- **Reality:** only **~12 root pages each** exist (`/chords/:root`, `/scales/:root`) — there are **no individual per-chord/per-scale URLs**, so there's no `"Cmaj7"`-specific landing page to rank. Each root page is a catalog of *all* qualities on that root.
- **Verdict:** **lower SEO priority.** To compete you'd need (a) per-chord/per-scale routes (a product change, not just SEO) and (b) crawlable bodies. Worth it only if these apps are a strategic SEO bet — otherwise leave them as polished tools discovered via apex/branded search. Cheap wins: per-root titles/descriptions + a real sitemap so the 12 pages can at least be indexed.

### metronome — minimal content surface
- **Query classes:** `"online jazz metronome"`, `"metronome for piano practice iphone"`, the genuinely differentiated `"metronome that stays audible over USB-C"` (its actual unique value, already in the meta description).
- **Verdict:** single page; static meta is fine. Niche long-tail only. Tier B at most.

### apex — brand hub
- Ranks for `"Jazzlore"` (branded) and serves as the link hub. Its SEO job is to **pass authority to the four apps** via server-visible internal links (§9), not to rank for generic terms.

**Strategic recommendation:** if SEO traffic is a real goal (vs. portfolio/learning), **concentrate effort on musicians' long-tail** — it's the only surface with unique, low-competition, high-volume content. Chords/scales are competing in a red ocean with a thin route surface; don't over-invest there.

---

## 9. Apex domain & cross-site linking (§8 of brief)

- **Apex serves a client-rendered React gate page** (`apps/landing/`), empty body in first-wave HTML, static generic title, **no OG, and no `robots.txt`** (`/robots.txt` returns the SPA shell — so there's no explicit sitemap pointer for the apex, though absence of robots.txt defaults to "allow all").
- **Cross-site link graph is JS-only.** Apex → app links are real anchors but client-rendered (`apps/landing/src/tiles/*.tsx`); the four apps have **no** server-visible links to each other or back to apex. So the family currently passes **no server-side internal link equity** — each subdomain is an SEO island except for the GitHub README backlinks.
- **GitHub repo is a real asset:** public, high-authority, README links to all five surfaces (`README.md:7,13-16`). This is currently the family's main inbound-link source and probably the main discovery path.

**Recommendations (cheap):**
1. **Pre-render the apex tile links into the static shell** (or hard-code them in `index.html`) so the apex→apps link graph is server-visible — a 0.5-day win that lets apex authority flow to the apps.
2. **Add a server-visible footer link back to `jazzlore.com`** (and ideally to sibling apps) in each app's shell. Cross-linking a small family concentrates the little authority it has.
3. **Add `robots.txt` + OG to the apex.** Currently missing.
4. Keep the README links; consider a short "Jazzlore" mention from any other property Aurélien controls (out of scope per brief, but the cheapest authority lever that exists).

---

## 10. Tiered recommendations

### Tier S — must-do foundation (hours–1 day; mostly free; without this nothing else matters)

| # | Action | Owner | Effort | Why |
|---|---|---|---|---|
| **S1** | **Verify all 5 properties in Google Search Console, submit each sitemap, and "Request indexing" on ~5 seed URLs** (apex, each app home, 2–3 strong musician pages e.g. Miles, Coltrane). | **Aurélien only** (needs his Google account + DNS/domain ownership) | ~1 h | This is *the* unlock. It tells Google the sites exist, hands it the sitemaps, and forces crawl of seed pages. Also gives you the only real visibility into crawl/index state (URL Inspection: crawled-HTML vs rendered-HTML). |
| **S2** | **Fix the duplicate `<meta description>`** on musicians detail: rewrite the existing tag in place (like `<title>`) instead of appending a second one. | code | ~1–2 h | Stops the generic description from competing with (and possibly beating) the per-musician one. `og.ts:54-89`, `index.html:7`. |
| **S3** | **Generate real `sitemap.xml` for chords/scales** (+ list the ~12 root URLs each) **and fix the `robots.txt` references**; add a `Sitemap:` line to metronome only if you give it a sitemap (or drop the expectation); add `robots.txt` to apex. | code | ~0.5 day | Today chords/scales `robots.txt` point Google at a sitemap that returns HTML — a broken signal. Static build-time sitemaps are trivial for finite-route apps. |
| **S4** | **Check Cloudflare Worker logs / Analytics for Googlebot hits** (last 30 days) to distinguish *not-crawled* from *crawled-not-indexed*. | Aurélien | ~15 min | Changes the priority of everything below; this session couldn't access it (gap). |

### Tier A — high-leverage (days–weeks; materially changes trajectory)

| # | Action | Effort | Notes |
|---|---|---|---|
| **A1** | **Add JSON-LD to musicians detail** (`Person` + `MusicAlbum` + `sameAs` to wikidata/musicbrainz/discogs) in the existing `HTMLRewriter` pass. | ~1 day | Highest ROI of the "real work." Data already in `detailCypher`. Best lever for knowledge-panel candidacy. |
| **A2** | **Build-time SSG for chords + scales** (render each `/{chords,scales}/:root` to full static HTML — head **and** body — at build). Local data, finite routes, zero runtime cost. | ~2–3 days | The one place full pre-rendering is genuinely cheap. Gives complete first-wave HTML and per-root meta for free. |
| **A3** | **Server-visible cross-site link graph**: pre-render apex tile links into the shell; add footer links (apex + siblings) into each app's static shell. | ~0.5–1 day | Turns 5 SEO islands into a linked family; lets apex/GitHub authority flow. |
| **A4** | **Server `rel=canonical`** for musicians detail (canonical = encoded canonical id) via the injection pass. | ~0.5 day | Consolidates alias + URL-encoding duplicate variants. |
| **A5** | **Server-render the musicians *body* essentials** — at minimum a plain text list of collaborators + records into the shell (not full styled SSR). Unlocks the unique long-tail content for first-wave + non-Google engines. | ~3–5 days (minimal) / ~1–2 wk (full streaming SSR) | Couples crawl to Aura cold-starts — mitigate with caching + graceful fallback to the current head-only shell. **Lower urgency than it looks**; do after S+A1–A4 and after you've confirmed Google is actually rendering the JS body (S1/S4). |

### Tier B — incremental / optional

- Mobile LCP to "good" on musicians detail (#166 edge portrait preload) — pairs with A5.
- One-time Lighthouse pass on the four unmeasured surfaces to confirm CWV.
- `WebSite`/`Organization` JSON-LD on home pages.
- OG images for chords/scales/metronome/apex (currently no `og:image` → poor social/SERP thumbnails). Could generate per-root OG images at build time.
- Per-chord/per-scale **routes** (product change) if you decide to seriously contest the chords/scales keyword space — only worth it as a strategic bet (§8 says probably not).
- Breadcrumb JSON-LD on musicians detail.

---

## 11. Open questions for Aurélien

1. **Is organic SEO traffic actually a goal, or is this primarily a portfolio/learning artifact?** It changes everything below Tier S. If it's portfolio-first, do Tier S + A1 and stop.
2. **Has any property ever been verified in Google Search Console?** If not, S1 is almost certainly the entire answer to "why zero indexed."
3. **What do the Cloudflare Worker logs show for Googlebot** over the last 30 days (S4)? Not-crawled vs crawled-not-indexed picks the next move.
4. **Are chords/scales a strategic SEO bet?** They're in a red ocean with only ~12 routes each. I'd deprioritize them for SEO and keep them as polished tools — confirm you agree.
5. **Appetite for coupling crawl to Aura?** Full musicians body-SSR makes every Googlebot render depend on a cold-start-prone free-tier DB. Comfortable with that, or keep body client-rendered and rely on Google's JS rendering + the head metadata?
6. **OG images:** worth generating per-root/per-app OG images, or is the musician portrait enough (the only surface with one today)?

---

## 12. Suggested next session — Tier S implementation prompt

> **Tier S SEO fixes (code portion only — S1/S4 are Aurélien's hands).** Investigation-only audit lives at `apps/musicians/docs/seo-audit-findings.md`; read it first. Implement, with tests, on a branch + code-reviewer pass per repo policy:
>
> 1. **Musicians duplicate-description fix** — change `injectOg` (`apps/musicians/worker/og.ts`) to **rewrite the existing `<meta name="description">` in place** (mirror the `<title>` handler) instead of appending a second one; assert via a worker unit test that exactly one description tag survives and it's the per-musician one. Run the live-Aura smoke.
> 2. **Chords + scales sitemaps** — add a build-time step that emits `public/sitemap.xml` listing the ~12 `/{chords,scales}/:root` URLs (+ the collection route); fix each `robots.txt` so its `Sitemap:` line resolves to a real file; verify `content-type: application/xml` in the built output.
> 3. **Apex robots.txt + OG** — add `apps/landing/public/robots.txt` (+ sitemap line) and static OG tags to `apps/landing/index.html`.
> 4. Verify each change live with `curl -A Googlebot -H "Accept: text/html"` post-deploy (remember the `Accept` header — §1).
>
> Out of scope for that session: JSON-LD (Tier A1), SSG (A2), any SSR. Keep it to the cheap, high-certainty foundation fixes.

---

### Appendix — verification commands used

```bash
# Correct way to probe these routes (Accept header is mandatory):
curl -sL -A "Mozilla/5.0 (compatible; Googlebot/2.1)" \
     -H "Accept: text/html,application/xhtml+xml" \
     "https://musicians.jazzlore.com/musicians/wikidata%3AQ255355"

# Sitemap content-type check (real XML vs SPA fallback):
curl -sL -o /dev/null -w "%{content_type} [%{http_code}]\n" -A Googlebot \
     https://chords.jazzlore.com/sitemap.xml   # → text/html  (BROKEN: SPA shell)
curl -sL -o /dev/null -w "%{content_type} [%{http_code}]\n" -A Googlebot \
     https://musicians.jazzlore.com/sitemap.xml # → application/xml (real, 30,134 URLs)
```

Key source files: `apps/musicians/worker/index.ts` (routing + injection wiring), `apps/musicians/worker/og.ts` (OG/meta/sitemap builders), `apps/musicians/index.html:7` (static description that duplicates), `apps/*/public/robots.txt`, `apps/{chords,scales}/src/App.tsx` (route surface), `apps/landing/src/tiles/*.tsx` (JS-only cross-links), `apps/musicians/docs/detail-perf-findings.md` (CWV).

---

## 13. ADDENDUM — live deployment verification of robots.txt and sitemap.xml

**Date:** 2026-06-15 (same day, follow-up session). **Trigger:** Aurélien navigated a *browser* to `https://musicians.jazzlore.com/sitemap.xml` and `/robots.txt` and got the **SPA home page**, not the files — seemingly contradicting §1/§2's claim that musicians serves a real sitemap + robots. Plus GSC URL Inspection on `…/musicians/wikidata:Q93341` shows **"Dernière exploration: Sans objet"** → Google has **never crawled any Jazzlore URL**. Before submitting sitemaps to GSC we had to know whether they're actually served correctly. Investigation-only; no code changed.

### 13.1 The answer up front

**The files ARE served correctly to Googlebot.** The browser failure is real but **SEO-irrelevant**: it's the musicians **PWA service worker's navigation fallback** returning the cached app shell for top-level navigations to those paths. **Googlebot does not register or run service workers**, so it fetches `robots.txt`/`sitemap.xml` over plain HTTP and gets the real files — exactly what every `curl` combination below returns. The "never crawled" GSC state is the *new-domain discovery* problem from §3, **not** a broken-sitemap problem.

**Bottom line for sequencing:** musicians' sitemap is **safe to submit to GSC now**. The service-worker masking is a separate, low-severity hygiene bug (it confuses humans and any non-Googlebot tooling, and would mislead future manual checks) — fix it, but it is **not** a GSC blocker.

### 13.2 Probe matrix — `musicians.jazzlore.com` (every header/UA combo)

| Combo | `/robots.txt` | `/sitemap.xml` |
|---|---|---|
| bare (no headers) | **200 `text/plain`** ✅ real | **200 `application/xml`** ✅ real |
| `Accept: text/html` | 200 `text/plain` ✅ | 200 `application/xml` ✅ |
| `Accept: text/plain` | 200 `text/plain` ✅ | 200 `application/xml` ✅ |
| `Accept: application/xml` | 200 `text/plain` ✅ | 200 `application/xml` ✅ |
| Googlebot UA (no Accept) | 200 `text/plain` ✅ | 200 `application/xml` ✅ |
| Googlebot UA + full browser Accept | 200 `text/plain` ✅ | 200 `application/xml` ✅ |

**Zero header/UA gating.** No combination returns the SPA shell. robots.txt body = `User-agent: * / Allow: / / Sitemap: https://musicians.jazzlore.com/sitemap.xml`. sitemap.xml = real `<urlset>` (30,134 URLs, confirmed §1). The browser-vs-curl divergence is therefore **not** server-side and **not** a header issue (this is the key difference from §1's `Accept: text/html` catch — that explained the *OG-injection* gate on `/musicians/:id`, which has nothing to do with these two files).

### 13.3 Root cause — PWA service worker navigation fallback (primary evidence)

Source config, `apps/musicians/vite.config.ts:22-31`:

```ts
workbox: {
  globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,woff2}'],
  globIgnores: ['**/*.map', 'sw.js', 'workbox-*.js'],
  navigateFallback: '/index.html',
  navigateFallbackDenylist: [/^\/icons\//, /\.webmanifest$/],   // ← missing /sitemap.xml, /robots.txt, /api
}
```

Deployed proof, fetched live from `https://musicians.jazzlore.com/sw.js`:

```js
e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL("/index.html"),
  {denylist:[/^\/icons\//, /\.webmanifest$/]}))
```

Workbox's `NavigationRoute` matches **any request with `mode: "navigate"`** (i.e. a top-level browser navigation) unless a denylist pattern excludes it. The denylist only excludes `/icons/` and `*.webmanifest`. So in a browser **that has previously loaded musicians (SW installed)**, navigating to `/sitemap.xml` or `/robots.txt` is served the **precached `/index.html`** — the SPA home page. That is precisely Aurélien's symptom.

- **curl / Googlebot / GSC fetcher:** no service worker → request goes to the network → Cloudflare Worker serves the real file. ✅
- **Installed browser:** SW intercepts the navigation → app shell. ❌ (cosmetic; humans only)

This reconciles the follow-up browser test with §1's curl results — both were correct observations of two different request paths.

### 13.4 Correcting the original audit — what was wrong

| Original claim (§1/§5) | Verdict | Correction |
|---|---|---|
| "a real 30,134-URL dynamic sitemap and a permissive robots.txt **injected at the edge via HTMLRewriter (`og.ts`)**" | ⚠️ **Imprecise — own it** | HTMLRewriter (`og.ts:77-90`) **only** rewrites `<title>` and appends `<meta>` into the `<head>` of **HTML documents** for `/musicians/:id`. It has **nothing to do** with robots/sitemap. The audit conflated three distinct mechanisms (see 13.5). The *substance* — that both files exist and are correctly served to crawlers — is **correct** (verified 13.2); the *mechanism attribution* was wrong. |
| "musicians' SEO infra is in decent shape" (exec summary) | ✅ **Holds, with a caveat** | True from Googlebot's perspective. The caveat the audit missed: an installed-browser/SW path masks the files, so any *manual browser* verification will mislead. Not an over-read of the *fact*, but the audit should have tested the SW path. |
| §1 matrix: chords/scales "real sitemap.xml? ❌ referenced but missing" | ✅ **Confirmed, re-verified** | Still true and now re-confirmed via curl (13.6) — these are genuine server-side misses that **do** affect Googlebot. |

The honest framing: the audit was **right that the files work for Google** but **wrong about how they're produced**, and it **failed to test the service-worker path** that produced Aurélien's contradictory result. The mechanism error is exactly the conflation predicted in this session's brief.

### 13.5 The three distinct serving mechanisms (what actually happens)

Per `apps/musicians/worker/index.ts`:

1. **`/sitemap.xml`** → dedicated dynamic route handler `handleSitemap` (`index.ts:149-151` → `121-138`), queries Aura via `searchIndexCypher`, returns `buildSitemap(corpus)` (`og.ts:94-108`) as `application/xml`. **Not** HTMLRewriter.
2. **`/robots.txt`** → **no worker route at all**; falls through to `env.ASSETS.fetch(request)` (`index.ts:165`) which serves the **static file** `apps/musicians/public/robots.txt`. **Not** HTMLRewriter, not dynamic.
3. **`/musicians/:id` HTML documents** → `handleMusicianDocument` → `injectOg` **HTMLRewriter** (`index.ts:153-160`, `og.ts:77-90`). This — and **only** this — is the HTMLRewriter path. It mutates the HTML doc's head; it never touches robots/sitemap.

### 13.6 Per-subdomain corrected state (curl, Googlebot UA + full Accept — no SW involved)

| Subdomain | `/robots.txt` | `/sitemap.xml` | Safe to submit sitemap to GSC? |
|---|---|---|---|
| **musicians** | ✅ `200 text/plain`, real (static asset), references the sitemap | ✅ `200 application/xml`, real, 30,134 URLs (dynamic) | **YES — now** (SW masking is browser-only; GSC's fetcher gets real XML) |
| **chords** | ✅ `200 text/plain`, real, **references `/sitemap.xml`** | ❌ `200 **text/html**` — SPA shell (no file exists) | **NO** — robots advertises a sitemap that returns HTML; create it first |
| **scales** | ✅ `200 text/plain`, real, **references `/sitemap.xml`** | ❌ `200 **text/html**` — SPA shell (no file exists) | **NO** — same as chords |
| **metronome** | ✅ `200 text/plain`, real, **no Sitemap line** (correct) | ❌ `200 text/html` — SPA shell, but **unreferenced** | N/A — single page; no sitemap needed |
| **apex `jazzlore.com`** | ❌ `200 text/html` — SPA shell (**no robots.txt file**) | ❌ `200 text/html` — SPA shell (no file) | **NO** — neither file exists |

Notes:
- chords/scales/metronome `robots.txt` return real `text/plain` via curl because those static files exist and are served by the assets-only Worker; the genuine miss is their **sitemap.xml**, which doesn't exist and so hits `not_found_handling: "single-page-application"` → index.html. This affects Googlebot directly (unlike musicians).
- chords/scales/metronome are also PWAs, so in an installed browser their `robots.txt` would *also* be SW-masked — but that's irrelevant to Google; the server truth for their sitemaps is already "missing."
- apex returning HTML for `/robots.txt` is harmless for crawling (absent robots.txt defaults to "allow all"), but it means there's no server-side sitemap pointer for the apex.

### 13.7 Bugs to fix, ranked by SEO impact

1. **[Real, Googlebot-affecting] chords + scales sitemaps don't exist** but their `robots.txt` advertise them → submitting/relying on them causes GSC "couldn't fetch / not XML" errors. **Fix:** generate build-time static `sitemap.xml` (the ~12 `/{chords,scales}/:root` routes + collection route) served as `application/xml`. *(This is §10 Tier-S item S3 — re-confirmed as a genuine miss, not a false alarm.)*
2. **[Real, Googlebot-affecting] apex has no robots.txt and no sitemap.** **Fix:** add `apps/landing/public/robots.txt` (+ optional sitemap of the apex routes). *(§10 S3 / A3.)*
3. **[Cosmetic / non-Googlebot] musicians SW navigation fallback masks `/sitemap.xml` + `/robots.txt`** for installed browsers. **Fix:** add `/^\/sitemap\.xml$/`, `/^\/robots\.txt$/` (and ideally `/^\/api\//`) to `navigateFallbackDenylist` in `apps/musicians/vite.config.ts:31`. **Not a GSC blocker** — purely so manual/browser checks and non-Googlebot consumers see the real files. The same SW pattern exists in the other PWA apps (chords/scales/metronome); apply the denylist fix family-wide when convenient.

**Important:** bug #3 does **not** change the conclusion that musicians is ready for GSC. It only matters for human/manual verification — which is what tripped us up.

### 13.8 Updated Tier-S sequencing (corrected)

**The absolute first action is unchanged and now verified safe:**

- **S1 (Aurélien, now):** In GSC, **submit `https://musicians.jazzlore.com/sitemap.xml`** and Request-indexing a few seed musician URLs. Verified safe — GSC's fetcher (no SW) receives valid XML. Optionally, before submitting, use GSC's own "Test"/Live-fetch on the sitemap URL to see it succeed (do **not** judge by pasting the URL into a normal browser tab — the SW will lie to you; use an incognito window or `curl` if you want to eyeball it).
- **S1b (Aurélien):** Do **not** yet submit chords/scales/apex sitemaps — they don't exist. Skip them until bug #1/#2 ship.
- **S3 (code, unchanged priority):** create chords/scales static sitemaps + apex robots.txt/sitemap; *then* submit those to GSC.
- **S-new (code, low priority):** add the SW `navigateFallbackDenylist` entries so future manual checks aren't misleading.

This unblocks the GSC work: **musicians can be submitted immediately**; the other surfaces need the cheap sitemap-creation fix (already Tier S in §10) before submission.

### 13.9 Appendix — verification commands (this addendum)

```bash
# Full header/UA matrix (the divergence is NOT here — all return real files):
for H in "" "-H Accept:text/html" "-H Accept:text/plain" "-H Accept:application/xml" \
         "-A Mozilla/5.0_(compatible;_Googlebot/2.1)"; do
  curl -s -o /dev/null -w "%{content_type} [%{http_code}]\n" $H \
       https://musicians.jazzlore.com/sitemap.xml
done   # → application/xml [200] every time

# Proof the browser failure is the service worker, not the server:
curl -s https://musicians.jazzlore.com/sw.js | grep -o 'NavigationRoute.*denylist:\[[^]]*\]'
# → NavigationRoute(createHandlerBoundToURL("/index.html"),{denylist:[/^\/icons\//,/\.webmanifest$/]}
#   (no /sitemap.xml or /robots.txt exclusion → navigations to them get the cached shell)

# Eyeball in a browser WITHOUT being lied to: open an incognito/private window
# (no SW registered) → /sitemap.xml shows real XML.
```

Key source files (this addendum): `apps/musicians/vite.config.ts:22-31` (PWA workbox config), live `…/sw.js` (deployed denylist), `apps/musicians/worker/index.ts:121-165` (sitemap handler + ASSETS fallthrough), `apps/musicians/public/robots.txt` (static robots), `apps/musicians/worker/og.ts:77-108` (HTMLRewriter head injection + `buildSitemap`).
