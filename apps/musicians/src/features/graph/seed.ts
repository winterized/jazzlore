// Deterministic seeding for the force-directed graph (landmine 6 /
// highest-risk #1). The repo's MD5-identical visual gate does NOT apply to
// physics — instead we make the *input* deterministic: a stable hash of the
// focus canonical id seeds a small PRNG, and d3-force's `randomSource` is
// pointed at it. Same focus id → identical cold layout across runs, machines
// and CI. Pure, no DOM, no React.

/** FNV-1a 32-bit hash of a string. Stable, fast, no deps — the canonical id
 * (e.g. `wikidata:Q93341`) hashes to the same 32-bit seed everywhere. */
export function hashId(id: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    // 32-bit FNV prime multiply (kept in uint32 via Math.imul + >>> 0).
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** A mulberry32 PRNG: tiny, fast, well-distributed, fully deterministic for a
 * given 32-bit seed. Returns a function yielding floats in [0, 1) — the exact
 * contract d3-force's `simulation.randomSource(fn)` expects. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function next(): number {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Build the seeded RNG for a focus id. The single entry point both the
 * pre-seeded node placement and d3-force consume so they share one stream. */
export function seededRandom(focusId: string): () => number {
  return mulberry32(hashId(focusId))
}
