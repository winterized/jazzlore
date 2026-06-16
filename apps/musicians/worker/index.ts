/**
 * Unified Cloudflare Worker for the musicians app (locked runtime decision).
 *
 * Serves static assets via the ASSETS binding and owns the `/api/*` BFF
 * surface. Phase C: real Aura-backed endpoints (curated / detail / graph /
 * search-index / health), per-request OG injection for `/musicians/:id`
 * document navigations, and a dynamic `/sitemap.xml`. `fetch` only — NEVER
 * `neo4j-driver` (landmine 3). No Pages `functions/` dir (landmine 1).
 */

import {
  handleByIds,
  handleCurated,
  handleDetail,
  handleGraph,
  handleHealth,
  handlePolishedIds,
  handleSearchIndex,
  handleSharedRecords,
} from './endpoints'
import { auraQuery, type AuraCreds } from './aura'
import {
  detailCypher,
  reshapeDetail,
  reshapeMusicianRows,
  searchIndexCypher,
} from './cypher'
import { mapSearchCorpus } from '../src/lib/map'
import {
  buildSitemap,
  injectOg,
  musicianJsonLd,
  musicianOgMeta,
} from './og'
import { deriveEra } from './era'
import {
  musicianCacheKey,
  readThroughCache,
  runtimeCacheDeps,
  type CacheDeps,
} from './cache'
import { CACHE, DETAIL_CACHE_TTL, type Env } from './env'

const MUSICIAN_PATH = /^\/musicians\/([^/]+)\/?$/

function auraCreds(env: Env): AuraCreds | null {
  if (!env.NEO4J_URI || !env.NEO4J_USERNAME || !env.NEO4J_PASSWORD) return null
  return {
    uri: env.NEO4J_URI,
    username: env.NEO4J_USERNAME,
    password: env.NEO4J_PASSWORD,
    database: env.NEO4J_DATABASE,
  }
}

/** Wants HTML (document navigation), not a fetch()/asset sub-request. */
function isDocumentNavigation(request: Request): boolean {
  if (request.method !== 'GET') return false
  const dest = request.headers.get('Sec-Fetch-Dest')
  if (dest) return dest === 'document'
  return (request.headers.get('Accept') ?? '').includes('text/html')
}

async function handleApi(
  request: Request,
  env: Env,
  url: URL,
  cache: CacheDeps,
): Promise<Response> {
  const { pathname } = url
  if (pathname === '/api/health') return handleHealth(env)
  if (pathname === '/api/musicians/curated') return handleCurated(env)
  if (pathname === '/api/musicians/search-index') return handleSearchIndex(env)
  if (pathname === '/api/musicians/polished-ids') return handlePolishedIds(env)
  if (pathname === '/api/musicians/by-ids') {
    return handleByIds(env, url.searchParams.get('ids'))
  }
  const graph = pathname.match(/^\/api\/musicians\/([^/]+)\/graph$/)
  if (graph && graph[1]) return handleGraph(env, decodeURIComponent(graph[1]))
  const shared = pathname.match(
    /^\/api\/musicians\/([^/]+)\/collaborators\/([^/]+)\/records$/,
  )
  if (shared && shared[1] && shared[2]) {
    return handleSharedRecords(
      env,
      decodeURIComponent(shared[1]),
      decodeURIComponent(shared[2]),
    )
  }
  const detail = pathname.match(/^\/api\/musicians\/([^/]+)$/)
  if (detail && detail[1]) {
    const id = decodeURIComponent(detail[1])
    // The heavy `detailCypher` + reshape is what trips Error 1102. Serve repeat
    // GETs from a manual `caches.default` read-through so they skip the
    // pipeline (the automatic edge cache never populates — `cf-cache-status`
    // is absent on every response). GET only; a non-200 is never cached.
    if (request.method === 'GET') {
      return readThroughCache(
        cache,
        musicianCacheKey(id),
        { ttl: DETAIL_CACHE_TTL },
        () => handleDetail(env, id),
      )
    }
    return handleDetail(env, id)
  }
  return new Response(JSON.stringify({ status: 'error', error: 'unknown-endpoint' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

/** Per-request OG injection for `/musicians/:id` document navigations.
 * Best-effort: any Aura failure (incl. cold/`waking`) falls back to the
 * untouched SPA shell so the page still renders (decision 7: OG is additive). */
async function handleMusicianDocument(
  request: Request,
  env: Env,
  id: string,
): Promise<Response> {
  const shell = await env.ASSETS.fetch(request)
  const c = auraCreds(env)
  if (c === null) return shell
  try {
    const result = await auraQuery(c, detailCypher(), { id })
    const raw = reshapeDetail(result)
    if (raw === null) return shell
    const m = raw.musician
    const meta = musicianOgMeta({
      id: m.id,
      name: m.name,
      instrument: Array.isArray(m.primary_instruments)
        ? m.primary_instruments[0]
        : undefined,
      era: deriveEra(m),
      bio: typeof m.bio_summary === 'string' ? m.bio_summary : undefined,
      image: typeof m.picture_url === 'string' ? m.picture_url : undefined,
    })
    return injectOg(shell, meta, musicianJsonLd(m))
  } catch {
    // OG is additive (decision 7): any Aura failure incl. cold/`waking`
    // falls back to the untouched SPA shell so the page still renders.
    return shell
  }
}

async function handleSitemap(env: Env): Promise<Response> {
  const c = auraCreds(env)
  const headers = {
    'Content-Type': 'application/xml; charset=utf-8',
    'Cache-Control': CACHE.sitemap,
  }
  if (c === null) return new Response(buildSitemap([]), { headers })
  try {
    const result = await auraQuery(c, searchIndexCypher())
    const corpus = mapSearchCorpus(reshapeMusicianRows(result))
    return new Response(buildSitemap(corpus), { headers })
  } catch {
    // Sitemap is additive — serve the home-only sitemap on any failure.
    return new Response(buildSitemap([]), {
      headers: { ...headers, 'Cache-Control': 'no-store' },
    })
  }
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url)
    const { pathname } = url

    if (pathname.startsWith('/api/')) {
      return handleApi(request, env, url, runtimeCacheDeps(ctx))
    }

    if (pathname === '/sitemap.xml') {
      return handleSitemap(env)
    }

    const musician = pathname.match(MUSICIAN_PATH)
    if (musician && musician[1] && isDocumentNavigation(request)) {
      return handleMusicianDocument(
        request,
        env,
        decodeURIComponent(musician[1]),
      )
    }

    // Not API / sitemap / a musician document: hand off to static assets. A
    // non-matching path evaluates `not_found_handling:
    // "single-page-application"` (serves index.html 200) for React Router.
    return env.ASSETS.fetch(request)
  },
}
