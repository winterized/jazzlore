import { expect, test } from '@playwright/test'

test.use({ baseURL: 'http://localhost:5173' })

// Guards the user's requirement for the chord-quality regrouping: every scale
// card's `description · theoryTag` line must fit on one or two lines at the
// 390×844 mobile viewport — no truncation, overflow, or crowding of the
// play/favorite buttons. If an editorial edit makes a line too long, this fails
// and names the offending scale (fix the copy, not the CSS).
test('every scale description line fits in ≤2 lines at 390px with no overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/scales/C')

  // Expand every collapsed group so all 38 cards render.
  for (const btn of await page.locator('[aria-controls^="group-panel-"]').all()) {
    if ((await btn.getAttribute('aria-expanded')) === 'false') await btn.click()
  }

  const cards = page.locator('article.scale-row')
  await expect(cards).toHaveCount(38)

  const offenders = await page.locator('article.scale-row').evaluateAll((articles) =>
    articles.flatMap((a) => {
      const name = a.querySelector('h3')?.textContent ?? '(unknown)'
      const line = a.querySelector('.scale-alias') as HTMLElement | null
      if (!line) return [{ name, reason: 'no description line' }]
      const lh = parseFloat(getComputedStyle(line).lineHeight)
      const lines = Number.isFinite(lh) ? Math.round(line.getBoundingClientRect().height / lh) : 0
      const problems: { name: string; reason: string }[] = []
      if (lines > 2) problems.push({ name, reason: `${lines} lines` })
      // Horizontal overflow: text wider than its container.
      if (line.scrollWidth > line.clientWidth + 1) {
        problems.push({ name, reason: `overflow ${line.scrollWidth}>${line.clientWidth}` })
      }
      // Layout invariant: the description is a full-width row BELOW the
      // name/buttons header — it must start at or below the buttons' bottom
      // edge, never creep back up beside them (which would crowd the buttons).
      const header = a.querySelector('header')
      const buttons = header?.querySelector(':scope > div:last-child') as HTMLElement | null
      if (buttons) {
        const l = line.getBoundingClientRect()
        const b = buttons.getBoundingClientRect()
        if (l.top < b.bottom - 1) problems.push({ name, reason: 'crowds buttons row' })
      }
      return problems
    }),
  )

  expect(offenders, JSON.stringify(offenders, null, 2)).toEqual([])
})
