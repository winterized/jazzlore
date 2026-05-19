/**
 * Phase D — visual baseline capture (Playwright-driven, deterministic,
 * committed). Mirrors the repo convention (Phase E used a committed capture
 * spec → apps/musicians/docs/graph-baseline/; the root .gitignore swallows
 * any `baselines/` dir, so this writes to `docs/baseline/`).
 *
 * Views: home, detail rich (Miles), detail sparse (Antoine), autosuggest
 * open, More-about sheet open, waking, desktop-with-graph — at mobile 390
 * and desktop 1280, light + dark. Animations/caret are frozen for stable,
 * re-runnable captures (not an MD5 gate — a visual reference set).
 *
 * Run on demand:
 *   npx playwright test musicians-baseline-capture --project=chromium
 */

import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import { mockBff } from './musicians-bff-mock'

// Mirrors musicians-a11y.spec.ts: BASE parameterized for localhost-mock vs
// live-BFF mode. The localhost dev server has no `/api/*` (Vite serves only
// the SPA bundle) — since the H1 seam swap (commit cba2ee8) THIS spec has
// silently been hitting a SPA error state without the mock; Phase 0 restores
// localhost capture AND enables prod/preview capture in one parameterization.
const BASE = process.env.BASE ?? 'http://localhost:5175'
// Same heuristic as musicians-a11y.spec.ts — HTTPS is unambiguously live; any
// http://... (incl. 127.0.0.1, *.local) is local.
const IS_LIVE_BFF = /^https:\/\//.test(BASE)
const MILES = '/musicians/wikidata:Q93341'
const ANTOINE_ID = IS_LIVE_BFF ? 'wikidata:Q586360' : 'wikidata:Q2856321'
const ANTOINE = `/musicians/${ANTOINE_ID}`
const WAKING = '/musicians/__preview/waking'

const here = dirname(fileURLToPath(import.meta.url))
const OUT = join(here, '..', '..', 'apps', 'musicians', 'docs', 'baseline')

const FREEZE = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    caret-color: transparent !important;
  }
`

test.use({ baseURL: BASE })

// Localhost-mock mode needs the BFF stub; live mode hits the real BFF.
test.beforeEach(async ({ page }) => {
  if (!IS_LIVE_BFF) await mockBff(page)
})

function themeOf(page: Page): Promise<string | null> {
  return page.locator('html').getAttribute('data-theme')
}

async function setTheme(page: Page, want: 'light' | 'dark'): Promise<void> {
  if ((await themeOf(page)) !== want) {
    const before = await themeOf(page)
    await page.getByRole('button', { name: 'Toggle theme' }).first().click()
    await expect.poll(() => themeOf(page)).not.toBe(before)
  }
  await expect.poll(() => themeOf(page)).toBe(want)
}

async function shoot(page: Page, name: string): Promise<void> {
  await page.addStyleTag({ content: FREEZE })
  await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: true })
}

type Viewport = { tag: 'm390' | 'd1280'; w: number; h: number }
const VIEWPORTS: Viewport[] = [
  { tag: 'm390', w: 390, h: 844 },
  { tag: 'd1280', w: 1280, h: 900 },
]
const THEMES = ['light', 'dark'] as const

for (const vp of VIEWPORTS) {
  for (const th of THEMES) {
    const sfx = `${vp.tag}-${th}`
    test.describe(`baseline ${sfx}`, () => {
      test.use({ viewport: { width: vp.w, height: vp.h } })

      test('home', async ({ page }) => {
        await page.goto('/musicians')
        await expect(
          page.getByRole('heading', { level: 1, name: /step into a musician/i }),
        ).toBeVisible()
        await setTheme(page, th)
        await shoot(page, `home-${sfx}`)
      })

      test('detail-rich', async ({ page }) => {
        await page.goto(MILES)
        await expect(
          page.getByRole('heading', { level: 1, name: /miles davis/i }),
        ).toBeVisible()
        await setTheme(page, th)
        // Desktop ≥1024 also exercises the lazy graph panel.
        if (vp.tag === 'd1280') {
          await expect(
            page
              .getByRole('complementary', { name: /collaboration graph/i })
              .getByRole('application'),
          ).toBeVisible()
          await shoot(page, `detail-rich-graph-${sfx}`)
        } else {
          await shoot(page, `detail-rich-${sfx}`)
        }
      })

      test('detail-sparse', async ({ page }) => {
        await page.goto(ANTOINE)
        await expect(
          page.getByRole('heading', { level: 1, name: /antoine herv/i }),
        ).toBeVisible()
        await setTheme(page, th)
        await shoot(page, `detail-sparse-${sfx}`)
      })

      test('autosuggest-open', async ({ page }) => {
        await page.goto('/musicians')
        await setTheme(page, th)
        const box = page.getByRole('combobox', {
          name: /search a musician/i,
        })
        await box.click()
        await box.pressSequentially('mile', { delay: 40 })
        await expect(page.getByRole('listbox')).toBeVisible()
        await expect(page.getByRole('option').first()).toBeVisible()
        await shoot(page, `autosuggest-${sfx}`)
      })

      test('sheet-open', async ({ page }) => {
        await page.goto(MILES)
        await expect(
          page.getByRole('heading', { level: 1, name: /miles davis/i }),
        ).toBeVisible()
        await setTheme(page, th)
        await page.getByRole('link', { name: /more about miles/i }).click()
        await expect(
          page.getByRole('dialog', { name: /more about miles/i }),
        ).toBeVisible()
        await shoot(page, `sheet-${sfx}`)
      })

      test('waking', async ({ page }) => {
        // dev-only preview route — no live equivalent.
        test.skip(IS_LIVE_BFF, 'waking is a localhost-dev preview route')
        await page.goto(WAKING)
        await expect(
          page.getByRole('heading', { level: 1, name: /waking up/i }),
        ).toBeVisible()
        await setTheme(page, th)
        await shoot(page, `waking-${sfx}`)
      })
    })
  }
}
