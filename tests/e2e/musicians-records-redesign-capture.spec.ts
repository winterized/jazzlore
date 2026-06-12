// Musicians — Records-project visual gate (P5 card redesign + P6 ordering).
//
// Captures the redesigned "Records they shaped" strip — cover art as the
// primary visual, Apple-first dual listen icons, typographic-sleeve fallback —
// at mobile (390) and desktop (1280) widths, light + dark, against REAL Aura
// data (covers, ordering, Apple album URLs) dumped by
// `scripts/dump-records-fixture.ts` to /tmp/records-fixtures/. Chromium-only
// screenshot deliverable; SKIPS when the fixtures are absent (so it never runs
// in CI without the dump step). Output: test-results/records-redesign/*.png.
//
// Cover <img>s point at the real Cover Art Archive CDN — a 404/block degrades
// to the typographic fallback in-app, so the shot is always meaningful.

import { test, expect, type Page } from '@playwright/test'
import { readFileSync, existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join } from 'node:path'

const PREVIEW_BASE = 'http://localhost:5185'
const __dirname = dirname(fileURLToPath(import.meta.url))
// Ephemeral output dir (gate screenshots are reviewed then discarded — not
// committed). NOTE: Playwright clears test-results/ at the START of every run,
// so re-run THIS spec last / in isolation if you need the shots to persist.
const OUT = resolve(__dirname, '../../test-results/records-redesign')
const FIX = '/tmp/records-fixtures'

const SUBJECTS = [
  { id: 'wikidata:Q93341', file: 'wikidata_Q93341.json', tag: 'miles' },
  { id: 'wikidata:Q7346', file: 'wikidata_Q7346.json', tag: 'coltrane' },
  { id: 'wikidata:Q208205', file: 'wikidata_Q208205.json', tag: 'evans' },
  // Alternating covers blanked → exercises the typographic-sleeve fallback (D5)
  // beside real covers (the "mixed strip" P7 gate case). Same id as Miles.
  { id: 'wikidata:Q93341', file: 'mixed.json', tag: 'mixed' },
] as const

const VIEWPORTS = [
  { tag: 'mobile-390', w: 390, h: 844 },
  { tag: 'desktop-1280', w: 1280, h: 900 },
] as const
const THEMES = ['light', 'dark'] as const

function themeOf(page: Page): Promise<string | null> {
  return page.locator('html').getAttribute('data-theme')
}
async function setTheme(page: Page, want: 'light' | 'dark'): Promise<void> {
  if ((await themeOf(page)) !== want) {
    await page.getByRole('button', { name: 'Toggle theme' }).click()
    await expect.poll(() => themeOf(page)).toBe(want)
  }
}

test.describe('musicians records-redesign visual gate (P5/P6)', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'screenshot deliverable — chromium only',
  )
  test.skip(
    !existsSync(join(FIX, SUBJECTS[0].file)),
    'run scripts/dump-records-fixture.ts first (writes /tmp/records-fixtures)',
  )

  for (const subj of SUBJECTS) {
    test(`capture ${subj.tag} records strip — both widths, both themes`, async ({
      page,
    }) => {
      mkdirSync(OUT, { recursive: true })
      const fixturePath = join(FIX, subj.file)
      test.skip(!existsSync(fixturePath), `no fixture for ${subj.tag}`)
      const detail = JSON.parse(readFileSync(fixturePath, 'utf8'))
      const encId = encodeURIComponent(subj.id)

      await page.route('**/api/musicians/**', async (route) => {
        const path = new URL(route.request().url()).pathname
        if (path === `/api/musicians/${encId}`) {
          return route.fulfill({
            contentType: 'application/json',
            body: JSON.stringify(detail),
          })
        }
        return route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            items: [],
            corpus: [],
            curated: [],
            graph: { nodes: [], edges: [] },
          }),
        })
      })

      for (const vp of VIEWPORTS) {
        await page.setViewportSize({ width: vp.w, height: vp.h })
        for (const th of THEMES) {
          await page.goto(`${PREVIEW_BASE}/musicians/${encId}`)
          await expect(page.getByText(detail.name).first()).toBeVisible()
          await setTheme(page, th)
          const strip = page.locator('.rec-strip')
          await strip.scrollIntoViewIfNeeded()
          await expect(strip.locator('.rec-tile').first()).toBeVisible()
          // Let covers settle (real CAA fetch); failures fall back in-app.
          await page.waitForLoadState('networkidle').catch(() => {})
          await page.waitForTimeout(900)
          // Section crop (header + first row of tiles) at viewport width.
          const box = await strip.boundingBox()
          if (box) {
            await page.screenshot({
              path: join(OUT, `${subj.tag}-${vp.tag}-${th}.png`),
              clip: {
                x: 0,
                y: Math.max(0, box.y - 36),
                width: vp.w,
                height: Math.min(vp.h - Math.max(0, box.y - 36), box.height + 48),
              },
            })
          }
        }
      }
    })
  }
})
