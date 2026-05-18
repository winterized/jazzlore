/**
 * Unified Cloudflare Worker for the musicians app (locked runtime decision).
 *
 * Serves static assets via the ASSETS binding and owns the `/api/*` surface.
 * Phase A ships only `/api/health` (real, so the wake-up cron has a target from
 * day one) and a 503 stub for every other `/api/*` route. Phase C fills in the
 * Aura-backed BFF (curated / detail / graph / search-index) and Phase 4's
 * HTMLRewriter OG injection. No external deps; never `neo4j-driver`.
 *
 * Self-typed (no `@cloudflare/workers-types` dependency yet): a minimal local
 * `Fetcher` shape is enough for the Phase A static-asset hand-off. Phase C/F
 * will pull in the official Workers types when the BFF needs richer bindings.
 */

interface Fetcher {
  fetch(request: Request): Promise<Response>
}

interface Env {
  ASSETS: Fetcher
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/api/health') {
      return Response.json({ status: 'ok', phase: 'A-stub' })
    }

    if (url.pathname.startsWith('/api/')) {
      return Response.json({ status: 'not-implemented' }, { status: 503 })
    }

    // Not an API route: hand off to static assets. A non-matching path
    // evaluates `not_found_handling: "single-page-application"` (serves
    // index.html with 200) for client-side React Router routes.
    return env.ASSETS.fetch(request)
  },
}
