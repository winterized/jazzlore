// Issue #69 · autosuggest no-photo treatment — real-browser regression.
//
// Autosuggest rows render the editorial instrument figure (figKey/NoPhotoMark)
// in place of a monogram, with NO photo fetching (autosuggest is transient —
// per-result image requests aren't worth the free-tier cost). This spec drives
// the "art" query (Blakey / Shaw / Hodes / Tatum / Sandoval — same prefix, four
// instruments) and asserts, in a real browser, what jsdom can't see:
//   1. every row carries an instrument figure (`[data-no-photo-key]`);
//   2. the corner monogram is hidden at this density — guards the `.mu3`
//      scoping bug (the listbox portals to <body>, OUTSIDE `.mu3`, so the
//      figure CSS must NOT be `.mu3`-scoped or the monogram leaks).
// It also captures committed screenshots for the design record.
//
// Local run (test runner, not the MCP browser):
//   pnpm test:e2e musicians-issue-69-autosuggest --project=chromium
// Artefacts: tests/e2e/screenshots/issue-69-autosuggest/autosuggest-<theme>.png

import { test, expect } from '@playwright/test'
import { promises as fs } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mockBff } from './musicians-bff-mock'
import { setMusiciansTheme } from './helpers/setTheme'

const BASE = 'http://localhost:5175'
const HERE = dirname(fileURLToPath(import.meta.url))
const SHOTS = join(HERE, 'screenshots', 'issue-69-autosuggest')

// Photo-free corpus (no portrait fields — the whole point of #69 is to NOT
// fetch photos here). Same-prefix names, varied instruments. wikidata: ids so
// the ranker keeps corpus order (all tier-0 prefix matches, same priority).
const ART_CORPUS = [
  { id: 'wikidata:Q1001', name: 'Art Blakey', aka: [], primaryInstrument: 'drums' },
  { id: 'wikidata:Q1002', name: 'Artie Shaw', aka: [], primaryInstrument: 'clarinet' },
  { id: 'wikidata:Q1003', name: 'Art Hodes', aka: [], primaryInstrument: 'piano' },
  { id: 'wikidata:Q1004', name: 'Art Tatum', aka: [], primaryInstrument: 'piano' },
  {
    id: 'wikidata:Q1005',
    name: 'Arturo Sandoval',
    aka: [],
    primaryInstrument: 'trumpet',
  },
]

const THEMES = ['light', 'dark'] as const

test.use({
  baseURL: BASE,
  viewport: { width: 390, height: 844 },
  reducedMotion: 'reduce',
})

test.describe('issue #69 · autosuggest instrument figures', () => {
  test.beforeAll(async () => {
    await fs.mkdir(SHOTS, { recursive: true })
  })

  for (const theme of THEMES) {
    test(`autosuggest renders instrument figures (no leaked monogram) · ${theme}`, async ({
      page,
    }) => {
      await mockBff(page)
      // Override the search-index corpus with the "art" set. Registered after
      // mockBff so this more-specific route takes precedence.
      await page.route('**/api/musicians/search-index**', (route) =>
        route.fulfill({ json: { corpus: ART_CORPUS } }),
      )

      await page.goto('/musicians')
      const input = page.getByRole('combobox', { name: 'Search a musician' })
      await input.waitFor({ state: 'visible', timeout: 30_000 })
      await setMusiciansTheme(page, theme)

      await input.fill('art')

      const listbox = page.locator('.suggest-listbox')
      await expect(listbox).toBeVisible()
      await expect(page.locator('.suggest-row')).toHaveCount(ART_CORPUS.length)

      // 1. Every row carries an instrument figure (not a monogram square).
      await expect(page.locator('.suggest-row [data-no-photo-key]')).toHaveCount(
        ART_CORPUS.length,
      )
      await expect(
        page.locator('.suggest-row').first().locator('[data-no-photo-key]'),
      ).toHaveAttribute('data-no-photo-key', 'drums')

      // 2. The corner monogram is hidden at this density. This FAILS if the
      //    figure CSS is `.mu3`-scoped (the listbox portals outside `.mu3`).
      await expect(
        page.locator('.suggest-row .duo3-mark-ini').first(),
      ).toBeHidden()

      // Settle the staggered entrance (≤ 0.42s) before capturing.
      await page.waitForTimeout(500)
      await listbox.screenshot({
        path: join(SHOTS, `autosuggest-${theme}.png`),
      })
    })
  }
})
