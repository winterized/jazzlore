# journal.md — A month of AI-augmented engineering

*Aurélien Fontaine · May 2026 · Jazzlore project*

---

## Part 1 — Durable lessons

### On the human's role as cross-session memory

The single most important pattern: **the human is the through-line that carries lessons across sessions.** AI coding sessions don't propagate their hard-won learnings to other sessions automatically — each new session starts cold, ready to make the same mistake the last one already learned not to. The human's job, more than writing code, is to *carry the lesson forward* — to notice when a fresh session is about to repeat a known failure mode, and to flag it explicitly.

Concrete instances this month where the human caught a session about to repeat a solved problem:
- The `initialsOf` duplication during the no-photo port (a utility had already been written; the session was about to reinvent it).
- The Spotify-API assumption (the session reached for endpoints that had been removed; the human had read the changelog).
- The `@import` ordering rule (the metronome had already burned on it; the landing page brief tripped on the same rule until the human flagged it).
- The interactive-Playwright-MCP reflex (sessions kept reaching for the wedge-prone interactive browser when the test runner was the right tool).

The implication: **the value of the human is not in writing code, it's in being the only entity in the system that has seen *all* the sessions.** That role doesn't go away as AI gets better; it *increases* in importance as sessions get more capable but no less amnesic.

### On verification gates

**A verification gate only protects what it actually exercises.** A passing gate doesn't mean the thing works; it means the thing works *under the conditions the gate tested*. Failures of this principle this month:
- The landing page passed all gates but broke on mobile landscape, because the test matrix tested portrait mobile and desktop only — landscape was never in the matrix.
- The metronome PWA passed automated gates and Lighthouse but didn't actually open offline, because no gate tested "open from Home Screen with no network."
- The instrument-derivation bug surfaced harmonica for Stevie Wonder despite all tests passing, because no test asserted "the primary instrument is the one his edges most credit."

The discipline: **derive the test matrix from the *promise*, not from the viewports/conditions you happen to have on hand.** If the page promises "four tiles, always visible, no scroll," test every viewport where that promise could break, including the ones you don't physically own.

### On the gap between plausibility and reality

