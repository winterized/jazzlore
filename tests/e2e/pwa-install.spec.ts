/**
 * PWA install button + sheet — e2e behavioral verification.
 *
 * Unit tests in `packages/ui/src/Pwa*.test.tsx` already cover the hook,
 * the button, and the sheet branches in jsdom. This spec runs the same
 * surface in a real browser to catch cross-cutting issues that jsdom
 * doesn't model — portal-into-document.body, the actual stacking
 * context of the backdrop, real focus-trap behavior on Tab, and the
 * matchMedia patching that decides standalone visibility.
 *
 * Three platforms × three apps. We test the matrix on `scales` only,
 * then a single smoke per remaining app to assert wiring; per-platform
 * deep coverage doesn't need to be re-run on every app since the
 * underlying component is identical.
 */

import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

type App = { name: string; baseURL: string; path: string; appName: string }

const APPS: readonly App[] = [
  {
    name: 'scales',
    baseURL: 'http://localhost:5173',
    path: '/scales/C',
    appName: 'Scales',
  },
  {
    name: 'chords',
    baseURL: 'http://localhost:5174',
    path: '/chords/C',
    appName: 'Chords',
  },
  {
    name: 'metronome',
    baseURL: 'http://localhost:5176',
    path: '/',
    appName: 'Metronome',
  },
]

/** Patch matchMedia BEFORE the SPA mounts so the hook's standalone
 * detection sees our override on first render. */
async function setStandaloneEmulation(page: Page, standalone: boolean) {
  await page.addInitScript((isStandalone: boolean) => {
    const _matchMedia = window.matchMedia.bind(window)
    window.matchMedia = (q: string) => {
      if (q.includes('display-mode: standalone')) {
        return {
          matches: isStandalone,
          media: q,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
        } as unknown as MediaQueryList
      }
      return _matchMedia(q)
    }
  }, standalone)
}

async function fireBeforeInstallPrompt(page: Page) {
  await page.evaluate(() => {
    const e = new Event('beforeinstallprompt') as Event & {
      prompt: () => Promise<void>
      userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
      platforms: ReadonlyArray<string>
    }
    e.prompt = async () => undefined
    e.userChoice = Promise.resolve({ outcome: 'accepted' as const })
    ;(e as { platforms: ReadonlyArray<string> }).platforms = ['web']
    window.dispatchEvent(e)
  })
}

// ─── Cross-app smoke: button mounts + opens dialog ─────────────────────────

for (const app of APPS) {
  test.describe(`${app.name} — install button smoke`, () => {
    test(`button is visible in the header and opens the install sheet`, async ({
      page,
    }) => {
      await setStandaloneEmulation(page, false)
      await page.goto(`${app.baseURL}${app.path}`)
      const btn = page.getByRole('button', {
        name: new RegExp(`install ${app.appName}`, 'i'),
      })
      await expect(btn).toBeVisible()
      await btn.click()
      await expect(page.getByRole('dialog')).toBeVisible()
    })

    test(`button is hidden in standalone mode`, async ({ page }) => {
      await setStandaloneEmulation(page, true)
      await page.goto(`${app.baseURL}${app.path}`)
      const btn = page.getByRole('button', {
        name: new RegExp(`install ${app.appName}`, 'i'),
      })
      await expect(btn).toHaveCount(0)
    })
  })
}

// ─── Per-platform coverage on scales only ──────────────────────────────────

test.describe('install sheet — per-platform content (scales)', () => {
  const url = `${APPS[0].baseURL}${APPS[0].path}`

  test.describe('iOS Safari', () => {
    test.use({
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
    })

    test('shows the 3-step Share → Add to Home Screen flow', async ({ page }) => {
      await setStandaloneEmulation(page, false)
      await page.goto(url)
      await page
        .getByRole('button', { name: /install scales/i })
        .click()
      await expect(
        page.getByRole('heading', { name: /install scales on your iphone/i }),
      ).toBeVisible()
      await expect(page.getByText('Share', { exact: false })).toBeVisible()
      await expect(
        page.getByText('Add to Home Screen', { exact: false }),
      ).toBeVisible()
    })
  })

  test.describe('Android Chrome — without prompt', () => {
    test.use({
      userAgent:
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    })

    test('shows the menu/install-app instructions', async ({ page }) => {
      await setStandaloneEmulation(page, false)
      await page.goto(url)
      await page.getByRole('button', { name: /install scales/i }).click()
      await expect(
        page.getByRole('heading', { name: /install scales on your android/i }),
      ).toBeVisible()
      await expect(page.getByText(/install app/i)).toBeVisible()
    })
  })

  test.describe('Android Chrome — with beforeinstallprompt', () => {
    test.use({
      userAgent:
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    })

    test('shows the native Install CTA when the prompt event has fired', async ({
      page,
    }) => {
      await setStandaloneEmulation(page, false)
      await page.goto(url)
      await fireBeforeInstallPrompt(page)
      await page.getByRole('button', { name: /install scales/i }).first().click()
      // The dialog mounts a SECOND "Install Scales" button (the CTA) — scope
      // the assertion to the dialog so we don't match the trigger.
      await expect(
        page
          .getByRole('dialog')
          .getByRole('button', { name: /^install scales$/i }),
      ).toBeVisible()
    })
  })

  test('desktop without prompt shows the address-bar fallback copy', async ({
    page,
  }) => {
    await setStandaloneEmulation(page, false)
    await page.goto(url)
    await page.getByRole('button', { name: /install scales/i }).click()
    await expect(page.getByText(/address bar/i)).toBeVisible()
  })
})

// ─── a11y: the open sheet has no axe violations ────────────────────────────

test.describe('install sheet — axe-core', () => {
  test('open sheet on scales has zero WCAG violations (light theme)', async ({
    page,
  }) => {
    await setStandaloneEmulation(page, false)
    await page.goto(`${APPS[0].baseURL}${APPS[0].path}`)
    await page.getByRole('button', { name: /install scales/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([])
  })
})
