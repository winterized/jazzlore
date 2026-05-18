# Musicians — first-deploy checklist (USER-GATED, out-of-repo)

> **This app's first deploy is user-gated (landmine 14).** The standing
> "auto-merge at the end of a verified feature, user tests in prod" autonomy
> does **not** extend to `apps/musicians` — it has live external dependencies
> (Neo4j Aura) and secrets. Do **not** auto-merge the musicians PR and do
> **not** deploy on the user's behalf. The steps below are Cloudflare/GitHub
> **dashboard actions only the user can perform** (landmine 15); agents cannot.

The runtime is a single **unified Cloudflare Worker** (static assets + the
`/api/*` BFF + HTMLRewriter OG injection) — locked Phase A. Config:
`wrangler.musicians.jsonc` at the **repo root** (`name: jazzlore-musicians`,
`main: ./apps/musicians/worker/index.ts`, `assets` → `./apps/musicians/dist`,
`not_found_handling: single-page-application`).

The siblings (`scales`, `chords`) are assets-only Workers; musicians is the
first with a Worker `main` entry + secrets, so it needs the extra provisioning
below before the GitHub auto-deploy will produce a working site.

---

## 1. Create the Cloudflare Worker project

In the Cloudflare dashboard → **Workers & Pages → Create → Workers**:

- Name the project **exactly** `jazzlore-musicians` (must match
  `wrangler.musicians.jsonc` `name`, and the `scales`/`chords` projects'
  naming pattern).
- Connect it to this GitHub repo (see step 4 for the build wiring) — or do the
  first deploy manually via the CLI fallback in step 6, then attach GitHub
  after.

## 2. Set the Aura environment variables (Worker → Settings → Variables)

Add these **four** variables as **encrypted secrets** (not plaintext vars) on
the `jazzlore-musicians` Worker, Production environment:

| Name             | Value (from your Aura instance)                       |
| ---------------- | ----------------------------------------------------- |
| `NEO4J_URI`      | `neo4j+s://<id>.databases.neo4j.io` (Bolt form is OK — the BFF rewrites it to the HTTPS Query API) |
| `NEO4J_USERNAME` | the Aura username                                     |
| `NEO4J_PASSWORD` | the Aura password                                     |
| `NEO4J_DATABASE` | **the real database name — NOT `neo4j`**              |

> ⚠️ **`NEO4J_DATABASE` must be the real db name (e.g. `d30e12cc`), NOT the
> literal `neo4j`.** This was the Phase-0 bug: the Aura HTTP Query API path is
> `/db/<database>/query/v2`, and hardcoding/defaulting `neo4j` makes every
> non-default instance fail with `DatabaseNotFound`. The worker falls back to
> `neo4j` only when the var is unset — for this Aura instance it must be set
> explicitly to the real name. (Confirmed working locally: `/api/health`
> returned a live `musicianCount` with `NEO4J_DATABASE=d30e12cc`.)

These credentials live **only** in the Cloudflare project env and in the local
gitignored `.dev.vars` — never in the bundle or repo (landmine 12).

## 3. Bind the custom domain

Worker → **Settings → Domains & Routes → Add → Custom Domain**:

- Add `musicians.jazzlore.com` (Cloudflare provisions the cert + DNS since
  `jazzlore.com` is already on Cloudflare).
- This is also what makes the Aura-warm cron meaningful — see step 5.

## 4. Wire Cloudflare ↔ GitHub auto-deploy for the new project

Same model as the existing `scales`/`chords` Workers (push to `main` →
Cloudflare builds & deploys):

- In the Worker's **Settings → Build → Git integration**, connect the repo and
  branch `main`.
- Build command: `pnpm install && pnpm -F @jazzlore/musicians build`
  (produces `apps/musicians/dist`, which the `assets.directory` points at).
- Wrangler config / deploy command: ensure the build uses
  `wrangler.musicians.jsonc` (root config). If the dashboard needs an explicit
  deploy command, use the CLI form from step 6.
- Leave the `scales`/`chords` projects untouched — each app is its own Worker
  project with its own `wrangler.*.jsonc`.

## 5. (Repo, already done) Aura wake-up cron

`.github/workflows/keep-aura-warm.yml` is committed: every 2 days at noon UTC
(+ manual `workflow_dispatch`) it does `curl -fsS --max-time 30
https://musicians.jazzlore.com/api/health` and fails the run on non-2xx.

- It only does anything useful **after steps 1–4** (project deployed + custom
  domain bound). Before that the curl fails and the scheduled run goes red —
  **that is expected pre-launch**, not a regression.
- `/api/health` is `Cache-Control: no-store` by design so the cron forces a
  **live** Aura hit (not an edge-cached response) and actually resumes the
  instance before Aura Free's 3-day idle auto-pause.
- No GitHub secrets are needed — the health endpoint is public and trivial.
- After launch, optionally trigger it once manually (Actions tab →
  "Keep Aura warm" → Run workflow) to confirm green.

## 6. First-deploy / fallback CLI command

Auto-deploy via GitHub is the steady state. For the **first** deploy, or as a
fallback if the Git integration isn't wired yet, deploy from a machine
authenticated to Cloudflare (`wrangler login` once):

```sh
# from the repo root, after `pnpm install && pnpm -F @jazzlore/musicians build`
pnpm -F @jazzlore/musicians deploy
# which runs: wrangler deploy --config ../../wrangler.musicians.jsonc
```

`pnpm -F @jazzlore/musicians deploy` resolves to `wrangler deploy --config
../../wrangler.musicians.jsonc` (the root config). It uploads
`apps/musicians/dist` as assets + the worker entry. Secrets are NOT pushed by
`deploy` — set them once in the dashboard (step 2) or via
`wrangler secret put NEO4J_URI --config wrangler.musicians.jsonc` (repeat for
each of the four).

## 7. Local development / smoke (already verified)

`.dev.vars` at the **repo root** (gitignored, landmine 12) carries the four
`NEO4J_*` for local runs. **Wrangler resolves `.dev.vars` relative to the
config file's directory, NOT the cwd** (confirmed via Cloudflare docs +
Context7) — since `wrangler.musicians.jsonc` is at the repo root, `.dev.vars`
must be at the repo root too (a per-app `apps/musicians/.dev.vars` is NOT
picked up).

```sh
pnpm -F @jazzlore/musicians dev:worker
# wrangler dev --config ../../wrangler.musicians.jsonc
# then: curl http://127.0.0.1:8787/api/health  (or the printed port)
```

Phase F smoke result (local `wrangler dev` 4.92.0 against live Aura):
`GET /api/health` → `200 {"status":"ok","musicianCount":26055}`.

## Pre-merge gate (must all be true before the user merges)

- [ ] Cloudflare `jazzlore-musicians` Worker project created (step 1).
- [ ] All four `NEO4J_*` secrets set, `NEO4J_DATABASE` = real db name (step 2).
- [ ] `musicians.jazzlore.com` custom domain bound (step 3).
- [ ] GitHub auto-deploy wired for the new project (step 4).
- [ ] Phase G complete (e2e + a11y + perf + visual baselines).
- [ ] **User explicitly approves the merge** — no auto-merge (landmine 14).
- [ ] Post-deploy: objective prod probe of `/api/health` + a musician page +
      one manual `keep-aura-warm` run (step 5); on-device mobile + desktop
      graph spot-check by the user.