**A plausible plan is not a working plan.** API capabilities, library behaviors, platform quirks — all of these need to be *verified*, not *assumed from priors*. Examples:
- The Spotify top-tracks endpoint was assumed to exist (it had been removed; the user read the changelog).
- The `+jazz` qualifier was assumed to improve search disambiguation (it broke unique-name searches on Apple Music, proven by one real on-device test).
- The instrument qualifier `+piano` was proposed as a better alternative (also empty on Apple Music — one test disproved the whole idea).
- The Neo4j MCP was assumed to work against the project's Aura DB (it doesn't; the BFF is the read surface).
- `100vh` was the intuitive unit for fullscreen layout on iOS (it's broken; `100dvh` is required).

The discipline: **don't trust plausibility — test, verify, or look it up.** One real test disproves more than ten plausible arguments. The cheapest plausibility check is "show me on-device" or "fetch the actual docs."

### On screenshots vs. source-reading for visual judgment

**Screenshots beat source-reading every single time for visual decisions.** Reading a description of what a page does is a bad way to know what it *looks like* or *feels like*. Caught misreads this month, all by the user via screenshots:
- The chord-dots that I interpreted as one thing and were something else.
- The mobile subdomain visibility that the description got wrong.
- The shaded keyboard mistaken for dots.
- The landing-page landscape collapse (only visible in the actual rendered comparison).
- The plain-monogram-vs-figure mixed list (a single screenshot showed both states side by side and pointed straight at the photo-fetch gap, not the figure-system).

The discipline: **for any visual decision, render and look. For any visual fork (Option 3 vs Option 4 on #105), build both, render both, decide from rendered reality.** Descriptions can mislead by *omission* (not telling you what's wrong) and by *charity* (the reader fills gaps with the most favorable interpretation). Pixels can't lie.

### On design iteration: three passes vs. one shot

**Taste-driven work benefits from three iterations; spec-driven work from one.** Match the process to the gap, not to a template.
- Three-pass works for visual design, copy, brand language — anywhere the *first* attempt is necessarily a stake-in-the-ground, the *second* refines from feedback, the *third* polishes. The icon set, the landing page hero, the no-photo figures all benefited from this.
- One-pass works when the spec is clear and complete — the metronome PWA pilot, the secrets audit, the search-fallback simplification. Adding iteration here is procrastination.

The signal for which: **can you write a definitive brief, or do you need to react to a draft?** If you'd struggle to write the brief, do three passes. If you can write a tight brief, do one.

### On cross-AI handoff via structured artifacts

**The brief is the API.** When work crosses session/AI boundaries (Claude Code → Claude Design → back), the structured handoff document is what transfers reliably. Loose verbal context decays; a written brief with frozen constraints, verification gates, and explicit out-of-scope sections survives intact.

This is a real operating model, not just project management — the brief carries the *invariants* across sessions that would otherwise be re-derived (and re-mistaken) each time. The metronome design handoff, the icon brief, the open-source Phase-1 brief all worked because they made the constraints explicit and the verification gates concrete.

### On diagnose-before-fix

**The highest-leverage moves this month were diagnostic, not corrective.** Two examples:
- The instrument-derivation diagnosis turned "we have a missing-data problem (28,689 musicians need enrichment)" into "we have the data, we never derived from it (93% recoverable for free from the existing graph)." A reframe of the *problem* made 93% of the fix free.
- The Stevie Wonder and Al Viola bugs *looked* unrelated (wrong primary vs. missing primary) but shared a root cause (`primary_instruments` was a passive Wikidata dump, never derived from edges). Diagnosing the root cause meant *one* fix solved both, instead of two independent enrichments.

The discipline: **before building a fix, characterize the problem.** Ask the session to *diagnose, then propose*, not propose-and-build. The cheapest fix is the one that turns out not to be needed because the framing changed.

### On stalls — three flavors with opposite remedies

Sessions stall in distinct ways that look identical from outside but need opposite responses:

1. **Tool wedge.** The tool call hangs and the session can't recover from inside. Fix: kill the process from outside. (Hit with Playwright MCP, browser MCP.)
2. **Tool misuse with a guard firing.** The session keeps misusing a working tool (e.g. editing files without reading them first). Fix: durable instruction to follow the protocol. (Hit with Claude Code's read-first guard.)
3. **Wrong tool for the job.** The session is using a tool that's incompatible with the target (Neo4j MCP against an Aura DB it can't query). The session "fixes" its code repeatedly with no effect because the problem is outside its code. Fix: redirect off the tool entirely.
4. **Deliberation churn.** The session pauses to over-consider after each result instead of proceeding. Fix: nudge to keep going; a durable "proceed autonomously through the batch" instruction.
5. **API socket drop.** Just resume.

The discipline: **don't immediately stop/restart on a stall — diagnose which kind.** Wrong response to wrong diagnosis can make it worse (e.g. removing the read-first guard would corrupt files; the right answer is teaching the protocol).

### On session longevity

**Long-running sessions accumulate compaction loss.** Beyond some threshold (days to weeks, depending on intensity), a session's operational precision degrades silently — the narrative survives, the "I just read this file" specificity does not. Symptoms include the read-first guard firing repeatedly, the session claiming to have fixed something that's still broken, and subtle drift in conventions.

The fix is restart, but with discipline: **for agentic sessions (Claude Code), the persistent layer (CLAUDE.md, standing memories) catches most of the load, so restart cost is low.** For advisory threads with no persistent layer, restart cost is higher — the warm context *is* the knowledge — and the lessons should be written down (this document) *before* the restart so they survive.

The leading indicator that a session has crossed the line: **"the session says it's fixed but it isn't,"** repeatedly, despite multiple attempts. That's the signal to restart, not to keep nudging.

### On credentials and irreversibility

**Public is irreversible. Rotate, don't just delete.** The discipline that protected the open-source release:
- Full-history secrets audit (gitleaks + trufflehog over every commit on every ref), not just HEAD.
- A live secret found in history requires *rotating the credential at the provider*, not just removing it from the file. A removed-but-not-rotated secret is still live in caches, forks, and clones.
- History rewriting (BFG, filter-repo) is optional once the credential is rotated dead, and it's destructive (breaks clones), so it's a separate decision from the rotate.
- The human handles credential rotation by hand — the AI writes the code that reads env vars, the human creates/rotates the accounts.

The frontend audit came back clean (0 hits across 406 commits / 91 refs). The populator audit is harder and pending — different repo, credentials in history, deferred deliberately.

### On the user's vs. the AI's role with credentials

A specific protocol that worked all month: **the human creates accounts and provides credentials by hand into `.env` files (which are gitignored); the AI writes the code that reads `process.env.X` and never sees the value.** This kept secrets out of the AI's context entirely. It's a small discipline that costs nothing and provides a real safety guarantee: even an AI that wanted to leak a credential couldn't, because it never had one.

### On the limits of "ship on green"

The default discipline for the month was "ship on green, the user tests prod" — fine for live-app development where regressions are quickly visible and recoverable. **That posture inverts for irreversible actions:** open-sourcing, account changes, anything public. Public commits, public repos, published packages cannot be un-shipped. So for those: audit exhaustively *first*, then publish; never publish-and-clean-up.

### On color, distinguishability, and accessibility

**Color is an additive signal, never the sole one.** The per-app icon dot colors (amber/blue/purple/mauve/sage) distinguish browser tabs for the ~90% who see color; the page title and app name carry identification for the ~10% who don't. The discipline: *color enhances on top of always-present text*, it never replaces it. Defensible because the text underneath does the work for everyone; color is the icing.

### On the test-runner-vs-MCP recurring reflex

This came up repeatedly across briefs. Sessions kept reaching for the interactive Playwright MCP because it's right there in the tool list — for visual verification, for cross-device testing, for emulation. The correction every time: **use the Playwright test runner instead.** The test runner spawns short-lived browsers that can't wedge the session; the interactive MCP holds a long-lived browser that has hung repeatedly. The capability is the same; the failure modes are not.

Lesson: a tool being available in the toolbar is not the same as being the right tool. The human-as-through-line caught this reflex multiple times.

### On meta: the lessons compound when surfaced

A repeated experience this month: a lesson learned in Project A (the metronome PWA pilot) became a *pattern* for Project B (scales/chords replication) and a *durable principle* by Project C (the icon set). The compounding only happened because the lesson got *named* — surfaced explicitly, written down, referenced. Lessons that stayed implicit had to be rediscovered. **Writing the lesson is the move that lets it compound; not writing it is the move that loses it.** Hence: this document.

---

## Part 2 — Guidance on future steps

### Where things stand at the end of the month

- **Five surfaces live and good:** jazzlore.com (landing), scales.jazzlore.com, chords.jazzlore.com, musicians.jazzlore.com, metronome.jazzlore.com.
- **Three are PWAs that work offline** (scales, chords, metronome), each with its own Home Screen identity (per-app icon, per-app color), an install button affordance, and proven offline operation from a cold launch in airplane mode.
- **The frontend monorepo is public and MIT-licensed** (github.com/winterized/jazzlore), with clean history (0 secrets found in audit), proper data attribution, and a README.
- **The populator is *not* public** — separate repo, harder audit pending, credentials in history.
- **Aura is the live data backend** — the BFF talks to it via HTTP Query API (the Neo4j MCP doesn't work on this instance).
- **The instrument-derivation pass shipped**, covering 93% of previously-missing primary instruments at zero API cost. The ~1,082 residual gets a one-shot MB re-fetch cleanup. The frontend `rest`-figure fallback shipped, so genuinely-instrumentless musicians get a dignified at-rest figure, never a bare monogram.
- **Issue #105 resolved** via Option 4 (sticky-footer Start), proven across the 5-device shim matrix and confirmed on-device.

### Open issues and their states (as of late May 2026)

- **#37** (relationship context "First Great Quintet, 1955–60") — needs an editorial data source. Real project, deferred. Help-wanted.
- **#69, #70** (no-photo figures in autosuggest, hero-with-figure + legal-caption) — partly addressed by the `rest`-figure fix; #70 is a design decision more than code.
- **#71** (figKey edge-case test coverage) — small hygiene, do anytime.
- **#82** (Tier-2 streaming enrichment, programmatic top-track) — obsoleted by Spotify API removal. Close or rewrite.
- **#83** (Tier-3 shared-record tracks on ConnRow) — real future enhancement.
- **#85** (expanded "rest" list shows monograms for has-photo musicians) — fix in flight (progressive photo enrichment with prefetch).
- **#112** (deterministic role-pick on multiple PLAYED_ON edges) — populator/data correctness.
- **#115** (extract `useSwipeDownDismiss` hook, share with MoreAboutSheet) — hygiene/dedupe.

### The native-app fork

The architecture question has been answered by lived PWA use: **the PWAs feel genuinely good**, so a thin shell (Capacitor-style wrapping the existing PWAs) is likely sufficient when the time comes — no need for genuinely-native rebuilds. The Apple Developer Program is the common gate (needed for native shells and for Issue #5 Apple streaming enrichment). User has paused this deliberately; not yet.

### The Issue #5 enrichment

Apple Music streaming enrichment (closing the <30% Apple coverage gap) is *funded* by the Apple Developer Program purchase that the native-app work would necessitate. So it slots naturally alongside the eventual native work — same account, populator pass that runs once.

### The populator open-source

A separate, harder audit than the frontend. The populator repo has Aura/Discogs (and eventually Apple) credentials in history. Rotation would have a same-day cascade (the frontend's `.dev.vars` + Cloudflare binding share the Aura credential). Deliberately deferred; only do it if you want it public.

### The longer-tail enhancements

- The ~948 isolated-stub musicians (no edges, unrecoverable from current graph state) — background cleanup, possibly via a fresh source fetch.
- The 22 indeterminate namesakes (the disambiguation residual from the consolidation work).
- Album covers (Wave 2b) — Cover Art Archive integration.
- The graph-rethink / album-search strategic fork (real product question, real project).

### Operating principles to carry forward

Some patterns are worth keeping as standing practice across future projects, not just this one:

- **The human carries lessons across sessions; the AI does not.** Write the lessons down.
- **Verify by rendering or testing, not by description.** Especially for visual work.
- **Match process to the work.** Three-pass for taste, one-pass for spec.
- **Diagnose before fixing.** The most expensive bugs are the ones whose framing is wrong.
- **Frozen shapes are load-bearing.** When a type/contract is declared frozen, the work routes around it; when it isn't, work corrodes the type quietly. Be explicit about what's frozen.
- **Code-reviewer subagent before every merge.** Cheap, reliable catch of subtle issues.
- **Test runner, never interactive Playwright MCP.** Spawn-and-die, don't long-lived.
- **Rotate, don't delete, for credentials.** Public is irreversible.
- **The on-device test is the final gate for anything visual or experiential.** Especially for PWAs.

---

## Part 3 — LinkedIn-post-ready material

What follows are *post seeds* — neither too long nor too polished. Each is a real, specific moment from the month that carries a transferable lesson. Pick whichever resonate, rewrite in your voice (these are scaffolds, not finished posts), expand the ones that feel right.

### Post 1 — "I took a month off to learn AI-augmented engineering"

*Opener:* I'm an engineering director who hadn't written code in years. I took a month off to learn what AI-augmented software engineering actually feels like today, hands-on.

*Body — what got built:* In four weeks, I shipped five web apps under jazzlore.com — a jazz reference site covering scales, chords, a metronome, and a graph-based exploration of who played with whom across the history of jazz. All four practice tools are PWAs that work offline at the piano. The frontend monorepo is open-source (MIT).

*The honest claim:* I didn't write most of the code. I directed it — through plans, briefs, screenshots, on-device tests, and a lot of "no, do it this way." The work is real; my role in it was different from what I'd been doing the last decade.

*The takeaway:* The bottleneck of building software has shifted. The valuable skill isn't typing code anymore; it's knowing what good looks like, framing the problem precisely, and recognizing when a session is about to make a mistake you've seen before. Engineering directors might actually have a new kind of leverage here.

*Repo:* github.com/winterized/jazzlore

---

### Post 2 — "The human is the cross-session memory"

*Opener:* The hardest lesson of a month spent directing AI engineering sessions: the AI doesn't remember anything across sessions, but you do — and that's where your value lives.

*The pattern:* Every new session starts cold. The lesson Session A learned last Tuesday is invisible to Session B today. So Session B happily walks into the same trap.

*Concrete examples from this month:*
- A session reached for a Spotify API endpoint that had been removed three months ago. I'd read the changelog; the session hadn't.
- A session proposed using `+jazz` to disambiguate musician search — I tested it on my actual phone, found it returned "No Results" for unique names. The session would have shipped the bug.
- A session kept reaching for an interactive browser tool that wedges. I had to redirect it to the test runner equivalent every single time.

*The reframe:* Your job isn't to write better code than the AI. It's to be the only entity in the system that has seen *every* session. You carry the lessons forward; you catch the reflex that's about to repeat the last mistake.

*Implication:* This role doesn't disappear as AI gets more capable. It gets more important. The sessions get faster, smarter, more autonomous — and just as amnesic.

---

### Post 3 — "Plausibility is not reality"

*Opener:* The single most expensive failure mode in AI-augmented engineering is also the most seductive: a plausible answer that hasn't been verified.

*The story:* My session proposed adding the artist's instrument to a music search query — "Antoine Karacostas piano" — to disambiguate from possible homonyms. The reasoning was airtight: same-named musicians rarely share an instrument, so the instrument should be a clean differentiator.

I tested it on Apple Music. Empty. No results. Apple's search does a strict multi-term match, and Antoine's catalog isn't tagged with "piano" as searchable text. The plausibly-better disambiguator was actually worse than plain search.

One real on-device test killed an entire elegantly-reasoned plan.

*The takeaway:* Don't trust plausibility. Test, verify, look it up. The cheapest plausibility check is "show me what actually happens" — on a real device, against a real API, with real data. Ten plausible arguments lose to one real test, every time.

---

### Post 4 — "Screenshots beat source-reading, every single time"

*Opener:* I learned the hard way this month that the worst way to judge a visual design is to read someone's description of it. The best way is to render it and look.

*The catch list:* Multiple times this month, an AI session described a UI as working a certain way, and I almost believed it — until I asked for a screenshot. Every time, the screenshot showed something the description had missed:
- A landing page that worked beautifully on mobile portrait but completely collapsed in mobile landscape (showed only one of four tiles).
- A musician list that the session described as "renders figures for everyone" — the screenshot showed half figures, half bare monograms, and pointed straight at the bug.
- A metronome layout where one option "preserved the design" and the other "moved the button" — when both were actually built and rendered, the design-preserving one didn't work at all; the start button was clipped offscreen on every device tested.

*The takeaway:* For visual work, the gap between "the session says it looks right" and "it actually looks right" is large and dangerous. Build it, render it, look at it. For visual forks, build *both* candidates, render both, and decide from rendered reality. Descriptions can charity their way past flaws; pixels can't.

---

### Post 5 — "Diagnose before fixing"

*Opener:* The highest-leverage moves this month weren't fixes. They were diagnoses.

*The story:* I had what looked like two unrelated bugs in my musicians database. Stevie Wonder's primary instrument was wrong (harmonica beat piano). And thousands of obscure session players had no primary instrument at all — they rendered as bare monograms instead of instrument icons.

I assumed I had a missing-data problem. A populator session disagreed. It went looking for the root cause and found that *both* bugs were faces of the same flaw: the database had never *derived* a primary instrument; it had passively copied whatever Wikidata happened to claim. Stevie had a list but it was in arbitrary order; the obscure players had no Wikidata entry at all so they had no list.

The reframe: "we have a missing-data problem" became "we have the data, we never derived from it." 93% of the gap closed for free, with one aggregation pass over data already in the graph. The fix that would have been weeks of careful API work became a single derivation step.

*The takeaway:* The most expensive bugs are the ones whose framing is wrong. Before building a fix, characterize the problem. The cheapest fix is the one that turns out not to be needed because the problem turned out to be something else.

---

### Post 6 — "The verification gate only protects what it exercises"

*Opener:* My metronome PWA passed every automated test. Lighthouse green, CI clean, all baselines matching. Then I took my phone to airplane mode, tapped the icon, and it said: "Not connected to Internet."

*The catch:* The tests verified everything *except* the one thing the PWA was for. There was no test for "open from the Home Screen with no network." The whole point of a PWA. Untested.

This wasn't a one-off. Throughout the month I kept finding cases where the gate had quietly drifted from what the feature *promised*:
- A landing page test matrix covered portrait mobile and desktop. Mobile landscape was the bug.
- An instrument derivation passed all tests. The tests didn't assert "primary instrument should be the one his edges most credit."
- A search feature returned valid results. None of the tests checked whether the right artist appeared first.

*The discipline:* Derive your test matrix from the *promise of the feature*, not from the conditions you happen to have on hand. If the page promises "always visible, no scroll," test every viewport where that promise could break — including the ones you don't physically own. A passing test isn't a working feature; it's a feature that works under the tested conditions.

---

### Post 7 — "Why the code session keeps stalling — five different reasons, opposite fixes"

*Opener:* My AI coding session would sometimes just... stop. Same symptom every time. Five different root causes. Opposite fixes for each.

*The taxonomy I built up:*
1. **The tool actually hung.** A browser MCP wedged itself. Recovery: kill from outside; the session can't escape on its own.
2. **The session was using the wrong tool entirely.** It was querying a database via an MCP that's known not to work against my specific cloud instance. It "fixed" its code repeatedly with no effect because the code wasn't the problem — the tool was. Recovery: redirect off the tool.
3. **A safety guard fired.** The session tried to edit a file without first reading its current contents — and there's a rule that blocks that, because editing-without-reading is how silent corruption happens. Recovery: teach the protocol (read first, every time).
4. **The session was deliberating.** Not stuck — just over-pausing between steps. Recovery: a durable "proceed autonomously" instruction.
5. **The API socket dropped.** Recovery: just resume.

*The takeaway:* "The session stops" is a symptom with at least five different causes, each needing the opposite remedy. The instinct to restart on every stall is wrong — sometimes the restart is the right call, sometimes it's the worst thing you can do. The skill is diagnosing which kind of stall this is.

---

### Post 8 — "Going public is irreversible. Rotate, don't delete."

*Opener:* Before I open-sourced my project, I scanned the git history for secrets. Multiple tools. Across every branch and tag. Across 406 commits.

It came back clean. But the discipline matters even when nothing's found, because here's the thing nobody tells you about open-sourcing: **public is irreversible**.

*The asymmetry:* Most development this month has been "ship on green, fix in prod if needed" — fine, because regressions are visible fast and recoverable. Open-sourcing inverts that. Once a repo is public, it's cloned, forked, cached, and archived within minutes. You cannot un-leak a secret by making the repo private again.

*The rotation discipline:* The instinct when you find a leaked credential is to delete it from history. That's both *hard* (history rewriting breaks every existing clone) and *insufficient* (the credential may already be in caches, forks, copies). The *correct* fix is to **rotate the credential at the provider** — regenerate it so the leaked one is dead, regardless of whether it's still in history. A rotated-dead credential in history is harmless. A live credential anywhere is a problem.

*The bigger lesson:* Some changes have undo. Some don't. Recognize which kind you're making and adjust your verification accordingly.

---

### Post 9 — "Three-pass design beats one-shot, but only when it should"

*Opener:* I learned this month that the question "how many iterations should I do?" has a useful answer, and it's not "as many as you can afford."

*The split:* Some work benefits from three passes. Some work benefits from one. The signal that tells you which is whether you can write a tight brief up front.

*Three-pass examples (taste-driven, brief is necessarily incomplete):*
- The landing page hero. The first pass set the stake; the second responded to "the wordmark feels wrong"; the third nailed it.
- The icon set. First pass picked colors and motifs; second checked legibility at 16px; third tuned distinguishability.
- The no-photo figures. First pass got the family of shapes; second simplified at small sizes; third resolved unknown-instrument as a poised at-rest figure.

*One-pass examples (spec-driven, brief is complete):*
- The metronome PWA pilot. Service worker, self-host fonts, manifest, prove it works offline.
- The secrets audit. Run scanners over full history, classify findings, prepare license and attribution.
- The search-fallback simplification. Drop the qualifier, ship plain search.

*The signal:* If you'd struggle to write the brief, do three passes. If you can write the brief in a paragraph, one is right. The mistake is doing three passes on spec-driven work (procrastination) or one pass on taste-driven (surface-level quality).

---

### Post 10 — "What I'll keep from the month"

*Opener:* A month is too short to learn everything but long enough to find what to keep. Here's the list.

*The keepers:*
- **The human carries the lessons across sessions.** The AI doesn't. Write things down or they're lost.
- **Verify by rendering or testing.** Especially for anything visual. Descriptions mislead; pixels and on-device tests don't.
- **Diagnose before fixing.** The most expensive bugs are the ones whose framing is wrong.
- **Match process to work.** Three iterations for taste, one for spec. The mistake is mismatching.
- **Frozen shapes are load-bearing.** Declare what's frozen and the work routes around it; leave it implicit and it corrodes.
- **Code-reviewer subagent before every merge.** Cheap insurance against subtle issues.
- **The on-device test is the final gate.** Especially for PWAs. Especially for visual work.
- **Rotate, don't just delete, for credentials.** Public is irreversible.

*The reframing:* I came into this month thinking AI-augmented engineering was about typing less. It turned out to be about *directing more*. Less typing, more judgment. Less syntax, more "no, do it this way." Less code review, more cross-session memory. The skill set has shifted; the skill set is still real.

*Closing:* The codebase is at github.com/winterized/jazzlore. The tools are at jazzlore.com. The month is over. The discipline is just starting.

---
