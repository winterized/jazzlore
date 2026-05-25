// Wave 2a — no-photo editorial figures · unattended live-prod verification.
//
// Runs against the deployed musicians worker via PREVIEW_BASE; skipped in
// local CI (the gate is the SAME-shaped env-var pattern as
// `musicians-joint-fix-acceptance.spec.ts`). Each test spawns a short-lived
// browser and tears it down — the long-lived Playwright MCP browser is not
// involved.
//
// Assertions (regression-safe):
//   1. A photo-rich detail page (Miles Davis) has at least one `.duo3-mark`
//      where the data marks sidemen photoless (figure replaced the
//      corner-initials fallback).
//   2. The home grid renders the figure on the lone photoless curated card
//      (today, Bobby Timmons) and renders an `<img>` on every photoed one.
//   3. A photoed musician's tile still uses `<img class="duo3-photo">`, never
//      a figure — the figure is the no-photo branch, nothing else.
//
// Screenshots (the deliverable you review):
//   Captured to `tests/e2e/screenshots/wave2a-no-photo/` at 390 + 1280
//   widths, BOTH themes. Filenames are deterministic so re-runs overwrite
//   the same artefacts. The screenshots are committed in a follow-up PR
//   once they exist on disk (first prod run creates them).
import { test, expect, type Page } from '@playwright/test'
import { promises as fs } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setMusiciansTheme } from './helpers/setTheme'

const PREVIEW_BASE = process.env['PREVIEW_BASE']
// Repo-root relative; screenshots committed alongside the spec.
const HERE = dirname(fileURLToPath(import.meta.url))
const SHOTS = join(HERE, 'screenshots', 'wave2a-no-photo')

const MILES = 'wikidata:Q93341'

test.describe('Wave 2a · no-photo figures · live prod', () => {
  test.skip(!PREVIEW_BASE, 'PREVIEW_BASE unset — skipping live-prod gate')
  test.beforeAll(async () => {
    await fs.mkdir(SHOTS, { recursive: true })
  })

  async function gotoMusician(page: Page, id: string): Promise<void> {
    await page.goto(`${PREVIEW_BASE}/musicians/${id}`)
    // Wait for either the no-photo mark or the rail to populate (graph
    // route is the LCP signal; SVG markers depend on the byIds enrichment
    // landing).
    await page.waitForSelector('[data-collab-id], .home-grid', {
      timeout: 30_000,
    })
  }

  // Theme flip uses the shared `helpers/setTheme.ts` to match the on-disk
  // shape of `@jazzlore/music-core`'s storage seam — see that file for the
  // background on why the inlined `'mu3-theme' → bare string` write (the
  // original here) was a silent no-op (issue #79).

  // ── Assertions ─────────────────────────────────────────────────────
  test('detail page surfaces no-photo figures on photoless sidemen (Miles Davis)', async ({
    page,
  }) => {
    await gotoMusician(page, MILES)
    // Wait for the byIds enrichment to settle — the no-photo collaborators
    // collapse to a figure only once the byIds map confirms photo=false.
    await page.waitForTimeout(1500)
    const markCount = await page.locator('.duo3-mark').count()
    expect(
      markCount,
      'at least one no-photo figure should render on a Miles Davis page (most sidemen are photoless)',
    ).toBeGreaterThan(0)
  })

  test('photo-present collaborators continue to render <img>, never a figure', async ({
    page,
  }) => {
    await gotoMusician(page, MILES)
    await page.waitForTimeout(1500)
    // Pick a row that has a duo3-photo <img>. Assert no sibling .duo3-mark.
    const photoed = page.locator(
      '.conn:has(img.duo3-photo), .mtile:has(img.duo3-photo)',
    )
    const n = await photoed.count()
    expect(n, 'at least one photoed collaborator should be present').toBeGreaterThan(
      0,
    )
    // For each photoed tile, assert no sibling figure overlay inside its
    // own duo3 — the figure is the no-photo branch, exclusive.
    for (let i = 0; i < n; i++) {
      const inner = photoed.nth(i).locator('.duo3-mark')
      expect(
        await inner.count(),
        'a photoed tile must not also render a figure',
      ).toBe(0)
    }
  })

  test('curated home grid renders a figure on the photoless card', async ({
    page,
  }) => {
    await page.goto(`${PREVIEW_BASE}/musicians`)
    await page.waitForSelector('.home-grid', { timeout: 30_000 })
    // At least one figure on the curated 12 (Bobby Timmons today).
    const figures = await page.locator('.home-card .duo3-mark').count()
    expect(figures).toBeGreaterThan(0)
    // The photoed curated cards still render <img class="duo3-photo">.
    const imgs = await page.locator('.home-card img.duo3-photo').count()
    expect(imgs).toBeGreaterThan(0)
  })

  // ── Screenshots ───────────────────────────────────────────────────
  // Each viewport × theme produces one file per scene. Failures here are
  // surface-area for review, not gates — the assertion tests above are the
  // regression guard.
  for (const viewport of [
    { name: 'mobile', width: 390, height: 844 },
    { name: 'desktop', width: 1280, height: 800 },
  ] as const) {
    for (const theme of ['dark', 'light'] as const) {
      test(`screenshot · home grid · ${viewport.name} · ${theme}`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        await page.goto(`${PREVIEW_BASE}/musicians`)
        await setMusiciansTheme(page, theme)
        await page.waitForSelector('.home-grid', { timeout: 30_000 })
        await page.waitForTimeout(800) // settle img decode / figure paint
        await page.screenshot({
          path: join(
            SHOTS,
            `home-${viewport.name}-${theme}.png`,
          ),
          fullPage: false,
        })
      })

      test(`screenshot · Miles detail · ${viewport.name} · ${theme}`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        await gotoMusician(page, MILES)
        await setMusiciansTheme(page, theme)
        await page.waitForTimeout(1500)
        await page.screenshot({
          path: join(SHOTS, `miles-${viewport.name}-${theme}.png`),
          fullPage: false,
        })
      })

      test(`screenshot · Miles era strip · ${viewport.name} · ${theme}`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        await gotoMusician(page, MILES)
        await setMusiciansTheme(page, theme)
        // Scroll the era strip into view (it lives below the rail).
        await page
          .locator('.era, [aria-label="From the same era"]')
          .first()
          .scrollIntoViewIfNeeded()
        await page.waitForTimeout(800)
        const region = page.locator('.era, [aria-label="From the same era"]').first()
        if (await region.count()) {
          await region.screenshot({
            path: join(SHOTS, `miles-era-${viewport.name}-${theme}.png`),
          })
        }
      })
    }
  }

  // ── Rest-figure cluster (unknown-instrument musicians) ─────────────
  // The cluster lives wherever many photoless+instrument-unknown peers
  // share a screen. Best candidates: a sparser sideman's detail page, or
  // the orbit of a less-mainstream musician. For the screenshot we pick a
  // musician with a sparser data profile; the spec records WHICH page
  // surfaces the cluster in its filename.
  test('rest-figure cluster screenshot', async ({ page }) => {
    // Bobby Timmons orbits include many less-documented sidemen.
    // wikidata:Q1148130 — Bobby Timmons (the curated photoless pianist).
    await page.setViewportSize({ width: 1280, height: 800 })
    await gotoMusician(page, 'wikidata:Q1148130')
    await page.waitForTimeout(2000)
    await page.screenshot({
      path: join(SHOTS, `rest-cluster-timmons-desktop-dark.png`),
      fullPage: false,
    })
  })
})
