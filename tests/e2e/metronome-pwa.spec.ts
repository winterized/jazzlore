import { test, expect } from '@playwright/test'

/** PWA assertions run against `vite preview` of a production build on a
 *  dedicated port (5186). The dev server (port 5176) intentionally has no
 *  service worker — see vite.config.ts `devOptions.enabled: false` — so
 *  these tests cannot run against it. The preview-server webServer entry
 *  in playwright.config.ts builds + serves the metronome dist for this. */
const PREVIEW_BASE = 'http://localhost:5186'

test.describe('metronome PWA — service worker + manifest', () => {
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
    // navigation that the activated SW controls. The controller wire-up
    // is still async after the reload completes, so we wait for it.
    await page.reload()
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, {
      timeout: 10_000,
    })
  })

  test('/sw.js serves with javascript MIME type', async ({ request }) => {
    const res = await request.get(`${PREVIEW_BASE}/sw.js`)
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toMatch(/javascript/)
  })

  test('/sw.js loads workbox runtime + handles precache+navigation', async ({ request }) => {
    const res = await request.get(`${PREVIEW_BASE}/sw.js`)
    const body = await res.text()
    // The entry SW imports the workbox runtime chunk (which carries the
    // precacheAndRoute call + the precache manifest). Whichever hash the
    // build picked, the entry SW must reference workbox-*.js.
    expect(body).toMatch(/workbox-[a-f0-9]+/)
    // skipWaiting is inlined in the entry SW so a new version activates
    // immediately on update (matches registerType 'autoUpdate' intent).
    expect(body).toContain('skipWaiting')
  })

  test('/manifest.webmanifest is unchanged by the plugin (regression guard)', async ({
    request,
  }) => {
    const res = await request.get(`${PREVIEW_BASE}/manifest.webmanifest`)
    expect(res.status()).toBe(200)
    const json = await res.json()
    expect(json.name).toBe('Jazzlore Metronome')
    expect(json.display).toBe('standalone')
    expect(json.icons).toHaveLength(2)
  })
})
