# Jazzlore

A small public portfolio of jazz tools for musicians and learners at jazzlore.com: a landing page and four apps (scales, chords, musicians, metronome), each on its own subdomain. The same web builds are wrapped as native iOS apps in the separate `winterized/jazzlore-ios` repository.

## Commands

- Build and run every test: `scripts/test.sh`
- Narrower run: `scripts/test.sh musicians ui` lints, typechecks, builds and unit-tests only those packages (folder names under `apps/` and `packages/`).
- End-to-end tests, not part of the gate: `scripts/test.sh e2e`, or `scripts/test.sh e2e <spec file> --project=chromium`. It holds a machine-wide lock, so it waits while another checkout runs e2e. Stop any `pnpm dev` server first: it needs ports 5173–5177 and 5183–5186. The run rewrites tracked screenshots in `apps/musicians/docs/baseline/` and `tests/e2e/screenshots/`; unless the task is about those screenshots, restore them afterwards with `git checkout -- apps/musicians/docs/baseline tests/e2e/screenshots`.
- A fresh worktree needs no setup: `scripts/test.sh` runs `pnpm install --frozen-lockfile` itself. Toolchain: pnpm 11 and Node ≥ 22.13 (from nvm on this machine).
- Dev servers: `pnpm dev:<app>` (scales 5173, chords 5174, musicians 5175, metronome 5176, landing 5177). The musicians Worker with its API: `pnpm -F @jazzlore/musicians dev:worker`. It reads Neo4j credentials from `.dev.vars` at the root (git-ignored; `.worktreeinclude` copies it into new worktrees).
- Live-Aura smoke for musicians: `pnpm dlx tsx apps/musicians/scripts/aura-smoke.ts` (read-only queries against production Aura, using `.dev.vars`; `tsx` is not a repo dependency, `pnpm dlx` fetches it into pnpm's cache).
- Lighthouse on local production previews: `pnpm build && pnpm lighthouse:audit`.

## Project memory

The repository is the memory; no chat or session is.

- `docs/ARCHITECTURE.md`: how the system is built today.
- `docs/DECISIONS.md`: dated decisions and their reasons, newest last.
- `docs/briefs/`: the brief of every task, as I wrote it.

## How a task runs

One brief is one task. Each task runs in its own git worktree and branch, so that two or three can run side by side, and it reaches `main` only through `.claude/hooks/land.sh`. I approve the plan and read the result. I am not watching in between, so once the plan is approved, carry the task through to the end without checking in.

1. **Plan.** Read the brief, `docs/ARCHITECTURE.md` and `docs/DECISIONS.md`, then present a plan.
2. **Start.** After I approve: if the session is on `main`, enter a worktree named after the brief's slug before changing anything. Save the brief exactly as I gave it to `docs/briefs/<YYYY-MM-DD>-<slug>.md` and commit it first. The reviewer reads the brief from that file.
3. **Implement.** Commit as you go.
4. **Keep the memory true**, in the same branch. Update `docs/ARCHITECTURE.md` when the change makes it wrong. Append to `docs/DECISIONS.md` each decision the brief records and each choice of yours that a later session would need to know about.
5. **Test.** Run `scripts/test.sh` until it passes, then commit everything so the working tree is clean.
6. **Review.** Delegate to the `reviewer` subagent, giving it only the branch name and the path of the brief. Don't tell it what you did or where to look: it works from the diff. Wait for its report. A hook saves the report; you don't write it anywhere.
7. **If the verdict is BLOCK**, fix every blocker and major finding, run the tests, commit, and ask for one more review. Two reviews per task is the limit. If you think a finding is wrong, don't work around it: stop and tell me which finding and why.
8. **If the verdict is PASS**, run `.claude/hooks/land.sh`. It runs the tests again on exactly what will land, merges and pushes. It can take as long as the test suite, so give it time or run it in the background. If it refuses, do what its message says. If that calls for a third review, stop and tell me.
9. **Report.** Say whether the task landed, and as which commit, or where it stopped and why. Give the command that shows the task's whole diff and the path of each review report. List every finding that was not fixed, minor ones included, in one line each.

Things that are mine:

- `.claude/settings.json`, `.claude/hooks/` and `.claude/agents/reviewer.md` are write-protected, and `land.sh` refuses a branch that changes them. If a task seems to need a change there, stop and tell me.
- `git push` is blocked for sessions. `land.sh` is the only way onto `main`.

## Conventions

- Landing on `main` is a production deploy: Cloudflare's GitHub integration builds and deploys all five Workers on every push to `main`. There is no staging. The iOS apps bundle a frozen snapshot and only change through a rebuild in `jazzlore-ios`.
- Each app keeps its product spec under `apps/<app>/docs/`. Read it before changing behaviour and update it in the same branch.
- `packages/ui` is purely presentational and never imports `@jazzlore/music-core` (ESLint enforces it). `packages/music-core` has no React. Apps convert between the two. Never call Tonal, Tone.js, abcjs or `localStorage` directly from an app: go through `@jazzlore/music-core` (its storage module enforces the `jazzlore:` key prefix).
- Domain logic and pure helpers get a failing test first. Visual fixes get tests too (DOM order, CSS scope); extract a pure helper when the behaviour is buried in a component.
- No `any` (use `unknown` and narrow). Components stay under about 150 lines. Conventional commit messages.
- Any control that plays sound calls `primeAudio()` from `@jazzlore/music-core` as the first synchronous statement of its handler, before any `await` or `setState`. Without it audio is silent on iPhone, and no headless test can catch that.
- Focusable text inputs use `text-[16px]` or larger (iOS Safari zooms on smaller ones); search-style fields also set `autoCorrect`/`autoCapitalize="off"`, `spellCheck={false}` and `inputMode`.
- Controls mounted twice and hidden per breakpoint with Tailwind classes appear twice in jsdom: query them with `getAllBy*` or `within(...)`, never `getBy*`.
- Detect the native iOS shell with `isNativeApp()` from `@jazzlore/ui`. The WKWebView silently ignores some web APIs (`window.print`), and the shell serves from `capacitor://localhost`, which has no `/api`.
- Musicians BFF: Aura through its HTTP Query API and `fetch`, never `neo4j-driver`. Cypher is parameterized and read-only. One page load is one BFF call. Record and collaborator fields are explicit projections in `apps/musicians/worker/cypher.ts`, so a new Aura property reaches the frontend only once it is listed there and in the mapper. Before committing a change to Cypher or Aura-response parsing, run the live-Aura smoke and put its result in your report.
- `/api/musicians/:id` is cached for 12 hours in `caches.default`. A deploy does not clear it and a query string does not bypass it. To see fresh origin data, bump `CACHE_KEY_ORIGIN` in `apps/musicians/worker/cache.ts`. The `x-jazzlore-cache` header (GET only) says hit, miss or bypass.
- Every rendered portrait or album cover shows its attribution caption whenever any license or attribution field is non-empty: CC-BY requires it. Apple Music artwork is never recoloured.
- Quality bars for every public app: Lighthouse performance ≥ 90 and accessibility ≥ 95, measured on a content-heavy detail route as well as the home page, on the live site, median of 3–5 runs. axe-core 0 violations in light and dark. Initial JS ≤ 100 KB gzipped, heavy chunks (notation, audio, graph) dynamically imported. The gate's musicians budget (`tests/musicians-bundle-budget.mjs`) is set to a temporary 112 KB ceiling, because musicians is at 110.6 KB today. The bar is still 100 KB: don't grow that chunk, and the task that brings it under 100 KB also sets the gate back to 100.
- `pnpm lint` stays at 0 errors and 0 warnings; unused `eslint-disable` directives are errors. Prettier is not enforced: don't reformat files you aren't otherwise changing.
- After `land.sh` succeeds, check that the production deploys went through, and put the result in your final report:
  1. Take the merge commit `land.sh` printed and poll, about once a minute for up to 20 minutes: `gh api --paginate "repos/winterized/jazzlore/commits/<sha>/check-runs?per_page=100" --jq '.check_runs[]|select(.name|startswith("Workers Builds"))|"\(.name): \(.status)/\(.conclusion)"'`. Wait until all five (`jazzlore` is scales, then `jazzlore-chords`, `jazzlore-landing`, `jazzlore-metronome`, `jazzlore-musicians`) have completed. They register one after another about a minute apart, `jazzlore-musicians` last; one not listed yet has not started, which is not a failure.
  2. For each app the task changed, confirm the live site serves the new code: fetch the page, find its JS bundle (`assets/index-*.js`, or the lazy chunk the change lives in, such as `assets/graph-*.js`), download it to a file and grep it for a string unique to the change that survives minification, such as an aria-label. Poll for that content, not for a change of bundle hash, which races other deploys. A change to musicians API data can be hidden for 12 hours by the detail cache.
  3. Report a run with `conclusion=failure`, a run still pending after 20 minutes, or a build that passed while the site still serves the old code (Cloudflare's build cache does this sometimes) to me as it is. Don't retry: no empty commits, no dashboard or `wrangler` actions.
