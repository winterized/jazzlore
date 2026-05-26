/**
 * Generate per-app PWA icons + favicons from the master SVGs.
 *
 * Source of truth: assets/icons/<surface>/{favicon-master.svg, pwa-master.svg}
 *
 * Per surface, writes:
 *   apps/<app>/public/favicon.svg                  (copy of favicon-master)
 *   apps/<app>/public/icons/icon-192.png           (PWA "any")
 *   apps/<app>/public/icons/icon-512.png           (PWA "any")
 *   apps/<app>/public/icons/icon-192-maskable.png  (PWA "maskable")
 *   apps/<app>/public/icons/icon-512-maskable.png  (PWA "maskable")
 *   apps/<app>/public/icons/apple-touch-icon.png   (180x180 for iOS)
 *
 * Idempotent — re-runs overwrite. Re-run when a master SVG changes.
 *
 * Run: pnpm icons
 */

import sharp from 'sharp'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')

const SURFACES = [
  { name: 'jazzlore', app: 'landing' },
  { name: 'scales', app: 'scales' },
  { name: 'chords', app: 'chords' },
  { name: 'metronome', app: 'metronome' },
  { name: 'musicians', app: 'musicians' },
]

async function svgToPng(svgBuf, size, outPath) {
  mkdirSync(dirname(outPath), { recursive: true })
  await sharp(svgBuf).resize(size, size).png().toFile(outPath)
}

async function main() {
  for (const { name, app } of SURFACES) {
    const faviconSvg = readFileSync(resolve(ROOT, `assets/icons/${name}/favicon-master.svg`))
    const pwaSvg = readFileSync(resolve(ROOT, `assets/icons/${name}/pwa-master.svg`))
    const out = resolve(ROOT, `apps/${app}/public`)

    // Browser favicon — copy SVG verbatim (modern browsers prefer SVG;
    // it scales crisp to any pixel density).
    mkdirSync(out, { recursive: true })
    writeFileSync(resolve(out, 'favicon.svg'), faviconSvg)

    // PWA icons — same source PNG declared with two purposes ("any" and
    // "maskable") in the manifest. The 80% safe zone is baked into the
    // pwa-master so the same render works for both. Splitting purpose
    // entries resolves Lighthouse's combined-purpose warning.
    await svgToPng(pwaSvg, 192, resolve(out, 'icons/icon-192.png'))
    await svgToPng(pwaSvg, 512, resolve(out, 'icons/icon-512.png'))
    await svgToPng(pwaSvg, 192, resolve(out, 'icons/icon-192-maskable.png'))
    await svgToPng(pwaSvg, 512, resolve(out, 'icons/icon-512-maskable.png'))

    // Apple touch icon — iOS Home Screen install picks this up.
    await svgToPng(pwaSvg, 180, resolve(out, 'icons/apple-touch-icon.png'))

    console.log(`Generated icons for ${name} → apps/${app}/public/`)
  }
}

await main()
