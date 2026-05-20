import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const BASE = 'http://localhost:5176'

/** Idle BPM is 120 (v1 default). The Italian-tempo mapping puts 120 in the
 *  Allegro band per the design handoff README table — visible as italic
 *  amber Newsreader text after the "BPM" label. */
const DEFAULT_BPM = '120'
const DEFAULT_LABEL = 'Allegro'

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1280, height: 800 },
] as const

const THEMES = ['light', 'dark'] as const

/** Hydrate the theme override BEFORE navigation so the first paint matches
 *  the requested theme. Goes through the same storage key the
 *  @jazzlore/music-core theme module uses ('jazzlore:theme:v1'). */
async function gotoWithTheme(page: Page, theme: 'light' | 'dark') {
  await page.addInitScript((t) => {
    window.localStorage.setItem('jazzlore:theme:v1', JSON.stringify(t))
  }, theme)
  await page.goto(BASE)
}

test.describe('metronome — idle render', () => {
  for (const vp of VIEWPORTS) {
    for (const theme of THEMES) {
      test(`renders default state at ${vp.name} ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height })
        await gotoWithTheme(page, theme)

        await expect(page).toHaveTitle('Jazzlore — Metronome')

        // BPM hero shows 120
        const bpmNum = page.locator('.mt .bpm-num').first()
        await expect(bpmNum).toContainText(DEFAULT_BPM)

        // Italian-tempo label "Allegro" for 120 BPM
        await expect(page.locator('.mt .bpm-hero .lab b')).toContainText(DEFAULT_LABEL)

        // Status pill says "idle"
        await expect(page.locator('.mt .hdr .status')).toContainText('idle')

        // Start button label
        await expect(page.getByRole('button', { name: 'Start metronome' })).toBeVisible()

        // Theme actually applied
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
      })
    }
  }
})

test.describe('metronome — keyboard shortcuts', () => {
  test('space toggles Start → Stop', async ({ page }) => {
    await gotoWithTheme(page, 'dark')
    const startBtn = page.getByRole('button', { name: 'Start metronome' })
    await expect(startBtn).toBeVisible()
    await page.keyboard.press('Space')
    // After priming (400 ms) → running; the button's accessible name flips
    // to "Stop metronome".
    await expect(page.getByRole('button', { name: 'Stop metronome' })).toBeVisible({
      timeout: 2000,
    })
    await page.keyboard.press('Space')
    await expect(page.getByRole('button', { name: 'Start metronome' })).toBeVisible()
  })

  test('arrow keys nudge BPM ±1', async ({ page }) => {
    await gotoWithTheme(page, 'dark')
    // Focus body so the keyboard listener fires (default focus is body)
    await page.locator('body').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('.mt .bpm-num').first()).toContainText('121')
    await page.keyboard.press('ArrowLeft')
    await expect(page.locator('.mt .bpm-num').first()).toContainText('120')
  })

  test('shift+arrow nudges ±10', async ({ page }) => {
    await gotoWithTheme(page, 'dark')
    await page.locator('body').focus()
    await page.keyboard.press('Shift+ArrowRight')
    await expect(page.locator('.mt .bpm-num').first()).toContainText('130')
  })

  test('[ and ] jump to classic tempos', async ({ page }) => {
    await gotoWithTheme(page, 'dark')
    await page.locator('body').focus()
    await page.keyboard.press(']')
    // 120 → next classic = 144
    await expect(page.locator('.mt .bpm-num').first()).toContainText('144')
    await page.keyboard.press('[')
    await expect(page.locator('.mt .bpm-num').first()).toContainText('120')
  })

  test('digit keys 2..7 set beats per bar', async ({ page }) => {
    await gotoWithTheme(page, 'dark')
    await page.locator('body').focus()
    await page.keyboard.press('6')
    // The 'on' beats button becomes 6
    await expect(page.locator('.mt .meter button.on')).toHaveText('6')
  })
})

test.describe('metronome — accessibility (axe-core)', () => {
  for (const vp of VIEWPORTS) {
    for (const theme of THEMES) {
      test(`zero violations at ${vp.name} ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height })
        await gotoWithTheme(page, theme)

        // Wait for the main UI to be present
        await expect(page.locator('.mt .bpm-num').first()).toBeVisible()

        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze()

        expect(
          results.violations,
          `axe found violations at ${vp.name} ${theme}:\n${JSON.stringify(
            results.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })),
            null,
            2,
          )}`,
        ).toEqual([])
      })
    }
  }
})
