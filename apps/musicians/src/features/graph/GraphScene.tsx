// The SVG scene: edges + nodes for one animation frame. Split out of
// GraphView to keep each file < ~150 lines. Purely presentational — all
// theming via the frozen token CSS vars (`--accent`, `--card`, `--line`,
// `--text`, `--muted`), dark/light automatic through `data-theme`.

import { useMemo, useState, type KeyboardEvent } from 'react'
import type { LayoutEdge } from './layout'
import type { FrameNode, GraphFrame } from './useRecentre'
import { initialsOf } from './palette'
import { familyClass } from './instrumentFamilies'

interface GraphSceneProps {
  frame: GraphFrame
  /** Map of node id → its current position, for edge endpoint lookup. */
  selectedId: string
  onSelect(id: string): void
}

function edgeClass(e: LayoutEdge): string {
  return e.strong ? 'mu-gedge mu-gedge-strong' : 'mu-gedge'
}

export default function GraphScene({
  frame,
  selectedId,
  onSelect,
}: GraphSceneProps) {
  // Memoised so React's hover/focus re-renders don't rebuild the lookup
  // table 60×/interaction (negligible at ~30 nodes but cheap to fix).
  const pos = useMemo(
    () => new Map(frame.nodes.map((n) => [n.id, n])),
    [frame.nodes],
  )

  // The labels now live in a SEPARATE second-pass group (so SVG paint
  // order lands them on top of every node circle), which breaks the
  // CSS-descendant trigger `.mu-gnode:hover .mu-gnode-label`. Replicate
  // the show/hide rule in React: a label is visible when its node is
  // hovered OR focused OR is the central anchor.
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [focusedId, setFocusedId] = useState<string | null>(null)

  const onKey = (id: string) => (ev: KeyboardEvent<SVGGElement>) => {
    if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar') {
      ev.preventDefault()
      onSelect(id)
    }
  }

  return (
    <>
      <g aria-hidden="true">
        {frame.edges.map((e) => {
          const s = pos.get(e.source)
          const t = pos.get(e.target)
          if (!s || !t) return null
          return (
            <line
              key={`${e.source}__${e.target}`}
              className={edgeClass(e)}
              x1={s.x}
              y1={s.y}
              x2={t.x}
              y2={t.y}
              strokeWidth={e.strokeWidth}
              opacity={Math.min(s.fade, t.fade)}
            />
          )
        })}
      </g>
      {frame.nodes.map((n: FrameNode) => {
        const label = n.instrument ? `${n.name}, ${n.instrument}` : n.name
        const isSelected = n.id === selectedId
        // Peripheral nodes attach a mu-family-<key> class so the CSS layer
        // picks the family fill via `--family-*` vars. The central node
        // (`mu-gnode-focus`) keeps the `--accent` treatment — the family
        // colour is for grouping the orbit, not the anchor.
        const familyCls = n.focus ? '' : ` ${familyClass(n.instrument)}`
        return (
          <g
            key={n.id}
            className={`mu-gnode${n.focus ? ' mu-gnode-focus' : ''}${familyCls}`}
            transform={`translate(${n.x},${n.y})`}
            opacity={n.fade}
            role="button"
            tabIndex={0}
            aria-label={label}
            aria-pressed={isSelected}
            onClick={() => onSelect(n.id)}
            onKeyDown={onKey(n.id)}
            onMouseEnter={() => setHoveredId(n.id)}
            onMouseLeave={() => setHoveredId((cur) => (cur === n.id ? null : cur))}
            onFocus={() => setFocusedId(n.id)}
            onBlur={() => setFocusedId((cur) => (cur === n.id ? null : cur))}
          >
            {n.focus ? (
              <>
                <circle
                  r={n.radius + 6}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth={1}
                  opacity={0.4}
                />
                <circle r={n.radius} fill="var(--accent)" />
              </>
            ) : (
              <>
                {/* Single family-coloured fill — CSS picks the colour from
                 *  the `mu-family-<key>` class on the parent `<g>`. The
                 *  stroke ring stays a separate `circle` so the existing
                 *  `:focus-visible > circle:last-of-type` rule still
                 *  targets it. */}
                <circle r={n.radius} className="mu-gnode-fill" />
                <circle
                  r={n.radius}
                  fill="none"
                  stroke={isSelected ? 'var(--accent-strong)' : 'var(--line)'}
                  strokeWidth={isSelected ? 2 : 0.75}
                  opacity={isSelected ? 0.9 : 0.5}
                />
              </>
            )}
            <text
              className="mu-gnode-initials"
              textAnchor="middle"
              dy="0.32em"
              aria-hidden="true"
            >
              {initialsOf(n.name)}
            </text>
          </g>
        )
      })}
      {/* Second pass: ALL node labels, rendered AFTER every node's circles
       *  so SVG paint order lands the text on top of any neighbouring
       *  circle that would otherwise overlap it (peripheral labels sit
       *  BELOW their own circle and previously got covered by the next
       *  peripheral's circle in DOM order). aria-hidden because each node
       *  group above already carries the spoken `aria-label` — screen
       *  readers don't need the visible text restated. */}
      <g aria-hidden="true" className="mu-gnode-labels">
        {frame.nodes.map((n: FrameNode) => (
          <g
            key={n.id}
            transform={`translate(${n.x},${n.y})`}
            opacity={n.fade}
            data-active={
              n.focus || n.id === hoveredId || n.id === focusedId
                ? 'true'
                : undefined
            }
            data-focus-node={n.focus ? 'true' : undefined}
          >
            <text
              className="mu-gnode-label"
              textAnchor="middle"
              dy={n.radius + 15}
            >
              {n.name}
            </text>
            {n.instrument ? (
              <text
                className="mu-gnode-sub"
                textAnchor="middle"
                dy={n.radius + 27}
              >
                {n.instrument}
              </text>
            ) : null}
          </g>
        ))}
      </g>
    </>
  )
}
