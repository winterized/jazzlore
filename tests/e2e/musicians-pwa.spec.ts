import { test, expect } from '@playwright/test'

/** PWA assertions run against `vite preview` of a production build on a
 *  dedicated port (5185). The dev server (port 5175) intentionally has no
 *  service worker — see apps/musicians/vite.config.ts `devOptions.enabled:
 *  false` — so these tests cannot run against it. The preview-server
 *  webServer entry in playwright.config.ts builds + serves the musicians
 *  dist for this.
 *
 *  Musicians is the only Jazzlore app whose data is dynamic (the BFF under
 *  /api/*). The service worker caches the APP SHELL ONLY — these tests assert
 *  the shell is installable + fresh-serving; offline browsing of musician data
 *  is deliberately NOT a goal (see the PWA conversion plan). */
const PREVIEW_BASE = 'http://localhost:5185'

test.describe('musicians PWA — service worker + manifest', () => {
  test('SW registers and reaches activated state', async ({ page }) => {
    await page.goto(PREVIEW_BASE)
    await page.waitForFunction(
      async () => {
        const reg = await navigator.serviceWorker.getRegistration()
        return reg?.active?.state === 'activated'
      },
      null,
      { timeout: 10_000 },
    )
  })

  test('SW controls the page after one reload', async ({ page }) => {
    await page.goto(PREVIEW_BASE)
    await page.waitForFunction(
      async () => {
        const reg = await navigator.serviceWorker.getRegistration()
        return reg?.active?.state === 'activated'
      },
      null,
      { timeout: 10_000 },
    )
    // clientsClaim is set in workbox config so the reload triggers a
    // navigation that the activated SW controls.
    await page.reload()
    await page.waitForFunction(
      () => navigator.serviceWorker.controller !== null,
      null,
      { timeout: 10_000 },
    )
  })

  test('/sw.js serves with javascript MIME type', async ({ request }) => {
    const res = await request.get(`${PREVIEW_BASE}/sw.js`)
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toMatch(/javascript/)
  })

  test('/sw.js loads workbox runtime + inlines skipWaiting', async ({
    request,
  }) => {
    const res = await request.get(`${PREVIEW_BASE}/sw.js`)
    const body = await res.text()
    expect(body).toMatch(/workbox-[a-f0-9]+/)
    expect(body).toContain('skipWaiting')
  })

  test('/manifest.webmanifest is unchanged by the plugin (regression guard)', async ({
    request,
  }) => {
    const res = await request.get(`${PREVIEW_BASE}/manifest.webmanifest`)
    expect(res.status()).toBe(200)
    const json = await res.json()
    expect(json.name).toBe('Jazzlore Musicians')
    expect(json.display).toBe('standalone')
    expect(json.orientation).toBe('portrait')
    // 4 entries: 192/512 with purpose "any" + 192/512 with purpose "maskable".
    expect(json.icons).toHaveLength(4)
  })

  test('the SW precache does NOT include any /api/* (BFF is never cached)', async ({
    request,
  }) => {
    // workbox inlines the precache manifest into sw.js itself. Assert the app
    // shell is listed (manifest is here, not the runtime chunk) and that NO
    // BFF route leaks in — offline browsing of musician data is not a goal.
    const sw = await (await request.get(`${PREVIEW_BASE}/sw.js`)).text()
    expect(sw).toContain('index.html')
    expect(sw).not.toContain('/api/')
  })
})
