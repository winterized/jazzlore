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

test.describe('metronome — PWA manifest', () => {
  test('serves /manifest.webmanifest as JSON', async ({ request }) => {
    const res = await request.get(`${BASE}/manifest.webmanifest`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.name).toBe('Jazzlore Metronome')
    expect(body.short_name).toBe('Metronome')
    expect(body.display).toBe('standalone')
    expect(body.start_url).toBe('/')
    // 4 entries since the icon-set refresh split "any" + "maskable" purposes.
    expect(body.icons).toHaveLength(4)
    expect(body.icons[0].sizes).toBe('192x192')
    expect(body.icons[1].sizes).toBe('512x512')
  })

  test('serves the 192 + 512 icons as PNG', async ({ request }) => {
    const res192 = await request.get(`${BASE}/icons/icon-192.png`)
    expect(res192.status()).toBe(200)
    expect(res192.headers()['content-type']).toContain('image/png')

    const res512 = await request.get(`${BASE}/icons/icon-512.png`)
    expect(res512.status()).toBe(200)
    expect(res512.headers()['content-type']).toContain('image/png')
  })

  test('index.html links the manifest + Apple meta tags', async ({ page }) => {
    await page.goto(BASE)
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
      'href',
      '/manifest.webmanifest',
    )
    await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute(
      'content',
      'yes',
    )
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
      'href',
      '/icons/apple-touch-icon.png',
    )
  })
})

test.describe('metronome — engine wiring (no audio in headless)', () => {
  test('Start cycles status pill idle → priming → (engine may or may not run depending on audio support)', async ({
    page,
  }) => {
    // Audio in headless Chromium is silent by default but the engine state
    // transitions still fire. We assert the priming state appears; the
    // 'running' transition depends on whether the AudioContext could be
    // constructed at all (it should in Chromium).
    await gotoWithTheme(page, 'dark')
    const startBtn = page.getByRole('button', { name: 'Start metronome' })
    await expect(startBtn).toBeVisible()
    await startBtn.click()
    // Status pill should leave 'idle'.
    await expect(page.locator('.mt .hdr .status')).not.toHaveText('idle', { timeout: 1000 })
    // And the Start button should become Stop.
    await expect(page.getByRole('button', { name: 'Stop metronome' })).toBeVisible({
      timeout: 2000,
    })
    // Clicking Stop returns to idle.
    await page.getByRole('button', { name: 'Stop metronome' }).click()
    await expect(page.getByRole('button', { name: 'Start metronome' })).toBeVisible()
    await expect(page.locator('.mt .hdr .status')).toContainText('idle')
  })
})
