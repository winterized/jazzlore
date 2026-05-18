// Re-centre choreography (highest-risk #1 / design "Graph re-centre" motion):
// 900ms ease-in-out, existing nodes ease toward their new settled positions,
// edge weights interpolate in lockstep, newly-introduced nodes fade in 200ms.
// `prefers-reduced-motion: reduce` → snap instantly (no rAF, no tween).
//
// React-Compiler-clean (the repo lints with eslint-plugin-react-hooks flat
// recommended: no ref reads during render, no synchronous setState in an
// effect body). Strategy:
//   • the SNAPPED `next` frame is *derived during render* (the default the
//     reduced-motion / cold-mount / no-rAF paths fall back to — no effect),
//   • a tween override lives in state, written ONLY inside the async rAF
//     callback (allowed; the rule forbids synchronous setState-in-effect),
//   • the previous layout is tracked via the documented render-phase
//     setState "derived state" pattern, not a ref mutated during render.
//
// jsdom has no requestAnimationFrame / matchMedia (project quirk): every
// access is guarded so unit tests run without browser globals.

import { useEffect, useState } from 'react'
import type { GraphLayout, LayoutEdge, LayoutNode } from './layout'

/** Design motion spec: graph re-centre = 900ms ease-in-out. */
export const RECENTRE_MS = 900
/** Newly-introduced node fade-in window. */
export const NODE_FADE_MS = 200

/** SSR/jsdom-safe reduced-motion read. Feature-owns this (musicians' only
 * sanctioned `@jazzlore/ui` reuse is ThemeToggle), mirroring the repo's
 * StickyHeader guard pattern. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Standard ease-in-out (cubic) — matches the design's "ease-in-out" token. */
function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/** A node as the renderer consumes it during/after a re-centre: settled
 * position plus a 0→1 fade for nodes that did not exist in the prior frame. */
export interface FrameNode extends LayoutNode {
  /** 1 for persistent nodes; ramps 0→1 over `NODE_FADE_MS` for new nodes. */
  fade: number
}

export interface GraphFrame {
  nodes: FrameNode[]
  edges: LayoutEdge[]
}

function snapFrame(layout: GraphLayout): GraphFrame {
  return {
    nodes: layout.nodes.map((n) => ({ ...n, fade: 1 })),
    edges: layout.edges,
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function edgeKey(e: LayoutEdge): string {
  return `${e.source} ${e.target}`
}

function tweenFrame(
  prev: GraphLayout,
  next: GraphLayout,
  elapsed: number,
): GraphFrame {
  const e = easeInOut(Math.min(1, elapsed / RECENTRE_MS))
  const prevById = new Map(prev.nodes.map((n) => [n.id, n]))
  const prevEdges = new Map(prev.edges.map((edge) => [edgeKey(edge), edge]))

  const nodes: FrameNode[] = next.nodes.map((n) => {
    const before = prevById.get(n.id)
    if (before) {
      return {
        ...n,
        x: lerp(before.x, n.x, e),
        y: lerp(before.y, n.y, e),
        radius: lerp(before.radius, n.radius, e),
        fade: 1,
      }
    }
    // New node: hold final position, fade in over NODE_FADE_MS.
    return { ...n, fade: Math.min(1, elapsed / NODE_FADE_MS) }
  })

  const edges: LayoutEdge[] = next.edges.map((edge) => {
    const before = prevEdges.get(edgeKey(edge))
    if (!before) return edge
    return {
      ...edge,
      weight: lerp(before.weight, edge.weight, e),
      strokeWidth: lerp(before.strokeWidth, edge.strokeWidth, e),
    }
  })

  return { nodes, edges }
}

/**
 * Tween from the previous layout to `next` over `RECENTRE_MS`.
 *
 * `next` identity changes on every re-centre (GraphView memoises it per
 * focus id). On change, the previous `next` becomes the tween origin via the
 * render-phase derived-state pattern; reduced-motion / cold-mount / no-rAF
 * environments simply render the snapped `next` (no effect runs setState).
 *
 * Returns the current frame to render.
 */
export function useRecentre(next: GraphLayout): GraphFrame {
  // Derived-state: remember the layout we were last asked to render, and the
  // one before it (the tween origin). Updated during render on change — the
  // documented React pattern, not a ref mutation.
  const [tracked, setTracked] = useState<{
    current: GraphLayout
    origin: GraphLayout | null
  }>({ current: next, origin: null })

  if (tracked.current !== next) {
    setTracked({ current: next, origin: tracked.current })
  }

  // Live tween override. Only ever written from inside the rAF callback.
  const [tween, setTween] = useState<GraphFrame | null>(null)

  useEffect(() => {
    if (tracked.current !== next) return
    const origin = tracked.origin
    if (
      !origin ||
      prefersReducedMotion() ||
      typeof requestAnimationFrame !== 'function'
    ) {
      // Snap path: no animation. The render-time default (snapped `next`)
      // already shows the final layout; just clear any stale tween.
      return
    }

    let raf = 0
    let startTs = 0
    const step = (ts: number): void => {
      if (startTs === 0) startTs = ts
      const elapsed = ts - startTs
      setTween(tweenFrame(origin, next, elapsed))
      if (elapsed < RECENTRE_MS) {
        raf = requestAnimationFrame(step)
      }
    }
    raf = requestAnimationFrame(step)
    return () => {
      if (raf && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(raf)
      }
    }
  }, [next, tracked])

  // While a tween for the current target is live, render it; otherwise the
  // snapped final layout (cold mount, reduced motion, settled, no rAF).
  if (tween && tracked.current === next) return tween
  return snapFrame(next)
}
