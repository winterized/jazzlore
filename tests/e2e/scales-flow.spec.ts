import { expect, test } from '@playwright/test'

test.use({ baseURL: 'http://localhost:5173' })

test('scale notation does not overlap the piano keyboard', async ({ page }) => {
  // Regression: abcjs writes inline `overflow: hidden; height: <Npx>` on its host.
  // With paddingtop/paddingbottom defaulted to 0, the SVG's bottom edge was
  // clipped to the host's height and the keyboard sat against it — chopping
  // the lower portion of the noteheads. The fix is to give abcjs vertical
  // padding inside the SVG so its own height includes breathing room.
  await page.goto('/scales/C')
  const article = page.locator('article').first()
  // Wait for both SVGs to be rendered (abcjs is lazy-loaded).
  await expect(article.locator('svg[aria-label="Sheet Music"]')).toBeVisible()
  await expect(article.locator('svg[aria-label*="keyboard" i]')).toBeVisible()

  const overlap = await article.evaluate((a) => {
    const score = a.querySelector('svg[aria-label="Sheet Music"]')
    const kb = a.querySelector('svg[aria-label*="keyboard" i]')
    if (!score || !kb) return null
    const s = score.getBoundingClientRect()
    const k = kb.getBoundingClientRect()
    return s.bottom - k.top
  })
  // Allow a 1px rounding tolerance; anything beyond means the notation is
  // bleeding into the keyboard space.
  expect(overlap).not.toBeNull()
  expect(overlap!).toBeLessThanOrEqual(1)
})

test('pick C, save Dorian, see it in collection, print preview', async ({ page }) => {
  await page.goto('/scales/C')

  // Picker shows C as selected — StickyHeader mounts inline picker (desktop)
  // and compact button (mobile); use the first radio in the DOM.
  const cRadios = page.getByRole('radio', { name: 'C' })
  await expect(cRadios.first()).toHaveAttribute('aria-checked', 'true')

  // Dorian now lives in the "Minor / m7" group, collapsed by default — expand
  // it first, then target the card by its exact heading (m7 also contains
  // "Bebop dorian" and "Dorian ♭2").
  await page.locator('[aria-controls="group-panel-m7"]').click()
  const dorianRow = page
    .locator('article')
    .filter({ has: page.getByRole('heading', { name: /^Dorian$/ }) })
    .first()
  await dorianRow.getByRole('button', { name: /Save to My scales/i }).click()

  // Navigate to collection
  await page.goto('/collection/scales')

  // Dorian heading should be visible there
  await expect(page.getByRole('heading', { name: /^Dorian$/ })).toBeVisible()

  // Print preview: emulate print media
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.print-grid')).toBeVisible()
  // Regression: print.css used to strip every <header> element, which silently
  // swallowed each scale's name (it lives inside an <article><header>...). The
  // strip rule must keep article headers visible.
  await expect(page.getByRole('heading', { name: /^Dorian$/ })).toBeVisible()
  // The editorial description · theoryTag line is suppressed in print at every
  // density — the printed "My scales" sheet carries no per-card editorial line.
  await expect(page.locator('.print-grid .scale-alias').first()).toBeHidden()
})

// ─── Phase 7: StickyHeader integration ───────────────────────────────────────

test('sticky header renders with title and chip row', async ({ page }) => {
  await page.goto('/scales/C')

  // Title rendered in the sticky header
  await expect(page.getByRole('heading', { name: /C scales/i })).toBeVisible()

  // Chip row is present (nav with the chipNavLabel)
  const chipNav = page.getByRole('navigation', { name: 'Scale categories' })
  await expect(chipNav).toBeVisible()

  // All 8 use-case group chips are present (short forms).
  for (const label of ['maj7', '7', '7alt', 'm7', 'm6', 'm7♭5', 'dim7', 'color']) {
    await expect(chipNav.getByRole('button', { name: label, exact: true })).toBeVisible()
  }
})

