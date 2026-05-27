// Issue #105 A/B screenshot composite generator.
//
// Reads /tmp/jazzlore-105/<grid|footer>-<device>.png and emits:
//   • composite-grid.png   — 5 device shots for Option 3, side-by-side,
//                            with device + viewport labels.
//   • composite-footer.png — same for Option 4.
//   • comparison-<device>.png × 5 — per-device A/B (grid on left,
//                            footer on right), with option labels.
//
// Uses `sharp` from the workspace root devDependencies. No bundling —
// it's a one-shot Node script.

import sharp from 'sharp'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const DIR = process.env.SCREENSHOT_DIR ?? '/tmp/jazzlore-105'
const DEVICES = [
  { name: 'iphone-se',         label: 'iPhone SE',         viewport: '375×667'  },
  { name: 'iphone-13-mini',    label: 'iPhone 13 mini',    viewport: '375×812'  },
  { name: 'iphone-15',         label: 'iPhone 15',         viewport: '393×852'  },
  { name: 'iphone-15-pro-max', label: 'iPhone 15 Pro Max', viewport: '430×932'  },
  { name: 'android-pixel-5',   label: 'Android Pixel 5',   viewport: '393×851'  },
]
const OPTIONS = [
  { key: 'grid',   label: 'Option 3 — Grid (100dvh)' },
  { key: 'footer', label: 'Option 4 — Sticky Footer' },
]

const LABEL_H = 60            // header strip height per screenshot
const PAD = 16                // gap between shots
const BG = { r: 24, g: 24, b: 28, alpha: 1 }
const FG = '#ffffff'
const SUB = '#a3a3ad'

if (!existsSync(DIR)) {
  console.error(`Screenshot dir not found: ${DIR}`)
  process.exit(1)
}
mkdirSync(DIR, { recursive: true })

const labelSvg = (text, sub, width) => Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${LABEL_H}">
    <rect width="100%" height="100%" fill="rgb(24,24,28)"/>
    <text x="50%" y="26" text-anchor="middle"
          font-family="-apple-system, system-ui, sans-serif"
          font-size="18" font-weight="600" fill="${FG}">${text}</text>
    <text x="50%" y="46" text-anchor="middle"
          font-family="-apple-system, system-ui, sans-serif"
          font-size="12" font-weight="400" fill="${SUB}">${sub}</text>
  </svg>
`)

async function loadShot(option, deviceName) {
  const path = join(DIR, `${option}-${deviceName}.png`)
  if (!existsSync(path)) {
    console.warn(`  ⚠ missing: ${path}`)
    return null
  }
  const buf = readFileSync(path)
  const meta = await sharp(buf).metadata()
  return { buf, width: meta.width ?? 0, height: meta.height ?? 0 }
}

async function captionedShot(shot, title, subtitle) {
  if (!shot) return null
  const label = await sharp(labelSvg(title, subtitle, shot.width)).png().toBuffer()
  const total = LABEL_H + shot.height
  return sharp({
    create: { width: shot.width, height: total, channels: 4, background: BG },
  })
    .composite([
      { input: label, top: 0, left: 0 },
      { input: shot.buf, top: LABEL_H, left: 0 },
    ])
    .png()
    .toBuffer()
}

async function horizontalStrip(buffers) {
  const metas = await Promise.all(buffers.map((b) => sharp(b).metadata()))
  const heights = metas.map((m) => m.height ?? 0)
  const widths = metas.map((m) => m.width ?? 0)
  const maxH = Math.max(...heights)
  const totalW = widths.reduce((a, w) => a + w, 0) + PAD * (buffers.length + 1)
  const composites = []
  let x = PAD
  for (let i = 0; i < buffers.length; i++) {
    composites.push({ input: buffers[i], top: PAD, left: x })
    x += widths[i] + PAD
  }
  return sharp({
    create: {
      width: totalW,
      height: maxH + PAD * 2,
      channels: 4,
      background: BG,
    },
  })
    .composite(composites)
    .png()
    .toBuffer()
}

async function buildOptionStrip(option) {
  const captioned = []
  for (const d of DEVICES) {
    const shot = await loadShot(option.key, d.name)
    const cap = await captionedShot(shot, d.label, d.viewport)
    if (cap) captioned.push(cap)
  }
  if (captioned.length === 0) {
    console.warn(`  → no screenshots for ${option.key}; skipping strip`)
    return
  }
  const strip = await horizontalStrip(captioned)
  // Add a top banner with the option label
  const meta = await sharp(strip).metadata()
  const bannerH = 50
  const banner = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${meta.width}" height="${bannerH}">
      <rect width="100%" height="100%" fill="rgb(244,162,51)"/>
      <text x="50%" y="32" text-anchor="middle"
            font-family="-apple-system, system-ui, sans-serif"
            font-size="22" font-weight="700" fill="rgb(26,20,16)">${option.label}</text>
    </svg>
  `)
  const out = await sharp({
    create: {
      width: meta.width ?? 0,
      height: (meta.height ?? 0) + bannerH,
      channels: 4,
      background: BG,
    },
  })
    .composite([
      { input: banner, top: 0, left: 0 },
      { input: strip, top: bannerH, left: 0 },
    ])
    .png()
    .toBuffer()
  const path = join(DIR, `composite-${option.key}.png`)
  await sharp(out).toFile(path)
  console.log(`  ✓ ${path}`)
}

async function buildPerDeviceComparison(device) {
  const captioned = []
  for (const o of OPTIONS) {
    const shot = await loadShot(o.key, device.name)
    const cap = await captionedShot(shot, o.label, `${device.label} · ${device.viewport}`)
    if (cap) captioned.push(cap)
  }
  if (captioned.length < 2) {
    console.warn(`  → ${device.name}: missing one or both options; skipping`)
    return
  }
  const strip = await horizontalStrip(captioned)
  const path = join(DIR, `comparison-${device.name}.png`)
  await sharp(strip).toFile(path)
  console.log(`  ✓ ${path}`)
}

console.log(`Reading screenshots from ${DIR} …`)
console.log('\nPer-option strips:')
for (const o of OPTIONS) await buildOptionStrip(o)
console.log('\nPer-device A/B comparisons:')
for (const d of DEVICES) await buildPerDeviceComparison(d)
console.log('\nDone.')
