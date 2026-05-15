/**
 * Phase 9 — Lighthouse mobile audit for the sticky-header feature.
 *
 * Audits the two in-scope pages — /chords/C and /scales/C — on a LOCAL
 * PRODUCTION PREVIEW (not the dev server), mobile form factor, against
 * SYSTEM Chrome (this machine's CLIs are broken, but the Node libs install
 * fine and system Chrome launches headless via chrome-launcher).
 *
 * Targets: performance >= 90, accessibility >= 95 (aspire ~100 a11y/
 * best-practices/SEO, no regression).
 *
 * Usage (from repo root):
 *   pnpm build          # produce apps/{scales,chords}/dist
 *   pnpm lighthouse:audit
 *
 * The script:
 *   1. Spawns `vite preview` for each app on a fixed port.
 *   2. Resolves system Chrome (env CHROME_PATH override → known macOS paths).
 *   3. Launches headless Chrome via chrome-launcher.
 *   4. Runs Lighthouse with the mobile preset against each preview URL.
 *   5. Prints a compact score table and exits non-zero if a gate is missed.
 *
 * It does NOT rebuild — run `pnpm build` first (kept separate so the audit is
 * fast to re-run and the build step is explicit).
 */

import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'
import { launch } from 'chrome-launcher'
import lighthouse from 'lighthouse'

const TARGETS = [
  { app: 'scales', filter: '@jazzlore/scales', port: 4173, path: '/scales/C' },
  { app: 'chords', filter: '@jazzlore/chords', port: 4174, path: '/chords/C' },
]

const GATES = { performance: 90, accessibility: 95 }

/** Resolve a launchable system Chrome binary. */
function resolveChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ].filter(Boolean)
  for (const c of candidates) {
    if (existsSync(c)) return c
  }
  return null
}

/** Spawn `vite preview` for one app and resolve once it answers HTTP 200. */
async function startPreview({ filter, port }) {
  const child = spawn(
    'pnpm',
    ['-F', filter, 'exec', 'vite', 'preview', '--port', String(port), '--strictPort'],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  )
  const url = `http://localhost:${port}`
  const deadline = Date.now() + 60_000
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { method: 'HEAD' })
      if (res.ok || res.status === 404) return { child, url }
    } catch {
      // not up yet
    }
    await sleep(500)
  }
  child.kill('SIGTERM')
  throw new Error(`vite preview for ${filter} did not start on ${url}`)
}

async function runLighthouse(pageUrl, chromePath) {
  const chrome = await launch({
    chromePath,
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
  })
  try {
    const runnerResult = await lighthouse(
      pageUrl,
      { logLevel: 'error', output: 'json', port: chrome.port },
      // Default Lighthouse config is mobile form-factor + mobile throttling.
      undefined,
    )
    const lhr = runnerResult.lhr
    return {
      performance: Math.round(lhr.categories.performance.score * 100),
      accessibility: Math.round(lhr.categories.accessibility.score * 100),
      'best-practices': Math.round(lhr.categories['best-practices'].score * 100),
      seo: Math.round(lhr.categories.seo.score * 100),
    }
  } finally {
    await chrome.kill()
  }
}

async function main() {
  const chromePath = resolveChrome()
  if (!chromePath) {
    console.error(
      'No system Chrome found. Set CHROME_PATH to a Chrome/Chromium binary and retry.',
    )
    process.exit(2)
  }
  console.log(`Using Chrome: ${chromePath}\n`)

  const previews = []
  let failed = false
  try {
    for (const t of TARGETS) {
      const { child, url } = await startPreview(t)
      previews.push(child)
      const pageUrl = `${url}${t.path}`
      console.log(`Auditing ${t.app} → ${pageUrl} (mobile) …`)
      const scores = await runLighthouse(pageUrl, chromePath)
      const pass =
        scores.performance >= GATES.performance &&
        scores.accessibility >= GATES.accessibility
      if (!pass) failed = true
      console.log(
        `  ${t.app}: perf ${scores.performance} · a11y ${scores.accessibility} · ` +
          `best ${scores['best-practices']} · seo ${scores.seo} ` +
          `${pass ? '✓' : '✗ (gate: perf>=90, a11y>=95)'}\n`,
      )
    }
  } finally {
    for (const p of previews) p.kill('SIGTERM')
  }
  process.exit(failed ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(2)
})
