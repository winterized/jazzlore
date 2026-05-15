import { expect, test } from '@playwright/test'

test.use({ baseURL: 'http://localhost:5174' })

test('pick C, save Cmaj7, see it in collection, print preview renders', async ({ page }) => {
  // 1. Visit /chords/C
  await page.goto('/chords/C')
  await expect(page.getByRole('heading', { name: /C chords/i })).toBeVisible()

  // 2. Find the Cmaj7 star (save) button.
  //    aria-label is "Save Cmaj7 to my collection" when not yet saved.
  const saveBtn = page.getByRole('button', { name: /Save Cmaj7 to my collection/i })
  await saveBtn.click()
  //    After saving, the label flips to "Remove Cmaj7 from my collection".
  await expect(
    page.getByRole('button', { name: /Remove Cmaj7 from my collection/i }),
  ).toBeVisible()

  // 3. Navigate to the collection via the header link.
  await page.getByRole('link', { name: /My chord collection/i }).click()
  await expect(page).toHaveURL(/\/collection\/chords/)

  // 4. Assert Cmaj7 is listed — look for the chord row article.
  //    The collection renders ChordRow entries; each row is an <article data-testid="chord-row">.
  //    Scope the text match to an article to avoid matching the page header.
  const cmaj7Card = page.locator('[data-testid="chord-row"]', { hasText: 'Cmaj7' })
  await expect(cmaj7Card).toBeVisible()

  // 5. Print preview: emulate @media print and verify the @media print rules
  //    actually take effect. toBeVisible() alone is tautological here — the
  //    .print-grid <ul> is visible in screen mode too. Assert the computed
  //    `display` flips to `grid` (only print.css sets that) so a broken
  //    @media print block (e.g. accidental display:none) would fail loudly.
  await page.emulateMedia({ media: 'print' })
  const gridDisplay = await page
    .locator('.print-grid')
    .evaluate((el) => getComputedStyle(el).display)
  expect(gridDisplay).toBe('grid')
  await expect(cmaj7Card).toBeVisible()
  await page.emulateMedia({ media: 'screen' }) // reset
})

test('invalid root redirects to /chords/C', async ({ page }) => {
  await page.goto('/chords/zzz')
  await expect(page).toHaveURL(/\/chords\/C$/)
  await expect(page.getByRole('heading', { name: /C chords/i })).toBeVisible()
})
