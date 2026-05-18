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
.mu-gnode-label {
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 11px;
  fill: var(--text);
  letter-spacing: -0.005em;
}
.mu-gnode-sub {
  font-family: var(--font-mono);
  font-size: 9px;
  fill: var(--muted);
  letter-spacing: 0.04em;
  text-transform: uppercase;
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
