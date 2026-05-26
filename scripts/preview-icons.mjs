/**
 * Phase A preview compositor for the Jazzlore icon set.
 *
 * Renders all 10 master SVGs (5 surfaces × {favicon, pwa}) into a single
 * composite PNG so the user can sign off on:
 *   - color mapping (5 dot colors mutually distinguishable at 16/32px)
 *   - dot+motif composition (motifs legible at 192px, dot stays focal)
 *
 * Layout (per row): label + favicon at 32px + favicon at 64px (zoom) +
 *   pwa at 192px + pwa at 192px with 80% mask overlay (Android squircle).
 *
 * Run: node scripts/preview-icons.mjs
 * Output: tmp/icon-preview.png
 */

import sharp from 'sharp'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const OUT_DIR = resolve(ROOT, 'tmp')
const OUT_FILE = resolve(OUT_DIR, 'icon-preview.png')

const SURFACES = [
  { name: 'jazzlore', label: 'Jazzlore', color: '#f4a233' },
  { name: 'scales', label: 'Scales', color: '#6f8caa' },
  { name: 'chords', label: 'Chords', color: '#8a72a8' },
  { name: 'metronome', label: 'Metronome', color: '#a06b6b' },
  { name: 'musicians', label: 'Musicians', color: '#6a9075' },
]

const ROW_H = 220
const PAD = 24
const LABEL_W = 160
const COL_GAP = 32
const HEADER_H = 70

// Column widths
const COL_FAV32 = 32
const COL_FAV64 = 64
const COL_PWA = 192
const COL_PWA_MASK = 192

const CANVAS_W = PAD + LABEL_W + COL_GAP + COL_FAV32 + COL_GAP + COL_FAV64 + COL_GAP + COL_PWA + COL_GAP + COL_PWA_MASK + PAD
const CANVAS_H = HEADER_H + SURFACES.length * ROW_H + PAD

async function svgToPng(svgPath, size) {
  const svg = readFileSync(svgPath)
  return sharp(svg).resize(size, size).png().toBuffer()
}

/**
 * Apply a circular mask to the PNG buffer at 80% diameter (simulates the
 * Android Material You / iOS standalone mask). The masked region stays
 * visible, content outside is cut to a transparent black surround.
 */
async function applyCircleMask(pngBuf, size) {
  const r = Math.floor(size * 0.4) // 80% diameter / 2
  const cx = size / 2
  const cy = size / 2
  const maskSvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
       <circle cx="${cx}" cy="${cy}" r="${r}" fill="white"/>
     </svg>`,
  )
  return sharp(pngBuf)
    .composite([{ input: maskSvg, blend: 'dest-in' }])
    .png()
    .toBuffer()
}

function headerSvg() {
  const labelX = PAD + LABEL_W / 2
  const fav32X = PAD + LABEL_W + COL_GAP + COL_FAV32 / 2
  const fav64X = PAD + LABEL_W + COL_GAP + COL_FAV32 + COL_GAP + COL_FAV64 / 2
  const pwaX = PAD + LABEL_W + COL_GAP + COL_FAV32 + COL_GAP + COL_FAV64 + COL_GAP + COL_PWA / 2
  const maskX = PAD + LABEL_W + COL_GAP + COL_FAV32 + COL_GAP + COL_FAV64 + COL_GAP + COL_PWA + COL_GAP + COL_PWA_MASK / 2
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_W}" height="${HEADER_H}">
      <rect width="${CANVAS_W}" height="${HEADER_H}" fill="#0a0a0a"/>
      <text x="${labelX}" y="44" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="#d6d6d6" text-anchor="middle" font-weight="600">Jazzlore icon set — preview</text>
      <text x="${fav32X}" y="44" font-family="system-ui, sans-serif" font-size="11" fill="#9a9a9a" text-anchor="middle">fav 32</text>
      <text x="${fav64X}" y="44" font-family="system-ui, sans-serif" font-size="11" fill="#9a9a9a" text-anchor="middle">fav 64</text>
      <text x="${pwaX}" y="44" font-family="system-ui, sans-serif" font-size="11" fill="#9a9a9a" text-anchor="middle">pwa 192</text>
      <text x="${maskX}" y="44" font-family="system-ui, sans-serif" font-size="11" fill="#9a9a9a" text-anchor="middle">pwa 192 (circle masked)</text>
    </svg>
  `
}

function rowLabelSvg(label, color) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${LABEL_W}" height="${ROW_H}">
      <rect width="${LABEL_W}" height="${ROW_H}" fill="#0a0a0a"/>
      <text x="20" y="${ROW_H / 2 - 6}" font-family="system-ui, -apple-system, sans-serif" font-size="18" fill="#e4e4e4" font-weight="600">${label}</text>
      <text x="20" y="${ROW_H / 2 + 18}" font-family="ui-monospace, monospace" font-size="13" fill="${color}">${color}</text>
    </svg>
  `
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })

  // Canvas — dark slate background to match app dark theme
  const canvas = sharp({
    create: {
      width: CANVAS_W,
      height: CANVAS_H,
      channels: 4,
      background: { r: 10, g: 10, b: 10, alpha: 1 },
    },
  })

  const composites = []

  // Header
  composites.push({
    input: Buffer.from(headerSvg()),
    top: 0,
    left: 0,
  })

  for (let i = 0; i < SURFACES.length; i++) {
    const { name, label, color } = SURFACES[i]
    const rowTop = HEADER_H + i * ROW_H

    // Label column
    composites.push({
      input: Buffer.from(rowLabelSvg(label, color)),
      top: rowTop,
      left: 0,
    })

    const favPath = resolve(ROOT, `assets/icons/${name}/favicon-master.svg`)
    const pwaPath = resolve(ROOT, `assets/icons/${name}/pwa-master.svg`)

    // favicon 32
    let x = PAD + LABEL_W + COL_GAP
    composites.push({
      input: await svgToPng(favPath, 32),
      top: rowTop + (ROW_H - 32) / 2,
      left: x,
    })

    // favicon 64 (zoom for clarity)
    x += COL_FAV32 + COL_GAP
    composites.push({
      input: await svgToPng(favPath, 64),
      top: rowTop + (ROW_H - 64) / 2,
      left: x,
    })

    // pwa 192
    x += COL_FAV64 + COL_GAP
    composites.push({
      input: await svgToPng(pwaPath, 192),
      top: rowTop + (ROW_H - 192) / 2,
      left: x,
    })

    // pwa 192 with circle mask overlay (simulates OS mask crop)
    x += COL_PWA + COL_GAP
    const pwa192 = await svgToPng(pwaPath, 192)
    composites.push({
      input: await applyCircleMask(pwa192, 192),
      top: rowTop + (ROW_H - 192) / 2,
      left: x,
    })
  }

  await canvas.composite(composites).png().toFile(OUT_FILE)
  console.log(`Wrote ${OUT_FILE}`)
}

await main()
