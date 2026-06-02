import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

/**
 * Gate A2 deliverable — the offline UX visuals for Aurélien's spot-check:
 *   (i)  the muted banner overlaying a normally-loaded musician page, and
 *   (ii) the full-page "you're offline" failed-navigation state.
 * Both in light + dark. Screenshots land in test-results/.
 *
 * Runs against the PWA preview build on :5185 (the only build with a service
 * worker, which is what lets a cold offline navigation still boot the app
 * shell from cache — exactly the real failed-navigation path). Chromium only:
 * these are human-review screenshots, not cross-engine pixel baselines.
 *
 * The preview server serves static dist with NO BFF, so the loaded-page shot
 * fulfils /api/* via route interception with a real (trimmed) Miles fixture;
 * the failed-navigation shot lets the fetch genuinely fail under setOffline.
 */
const PREVIEW_BASE = 'http://localhost:5185'
const ID = 'wikidata:Q93341' // Miles Davis
const ENC_ID = encodeURIComponent(ID)

const __dirname = dirname(fileURLToPath(import.meta.url))
const MILES = JSON.parse(
  readFileSync(resolve(__dirname, 'fixtures/musician-detail-miles.json'), 'utf8'),
)

// One combined empty body satisfies every NON-detail /api/musicians/* consumer
// (each reads a single field; extras are ignored), so collaborators/graph/etc.
// self-hide instead of crashing the render.
const EMPTY = { items: [], corpus: [], curated: [], graph: { nodes: [], edges: [] } }

const themes = ['dark', 'light'] as const

// music-core persists the theme under the storage-seam key `jazzlore:theme:v1`
// as a JSON string, and resolveInitialTheme() reads exactly that on boot. Seed
// it before the app loads so the first paint is correct.
const themeInit = (t: string) => {
  try {
    localStorage.setItem('jazzlore:theme:v1', JSON.stringify(t))
  } catch {
    /* ignore */
  }
  document.documentElement.setAttribute('data-theme', t)
}

// Belt-and-braces: the tokens key off html[data-theme], so set it directly
// right before the screenshot — applyTheme can't override what we set last.
async function pinTheme(
  page: import('@playwright/test').Page,
  theme: string,
): Promise<void> {
  await page.evaluate(
    (t) => document.documentElement.setAttribute('data-theme', t),
    theme,
  )
}

test.describe('musicians offline UX (Gate A2 visuals)', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'human-review screenshots — chromium only',
  )

  // A FRESH context per theme — addInitScript accumulates on a reused page, so
  // a single looping page would end up themed by the last init script for both
  // shots. Separate contexts also give each theme a clean SW state.
  test('(i) offline banner overlays a normally-loaded musician page', async ({
    browser,
  }) => {
    for (const theme of themes) {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
      })
      const page = await context.newPage()
      await page.addInitScript(themeInit, theme)
      await page.route('**/api/musicians/**', async (route) => {
        const path = new URL(route.request().url()).pathname
        const isDetail = path === `/api/musicians/${ENC_ID}`
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify(isDetail ? MILES : EMPTY),
        })
      })
      await page.goto(`${PREVIEW_BASE}/musicians/${ENC_ID}`)
      await expect(page.getByText('Miles Davis').first()).toBeVisible()

      // Connectivity drops — the banner appears, the loaded content stays.
      await context.setOffline(true)
      await expect(
        page.getByText(/currently-loaded content remains available/i),
      ).toBeVisible()
      await pinTheme(page, theme)
      await page.screenshot({
        path: `test-results/musicians-offline-banner-${theme}.png`,
        fullPage: true,
      })
      await context.close()
    }
  })

  test('(ii) failed navigation while offline shows the offline state', async ({
    browser,
  }) => {
    for (const theme of themes) {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
      })
      const page = await context.newPage()
      await page.addInitScript(themeInit, theme)

      // Warm the SW + cache the app shell while online.
      await page.goto(PREVIEW_BASE)
      await page.waitForFunction(
        async () => {
          const reg = await navigator.serviceWorker.getRegistration()
          return reg?.active?.state === 'activated'
        },
        null,
        { timeout: 15_000 },
      )
      await page.reload()
      await page.waitForFunction(
        () => navigator.serviceWorker.controller !== null,
        null,
        { timeout: 10_000 },
      )

      // Go offline, then navigate to a not-yet-loaded musician: the SW serves
      // the cached shell, the BFF fetch genuinely fails → the offline screen.
      await context.setOffline(true)
      await page.goto(`${PREVIEW_BASE}/musicians/${ENC_ID}`)
      await expect(
        page.getByRole('heading', { name: /offline/i }),
      ).toBeVisible()
      await expect(page.getByRole('button', { name: /back/i })).toBeVisible()
      await pinTheme(page, theme)
      await page.screenshot({
        path: `test-results/musicians-offline-failednav-${theme}.png`,
        fullPage: true,
      })
      await context.close()
    }
  })
})
