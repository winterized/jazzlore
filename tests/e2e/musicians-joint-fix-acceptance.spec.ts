/**
 * Joint-fix acceptance harness (Phase 0 of the 2026-05-19 joint fix plan).
 *
 * This is the LIVE-BFF acceptance spec for the joint CRIT-1/CRIT-2/records-
 * dump structural fix (Group A) and the Era-strip data wiring (Group B). It
 * is intentionally separate from the localhost-mocked specs:
 *
 *   - musicians-a11y.spec.ts  → axe over mock-served or live-served data
 *   - musicians-baseline-capture.spec.ts → committed visual reference set
 *   - musicians-joint-fix-acceptance.spec.ts (THIS file) → predicates +
 *     screenshots that prove (a) the bug, before any fix lands, and
 *     (b) the fix worked, after each phase merges.
 *
 * It is LIVE-ONLY: PREVIEW_BASE env var is required (a fully-qualified
 * http(s) URL — a Cloudflare per-PR preview or musicians.jazzlore.com itself).
 * No mockBff. If PREVIEW_BASE is unset the suite no-ops with a single skip;
 * this keeps the file harmless in default CI runs while still being
 * available for joint-fix verification.
 *
 * Coverage: 5 viewports × 2 themes × 2 musicians (Miles 64-rec, Antoine 3-rec
 * — IDs verified live 2026-05-19 against /api/musicians/<id>). Screenshots
 * land under apps/musicians/docs/baseline/joint-fix/.
 *
 * Phase 0 ships THIS scaffolding plus the "broken-prod baseline" predicates
 * wrapped in test.fail() — Phase A/B fill in the post-fix predicates as
 * they implement.
 */

import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { expect, test, type Page } from '@playwright/test'

const PREVIEW_BASE = process.env.PREVIEW_BASE ?? ''
const ENABLED = PREVIEW_BASE.length > 0

const MILES_ID = 'wikidata:Q93341' // 64 records — the bug-triggering case
const ANTOINE_ID = 'wikidata:Q586360' // 3 records — the bug-avoiding case (live ID, NOT the test-fixture Q2856321)
const MILES = `/musicians/${MILES_ID}`
const ANTOINE = `/musicians/${ANTOINE_ID}`

const here = dirname(fileURLToPath(import.meta.url))
const OUT_ROOT = join(here, '..', '..', 'apps', 'musicians', 'docs', 'baseline', 'joint-fix')

const FREEZE = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    caret-color: transparent !important;
  }
