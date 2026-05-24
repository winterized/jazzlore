// Component-scoped CSS for GraphView. The frozen Phase-B token layer
// (`src/index.css`) must NOT be edited, so the graph's styles live here,
// scoped under `.mu-graph`, and only *consume* the frozen `--*` vars (theme
// switches automatically with `data-theme`). Mirrors the design's
// `.desk-graph*` / `.gnode*` / `.gedge*` rules from musicians3-styles.css.

export const GRAPH_CSS = `
.mu-graph {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 100%;
  min-height: 480px;
  background:
    radial-gradient(circle at 50% 40%,
      color-mix(in srgb, var(--accent) 6%, transparent) 0%,
      transparent 60%),
    var(--bg-soft);
}
.mu-graph-bar {
  position: absolute;
  top: 16px;
  left: 24px;
  right: 24px;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  z-index: 4;
}
.mu-graph-bar .mu-ttl {
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--dim);
}
.mu-graph-bar .mu-ttl b { color: var(--text); letter-spacing: 0.005em; }
.mu-graph-ctrls { display: inline-flex; gap: 4px; }
.mu-graph-ctrls button {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 6px;
  width: 30px;
  height: 30px;
  color: var(--text-soft);
  font: 500 12px/1 var(--font-mono);
  cursor: pointer;
}
.mu-graph-ctrls button:hover { background: var(--card-hover); }
.mu-graph-ctrls button:focus-visible {
  outline: 2px solid var(--accent-strong);
  outline-offset: 2px;
}
.mu-graph-ctrls button[aria-pressed='true'] {
  background: var(--accent-strong);
  color: var(--accent-fg);
  border-color: var(--accent-strong);
}
.mu-graph-svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.mu-graph-svg:focus-visible { outline: none; }
.mu-gnode { cursor: pointer; }
.mu-gnode:focus-visible { outline: none; }
.mu-gnode:focus-visible > circle:last-of-type {
  stroke: var(--accent-strong);
  stroke-width: 2.5;
  opacity: 1;
}
/* Labels render in the DOM for every node, but peripheral names + sub-
 * instrument text are hidden by default and revealed on :hover and
 * :focus-visible — that's the keyboard-parity affordance, not optional.
 * The central node (.mu-gnode-focus) always shows its name + instrument:
 * it's the anchor, we must always see whose graph this is. The hide is
 * via opacity (not display: none) so the layout box stays stable and
 * screen readers still encounter the text. pointer-events: none keeps
 * the text from intercepting node hit-tests when it's invisible. */
.mu-gnode-label {
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 11px;
  fill: var(--text);
  letter-spacing: -0.005em;
  opacity: 0;
  pointer-events: none;
  transition: opacity 120ms ease;
}
.mu-gnode-sub {
  font-family: var(--font-mono);
  font-size: 9px;
  fill: var(--muted);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0;
  pointer-events: none;
  transition: opacity 120ms ease;
}
.mu-gnode:hover .mu-gnode-label,
.mu-gnode:hover .mu-gnode-sub,
.mu-gnode:focus-visible .mu-gnode-label,
.mu-gnode:focus-visible .mu-gnode-sub,
.mu-gnode-focus .mu-gnode-label,
.mu-gnode-focus .mu-gnode-sub {
  opacity: 1;
}
.mu-gnode-initials {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 600;
  fill: var(--text);
  opacity: 0.78;
}
.mu-gnode-focus .mu-gnode-label { font-size: 14px; font-weight: 700; }
.mu-gnode-focus .mu-gnode-initials { fill: var(--accent-fg); opacity: 0.9; }

/* ─── Family-fill colour vars (graph-only) ────────────────────────────
 * Six families + unknown. Scoped to .mu-graph so the rest of the app
 * (tiles, rails, cards, mosaic, Duo3, era strip) keeps its existing
 * duotone treatment unchanged. Hues echo the existing palette.ts
 * duotone pairs so the graph reads as the same colour-world; iterate
 * from screenshots if any family fails AA contrast on the in-circle
 * monogram (fill: var(--text), opacity: 0.78).
 *
 * Dark theme defaults; .mu3[data-theme="light"] overrides match the
 * palette table in the plan. */
.mu-graph {
  --family-brass: #c89c4a;
  --family-reeds: #6a9075;
  --family-strings: #6f8caa;
  --family-keys: #a89880;
  --family-percussion: #a06b6b;
  --family-voice: #8a72a8;
  --family-unknown: #5a5550;
}
.mu3[data-theme='light'] .mu-graph {
  --family-brass: #a07a2e;
  --family-reeds: #4f7559;
  --family-strings: #4d6a8a;
  --family-keys: #80715a;
  --family-percussion: #7a4848;
  --family-voice: #6a5288;
  --family-unknown: #aaa39a;
}
.mu-gnode.mu-family-brass .mu-gnode-fill { fill: var(--family-brass); }
.mu-gnode.mu-family-reeds .mu-gnode-fill { fill: var(--family-reeds); }
.mu-gnode.mu-family-strings .mu-gnode-fill { fill: var(--family-strings); }
.mu-gnode.mu-family-keys .mu-gnode-fill { fill: var(--family-keys); }
.mu-gnode.mu-family-percussion .mu-gnode-fill { fill: var(--family-percussion); }
.mu-gnode.mu-family-voice .mu-gnode-fill { fill: var(--family-voice); }
.mu-gnode.mu-family-unknown .mu-gnode-fill { fill: var(--family-unknown); }

@media (prefers-reduced-motion: reduce) {
  .mu-gnode-label,
  .mu-gnode-sub {
    transition: none;
  }
}
.mu-gedge {
  stroke: var(--line);
  stroke-linecap: round;
  fill: none;
  opacity: 0.7;
}
.mu-gedge-strong { stroke: var(--accent); opacity: 0.5; }
.mu-graph-legend {
  position: absolute;
  bottom: 16px;
  left: 24px;
  right: 24px;
  font-family: var(--font-mono);
  font-size: 9.5px;
  color: var(--muted);
  letter-spacing: 0.06em;
  display: flex;
  align-items: center;
  gap: 14px;
  z-index: 4;
}
.mu-graph-legend .mu-lk { display: inline-flex; align-items: center; gap: 6px; }
.mu-graph-legend .mu-dot {
  width: 8px; height: 8px; border-radius: 50%; background: var(--accent);
}
.mu-graph-legend .mu-lin {
  display: inline-block;
  width: 24px;
  height: 2px;
  background: var(--accent);
  border-radius: 1px;
}
.mu-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
`