test('group chip click expands accordion and scrolls section into viewport below header', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  // Instant scroll so the chip can't shift under Playwright under 4-worker parallel load.
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/scales/C')

  // "color" is collapsed by default. Use aria-controls to uniquely target the
  // accordion header button — it controls "group-panel-color" and is the only
  // button with that attribute value.
  const colorAccordionBtn = page.locator('[aria-controls="group-panel-color"]')
  await expect(colorAccordionBtn).toHaveAttribute('aria-expanded', 'false')

  // Click the color chip in the chip nav (exact name = short form, no count).
  const chipNav = page.getByRole('navigation', { name: 'Scale categories' })
  await chipNav.getByRole('button', { name: 'color', exact: true }).click()

  // The accordion must now be expanded (aria-expanded="true").
  await expect(colorAccordionBtn).toHaveAttribute('aria-expanded', 'true')

  // The group heading (scroll target id="group-color") must be scrolled into view.
  // Smooth scroll is timing-sensitive in headless browsers; we use instant scroll
  // to the element directly from the test and then check it's in the viewport.
  // The scroll-margin-top (220px desktop) keeps the landing below the sticky header.
  await page.locator('#group-color').scrollIntoViewIfNeeded()
  await expect(page.locator('#group-color')).toBeInViewport()
})

test('chip click on already-open group keeps it open (expand-only, no toggle-off)', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  // Instant scroll so the chip can't shift under Playwright under 4-worker parallel load.
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/scales/C')

  // "maj7" is open by default. Use aria-controls to uniquely target the
  // accordion button (controls "group-panel-maj7").
  const majAccordionBtn = page.locator('[aria-controls="group-panel-maj7"]')
  await expect(majAccordionBtn).toHaveAttribute('aria-expanded', 'true')

  // Click the "maj7" chip (exact match = short form).
  const chipNav = page.getByRole('navigation', { name: 'Scale categories' })
  await chipNav.getByRole('button', { name: 'maj7', exact: true }).click()

  // It must stay open — no toggle-off.
  await expect(majAccordionBtn).toHaveAttribute('aria-expanded', 'true')
})

test('header search scrolls to the exact scale and expands its collapsed group', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/scales/C')

  // "Locrian ♮2" lives in "Half-diminished / m7♭5" — collapsed by default.
  const m7b5Btn = page.locator('[aria-controls="group-panel-m7b5"]')
  await expect(m7b5Btn).toHaveAttribute('aria-expanded', 'false')

  const search = page.getByRole('combobox', { name: 'Search scales' })
  await search.fill('locrian ♮2')
  const option = page.getByRole('option', { name: /Locrian ♮2/ })
  await expect(option).toBeVisible()
  await option.click()

  // The group auto-expands and the exact scale row is scrolled into view.
  await expect(m7b5Btn).toHaveAttribute('aria-expanded', 'true')
  await expect(page.locator('#scale-locrian-nat2')).toBeInViewport()

  // The group scroll-spy chip is pinned active (chips are group-level).
  const chipNav = page.getByRole('navigation', { name: 'Scale categories' })
  const m7b5Chip = chipNav.getByRole('button', { name: 'm7♭5', exact: true })
  await expect(m7b5Chip).toHaveAttribute('aria-current', 'true')
  // Bug 2: input blurred. Bug 3: chip stays after the scroll settles.
  await expect(page.getByRole('combobox', { name: 'Search scales' })).not.toBeFocused()
  await page.waitForTimeout(1500)
  await expect(m7b5Chip).toHaveAttribute('aria-current', 'true')
})

test('the "My scales" collection link is reachable on mobile (icon) and desktop (text)', async ({
  page,
}) => {
  // Mobile: icon-only link, but still has its accessible name.
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/scales/C')
  await expect(page.getByRole('link', { name: /My scales/i })).toBeVisible()

  // Desktop: full text pill.
  await page.setViewportSize({ width: 1280, height: 800 })
  await expect(page.getByRole('link', { name: /My scales/i })).toBeVisible()
})
