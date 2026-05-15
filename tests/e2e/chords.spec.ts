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

  // 3. Navigate to the collection via the header util link (now in StickyHeader).
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

  // Regression: v1 print.css clamped .chord-score to max-width:120px, and
  // abcjs renders at staffwidth 320 on an overflow:hidden host — so the
  // notation was clipped to an empty-looking sliver in print (worst in
  // compact, where the score is the only body content). Assert the abcjs
  // <svg> inside the card renders well past the old 120px clamp under print
  // emulation, proving the clamp removal took effect.
  // ~192px (the md:w-48 container) when fixed; ~120 (clipped) if the clamp
  // regressed. >150 cleanly separates the two without pinning an exact px.
  const scoreSvgWidth = await cmaj7Card
    .locator('.chord-score svg')
    .first()
    .evaluate((el) => el.getBoundingClientRect().width)
  expect(scoreSvgWidth).toBeGreaterThan(150)

  await page.emulateMedia({ media: 'screen' }) // reset
})

test('invalid root redirects to /chords/C', async ({ page }) => {
  await page.goto('/chords/zzz')
  await expect(page).toHaveURL(/\/chords\/C$/)
  await expect(page.getByRole('heading', { name: /C chords/i })).toBeVisible()
})

// Regression: v1 shipped without the Salamander samples in apps/chords/public,
// so chords.jazzlore.com 404'd every sample and Tone fell back to the synth.
// audioEngine loads from `/audio/piano/<pitch>.<ext>`; assert the chords origin
// actually serves them. Pitches mirror SAMPLE_PITCHES in audioEngine.ts.
test('Salamander piano samples are served by the chords origin', async ({ request }) => {
  for (const file of ['C4.mp3', 'C4.ogg', 'A5.mp3', 'C2.ogg', 'A6.mp3']) {
    const res = await request.get(`/audio/piano/${file}`)
    expect(res.status(), `/audio/piano/${file}`).toBe(200)
  }
})

// ─── Phase 6: StickyHeader + grouped sections ─────────────────────────────────

test('sticky header renders with title and chip row', async ({ page }) => {
  await page.goto('/chords/C')

  // Title rendered in the sticky header
  await expect(page.getByRole('heading', { name: 'C chords' })).toBeVisible()

  // Chip row is present (nav with the chipNavLabel)
  const chipNav = page.getByRole('navigation', { name: 'Chord categories' })
  await expect(chipNav).toBeVisible()

  // At least the first group chip is visible (e.g. "C" for C major triad)
  // The TRIADS group first chip label is "C" (C major = just the root)
  const cChip = chipNav.locator('button').first()
  await expect(cChip).toBeVisible()
})

test('body sections are rendered with category dividers', async ({ page }) => {
  await page.goto('/chords/C')

  // Each category section divider is rendered in the body
  for (const label of ['TRIADS', 'SIXTHS', 'SEVENTHS', 'NINTHS', 'EXTENDED', 'ALTERED']) {
    await expect(page.getByText(label, { exact: true }).first()).toBeVisible()
  }

  // All 27 chord rows are present
  const chordRows = page.locator('[data-testid="chord-row"]')
  await expect(chordRows).toHaveCount(27)
})

test('chip click scrolls to matching chord card below the header', async ({ page }) => {
  // Use a larger viewport to ensure desktop layout (inline root picker)
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/chords/C')

  // Click the "dim7" chip — it's in the SEVENTHS group
  // Its chip label is "Cdim7"
  const chipNav = page.getByRole('navigation', { name: 'Chord categories' })
  const dim7Chip = chipNav.locator('button', { hasText: 'Cdim7' })
  await dim7Chip.click()

  // The chord card with id="chord-dim7" should be visible in the viewport
  const dim7Card = page.locator('#chord-dim7')
  await expect(dim7Card).toBeVisible()
})

test('scroll-spy: after scrolling past all TRIADS the active chip changes', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/chords/C')

  // On page load the first chip (C major) should be active
  const chipNav = page.getByRole('navigation', { name: 'Chord categories' })
  const firstChip = chipNav.locator('button').first()
  await expect(firstChip).toHaveAttribute('aria-current', 'true')

  // Click the SEVENTHS group chip for maj7 to jump to that section (exact text match)
  const maj7Chip = page.locator('[data-chip-id="chord-maj7"]')
  await maj7Chip.click()

  // Give scroll-spy time to fire after scroll animation settles
  await page.waitForTimeout(600)

  // The scroll-spy should have updated — some chip should still have aria-current="true"
  const activeChip = chipNav.locator('button[aria-current="true"]')
  await expect(activeChip).toBeVisible()

  // The first chip (C major triad) should NO LONGER be aria-current after scrolling deep
  // into the SEVENTHS section (scroll-spy should have moved past it)
  await expect(firstChip).not.toHaveAttribute('aria-current', 'true')
})