`

type Viewport = { tag: string; w: number; h: number }
const VIEWPORTS: readonly Viewport[] = [
  { tag: 'm390', w: 390, h: 844 },
  { tag: 't768', w: 768, h: 1024 },
  { tag: 'd1024', w: 1024, h: 768 },
  { tag: 'd1280', w: 1280, h: 900 },
  { tag: 'd1536', w: 1536, h: 960 },
]
const THEMES = ['light', 'dark'] as const

test.use({ baseURL: PREVIEW_BASE || 'http://localhost:5175' })

function themeOf(page: Page): Promise<string | null> {
  return page.locator('html').getAttribute('data-theme')
}

async function setTheme(page: Page, want: 'light' | 'dark'): Promise<void> {
  if ((await themeOf(page)) === want) return
  const before = await themeOf(page)
  await page.getByRole('button', { name: 'Toggle theme' }).first().click()
  await expect.poll(() => themeOf(page)).not.toBe(before)
  await expect.poll(() => themeOf(page)).toBe(want)
}

async function shoot(page: Page, phase: string, name: string): Promise<void> {
  await page.addStyleTag({ content: FREEZE })
  await page.screenshot({ path: join(OUT_ROOT, phase, `${name}.png`), fullPage: true })
}

/**
 * Read computed-style and rect bounds we care about for the acceptance
 * predicates. Done in one `page.evaluate` to avoid serialization overhead
 * and to take a coherent snapshot (no scroll between reads).
 */
async function readLayoutSnapshot(page: Page) {
  return page.evaluate(() => {
    function rect(el: Element | null) {
      return el ? el.getBoundingClientRect() : null
    }
    const detail = document.querySelector('.mu3 .desk-detail')
    const rail = document.querySelector('.mu3 .desk-rail')
    const aside = document.querySelector('aside.desk-graph')
    const recStrip = document.querySelector('.rec-strip')
    const portrait = document.querySelector('img.duo3-photo')
    const eraStrip = document.querySelector('[aria-label="From the same era"]')
    return {
      viewport: { w: window.innerWidth, h: window.innerHeight },
      // Distinguishes "aside is mounted but selector changed" from "viewport
      // is below the 1024 desktop gate" — DetailView.tsx renders <aside
      // class="desk-graph"> conditionally on useIsDesktop().
      asideExpected: window.innerWidth >= 1024,
      pageScrollHeight: document.documentElement.scrollHeight,
      detail: detail
        ? {
            display: getComputedStyle(detail).display,
            gridTemplateColumns: getComputedStyle(detail).gridTemplateColumns,
            rect: rect(detail),
          }
        : null,
      rail: rail
        ? {
            minWidth: getComputedStyle(rail).minWidth,
            overflowX: getComputedStyle(rail).overflowX,
            rect: rect(rail),
          }
        : null,
      aside: aside
        ? {
            position: getComputedStyle(aside).position,
            height: getComputedStyle(aside).height,
            rect: rect(aside),
          }
        : null,
      recStrip: recStrip
        ? {
            scrollWidth: (recStrip as HTMLElement).scrollWidth,
            clientWidth: (recStrip as HTMLElement).clientWidth,
            childCount: recStrip.children.length,
          }
        : null,
      portrait: portrait
        ? {
            naturalWidth: (portrait as HTMLImageElement).naturalWidth,
            rect: rect(portrait),
          }
        : null,
      eraStripPresent: !!eraStrip,
    }
  })
}

test.describe('joint-fix acceptance — Phase 0 scaffolding', () => {
  test.skip(!ENABLED, 'PREVIEW_BASE not set — joint-fix acceptance suite is no-op')

  // Phase 0 captures the BROKEN-PROD BASELINE (screenshots + layout
  // snapshots attached as JSON). It does NOT run pass/fail predicates —
  // Streams A and B add those as they implement and the predicates flip
  // from "expected to fail" to "must pass". Keeping Phase 0 predicate-free
  // means this spec stays green against the broken prod URL today, and the
  // captured artifacts (PNGs under apps/musicians/docs/baseline/joint-fix/
  // and the per-test layout-snapshot JSON attachments in the Playwright
  // report) document the exact starting state that A/B improve from.
  //
  // The matrix loop (5 viewports × 2 themes × 2 musicians) is a grid of
  // describe blocks so individual cells can be re-run by `--grep`.
  for (const vp of VIEWPORTS) {
    for (const th of THEMES) {
      const sfx = `${vp.tag}-${th}`
      test.describe(`viewport ${sfx}`, () => {
        test.use({ viewport: { width: vp.w, height: vp.h } })

        test(`Miles · capture (${sfx})`, async ({ page }) => {
          await page.goto(MILES)
          await expect(
            page.getByRole('heading', { level: 1, name: /miles davis/i }),
          ).toBeVisible({ timeout: 15_000 })
          await setTheme(page, th)
          // On desktop viewports, the lazy d3-force graph mounts inside
          // <aside aria-label="Collaboration graph …">. Wait for the
          // GraphView's role=application to be visible — matches the
          // existing pattern in musicians-baseline-capture.spec.ts and is
          // event-driven (no fixed 5 s sleep that races slow runners).
          if (vp.w >= 1024) {
            await expect(
              page
                .getByRole('complementary', { name: /collaboration graph/i })
                .getByRole('application'),
            ).toBeVisible({ timeout: 30_000 })
          }
          await shoot(page, 'before', `miles-${sfx}`)
          const snap = await readLayoutSnapshot(page)
          test.info().attach(`miles-${sfx}-layout.json`, {
            body: JSON.stringify(snap, null, 2),
            contentType: 'application/json',
          })
        })

        test(`Antoine · capture (${sfx})`, async ({ page }) => {
          await page.goto(ANTOINE)
          await expect(
            page.getByRole('heading', { level: 1, name: /antoine herv/i }),
          ).toBeVisible({ timeout: 15_000 })
          await setTheme(page, th)
          await shoot(page, 'before', `antoine-${sfx}`)
          const snap = await readLayoutSnapshot(page)
          test.info().attach(`antoine-${sfx}-layout.json`, {
            body: JSON.stringify(snap, null, 2),
            contentType: 'application/json',
          })
        })
      })
    }
  }
})
