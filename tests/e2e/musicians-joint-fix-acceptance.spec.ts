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
    const graphCircles = document.querySelectorAll('aside.desk-graph svg circle').length
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
            clientHeight: (aside as HTMLElement).clientHeight,
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
      graphCircleCount: graphCircles,
    }
  })
}

/**
 * Sum a CSS `grid-template-columns` string of resolved track widths into
 * total px. Computed style on a `display:grid` element returns the
 * resolved values like `"480px 800px"` or `"14624px"`; we just parse the
 * px numbers and sum. Returns 0 if no px tracks were found (e.g. the
 * grid hasn't been laid out yet, in which case the caller decides).
 */
function sumGridTrackPx(gridTemplateColumns: string): number {
  const m = gridTemplateColumns.match(/(\d+(?:\.\d+)?)px/g) ?? []
  return m.reduce((sum, t) => sum + parseFloat(t), 0)
}

/**
 * Stream A acceptance predicates (CRIT-1 + CRIT-2 + records-dump).
 *
 * Run against EVERY captured snapshot so the integration check at
 * post-merge prod has end-to-end coverage. Failures here are the joint
 * fix's reason to exist — they MUST pass once Stream A's CSS lands on
 * prod. Pre-fix on the current broken prod, the m390-Miles + d* aside
 * predicates fail (by design); that's the "before" baseline that proves
 * we measure the bug. Each predicate carries the diagnostic citation so
 * a future regression reads as "diagnostics/CRIT-{1,2} re-broken at
 * <file>:<line>", not as a mystery test failure.
 */
function assertStreamAPredicates(
  snap: Awaited<ReturnType<typeof readLayoutSnapshot>>,
  label: string,
): void {
  // A1.1 — grid track ≤ container × 1.1 (pre-fix Miles m390: 14 624 px;
  // post-fix: ~container width). The track inflation IS the bug. See
  // diagnostics/CRIT-1.
  if (snap.detail) {
    const trackPx = sumGridTrackPx(snap.detail.gridTemplateColumns)
    const containerPx = snap.detail.rect ? snap.detail.rect.width : snap.viewport.w
    expect.soft(
      trackPx,
      `${label} · A1.1 grid track sum=${trackPx}px must be ≤ container ${containerPx}px × 1.1 (cols=${snap.detail.gridTemplateColumns})`,
    ).toBeLessThanOrEqual(containerPx * 1.1)
  }

  // A1.2 — records strip itself still scrolls (it should NOT be visually
  // collapsed by `min-width: 0`; the user-facing horizontal scroll is the
  // designed overflow). Only assert when the strip exists (sparse Antoine
  // ships only a few records — strip may or may not exceed clientWidth).
  if (snap.recStrip && snap.recStrip.childCount > 4) {
    expect.soft(
      snap.recStrip.scrollWidth,
      `${label} · A1.2 .rec-strip.scrollWidth (${snap.recStrip.scrollWidth}) must exceed clientWidth (${snap.recStrip.clientWidth}) — strip should still horizontally scroll`,
    ).toBeGreaterThan(snap.recStrip.clientWidth)
  }

  // A1.3 — the hero portrait is contained to the container width × 1.05.
  // Pre-fix Miles m390 measured 14 596 px (the symptom of CRIT-1).
  if (snap.portrait?.rect) {
    const containerPx = snap.detail?.rect
      ? snap.detail.rect.width
      : snap.viewport.w
    expect.soft(
      snap.portrait.rect.width,
      `${label} · A1.3 img.duo3-photo width=${snap.portrait.rect.width}px must be ≤ container ${containerPx}px × 1.05`,
    ).toBeLessThanOrEqual(containerPx * 1.05)
  }

  // A2.1 — desktop graph panel is bounded to the viewport (post-fix:
  // ≈ window.innerHeight; pre-fix: ~2926 px for Miles d1280, tracking
  // the rail content height). Only meaningful when an aside is rendered.
  if (snap.asideExpected && snap.aside) {
    expect.soft(
      snap.aside.clientHeight,
      `${label} · A2.1 aside.desk-graph clientHeight=${snap.aside.clientHeight}px must be ≤ viewport height ${snap.viewport.h}px × 1.01`,
    ).toBeLessThanOrEqual(snap.viewport.h * 1.01)
    // A2.2 — position MUST be sticky on desktop (the CSS gate that
    // makes A2.1's bounded height actually pinned, not just short).
    expect.soft(
      snap.aside.position,
      `${label} · A2.2 aside.desk-graph computed position=${snap.aside.position} must be "sticky"`,
    ).toBe('sticky')
  }
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
          // Miles is the bug-triggering case (64+ records). All Stream A
          // predicates apply here.
          assertStreamAPredicates(snap, `Miles ${sfx}`)
          // A1.4 — total scroll height is sane at m390 for Miles only
          // (the runaway-grid symptom inflated the whole page to tens of
          // thousands of px). Antoine never blew the grid, so this is
          // Miles-only by design.
          if (vp.tag === 'm390') {
            expect.soft(
              snap.pageScrollHeight,
              `Miles ${sfx} · A1.4 documentElement.scrollHeight=${snap.pageScrollHeight}px must be < 8000 (pre-fix: tens of thousands)`,
            ).toBeLessThan(8000)
          }
          // A2.3 — graph SVG rendered (lazy chunk loaded and drew the
          // force layout). circle count ≥ 100 is the regression guard
          // that prevents A2 stripping the graph along with its height.
          // Desktop only — sub-1024 viewports don't render <aside>.
          if (snap.asideExpected) {
            expect.soft(
              snap.graphCircleCount,
              `Miles ${sfx} · A2.3 graph <circle> count=${snap.graphCircleCount} must be ≥ 100 (lazy chunk loaded)`,
            ).toBeGreaterThanOrEqual(100)
            // A2.4 — sticky behavior: scroll the page 800 px and verify
            // the aside stays pinned (`top ≤ 1`). Without the sticky
            // binding, scrolling drags the panel off the viewport.
            await page.evaluate(() => window.scrollTo(0, 800))
            const stickyTop = await page.evaluate(() => {
              const a = document.querySelector('aside.desk-graph')
              return a ? a.getBoundingClientRect().top : null
            })
            if (stickyTop !== null) {
              expect.soft(
                stickyTop,
                `Miles ${sfx} · A2.4 after scrolling 800px, aside.desk-graph.top=${stickyTop} must be ≤ 1 (pinned)`,
              ).toBeLessThanOrEqual(1)
            }
            await page.evaluate(() => window.scrollTo(0, 0))
          }
        })

        test(`Antoine · capture (${sfx})`, async ({ page }) => {
          await page.goto(ANTOINE)
          await expect(
            page.getByRole('heading', { level: 1, name: /antoine herv/i }),
          ).toBeVisible({ timeout: 15_000 })
          await setTheme(page, th)
          if (vp.w >= 1024) {
            await expect(
              page
                .getByRole('complementary', { name: /collaboration graph/i })
                .getByRole('application'),
            ).toBeVisible({ timeout: 30_000 })
          }
          await shoot(page, 'before', `antoine-${sfx}`)
          const snap = await readLayoutSnapshot(page)
          test.info().attach(`antoine-${sfx}-layout.json`, {
            body: JSON.stringify(snap, null, 2),
            contentType: 'application/json',
          })
          // Antoine is the sparse / bug-avoiding case. The same
          // predicates serve as a regression guard — they were already
          // passing on broken prod for Antoine (3 records, no nowrap
          // blowout) and MUST keep passing post-fix.
          assertStreamAPredicates(snap, `Antoine ${sfx}`)
        })
      })
    }
  }
})
