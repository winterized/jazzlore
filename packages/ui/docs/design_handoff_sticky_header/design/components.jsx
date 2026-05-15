// Jazzlore shared components — keyboard, cards, root picker, scroll-spy.

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ───────── MiniKeyboard ─────────
// Renders an inline piano keyboard. `semis` is an array of semitone offsets
// from the root key. semis[0] is the highlighted root (orange); others get a
// neutral dot. Width is responsive to host.
function MiniKeyboard({ semis = [], octaves = 2, height = 56 }) {
  // 12 semitones × octaves white-key layout. White keys: 0,2,4,5,7,9,11
  const whitePat = [0,2,4,5,7,9,11];
  const isBlack = (s) => [1,3,6,8,10].includes(s % 12);
  const totalSemis = octaves * 12 + 1; // include final octave's C
  const whiteCount = octaves * 7 + 1;
  const whiteW = 18;
  const blackW = 11;
  const whiteH = height;
  const blackH = height * 0.62;
  const width = whiteCount * whiteW;

  // Build white key positions
  const whites = [];
  for (let i = 0; i < whiteCount; i++) whites.push({ idx: i, x: i * whiteW });

  // semitone -> x position helper
  const semiX = (s) => {
    const o = Math.floor(s / 12);
    const inOct = s % 12;
    const whiteIndex = whitePat.indexOf(inOct);
    if (whiteIndex >= 0) {
      return o * 7 * whiteW + whiteIndex * whiteW + whiteW / 2;
    }
    // black: between two whites; compute white index of the previous white
    const prevWhite = ({1:0,3:1,6:3,8:4,10:5})[inOct];
    return o * 7 * whiteW + prevWhite * whiteW + whiteW - blackW / 2 + blackW / 2;
  };
  const semiBlackX = (s) => {
    const o = Math.floor(s / 12);
    const inOct = s % 12;
    const prevWhite = ({1:0,3:1,6:3,8:4,10:5})[inOct];
    return o * 7 * whiteW + prevWhite * whiteW + whiteW - blackW / 2;
  };

  // Set of highlighted semitones (relative to root which is semis[0]=0)
  const onSet = new Set(semis);

  return (
    <svg className="jl-kb" width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
      {/* white keys */}
      {whites.map((w, i) => (
        <rect key={`w${i}`} className="wk" x={w.x} y={0} width={whiteW} height={whiteH} />
      ))}
      {/* black keys */}
      {Array.from({ length: octaves * 12 }, (_, s) => s).filter(isBlack).map((s) => (
        <rect key={`b${s}`} className="bk" x={semiBlackX(s)} y={0} width={blackW} height={blackH} />
      ))}
      {/* dots on every key (subtle) */}
      {Array.from({ length: totalSemis }, (_, s) => s).map((s) => {
        if (!onSet.has(s) && !onSet.has(s % 12)) {
          // neutral grey dot
          const black = isBlack(s);
          const x = black ? semiBlackX(s) + blackW / 2 : semiX(s);
          const y = black ? blackH - 7 : whiteH - 7;
          return <circle key={`d${s}`} cx={x} cy={y} r="1.4" fill={black ? "#9a9a9a" : "#9a9a9a"} opacity="0.55" />;
        }
        return null;
      })}
      {/* highlighted note dots */}
      {semis.map((s, i) => {
        const black = isBlack(s);
        const x = black ? semiBlackX(s) + blackW / 2 : semiX(s);
        const y = black ? blackH - 7 : whiteH - 7;
        const isRoot = i === 0;
        return (
          <circle
            key={`on${i}`}
            cx={x}
            cy={y}
            r={isRoot ? 3.5 : 2.8}
            fill={isRoot ? "var(--jl-accent)" : (black ? "#f4f1ea" : "#1a1a1a")}
          />
        );
      })}
    </svg>
  );
}

// ───────── ChordCard ─────────
function ChordCard({ chord, root = "C", device = "desktop" }) {
  return (
    <div className="jl-card" data-jl-anchor={chord.id} id={`chord-${chord.id}`}>
      <div>
        <div className="jl-card-head">
          <span className="jl-card-name">{root}{chord.short.slice(1)}</span>
          <span className="jl-card-sub">{chord.long}</span>
        </div>
        <div className="jl-card-notes">{chord.notes.replace(/^C/, root)}</div>
        <div className="jl-card-intervals">{chord.intervals}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <MiniKeyboard semis={chord.semis} octaves={2} height={56} />
      </div>
      <div className="jl-card-actions">
        <button className="jl-card-action" title="Play">♪</button>
        <button className="jl-card-action" title="Favorite">☆</button>
      </div>
    </div>
  );
}

// ───────── ScaleCard ─────────
function ScaleCard({ scale, root = "C" }) {
  return (
    <div className="jl-card" data-jl-anchor={scale.id} id={`scale-${scale.id}`}>
      <div>
        <div className="jl-card-head">
          <span className="jl-card-name" style={{ fontSize: 17 }}>{scale.name}</span>
        </div>
        {scale.aka ? <div className="jl-card-aka">{scale.aka}</div> : null}
        <div className="jl-card-notes" style={{ marginTop: 8 }}>{scale.notes.replace(/^C/, root)}</div>
        <div className="jl-card-intervals">{scale.intervals}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <MiniKeyboard semis={scale.semis} octaves={2} height={56} />
      </div>
      <div className="jl-card-actions">
        <button className="jl-card-action" title="Favorite">☆</button>
        <button className="jl-card-action" title="Play">♪</button>
      </div>
    </div>
  );
}

// ───────── RootPicker ─────────
function RootPicker({ value, onChange, compact = false }) {
  return (
    <div className="jl-rootpicker" role="tablist" aria-label="Root note">
      {window.JL_ROOTS.map((r, i) => (
        <button
          key={i}
          className="jl-root"
          aria-pressed={value === i}
          onClick={() => onChange(i)}
        >
          {r.label}
          {r.enharmonic ? <span className="jl-enh">{r.enharmonic}</span> : null}
        </button>
      ))}
    </div>
  );
}

// Compact "C ▾" button (mobile)
function RootCompactButton({ rootLabel, onClick }) {
  return (
    <button className="jl-root-compact" onClick={onClick}>
      <span>{rootLabel}</span>
      <span style={{ fontSize: 9, opacity: 0.7 }}>▾</span>
    </button>
  );
}

// Theme toggle (sun/moon)
function ThemeToggle({ theme, onToggle }) {
  return (
    <button className="jl-icon-btn" onClick={onToggle} title="Toggle theme">
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}

// "My collection" / "My scales" pill
function MyPill({ kind }) {
  return (
    <button className="jl-util-btn">
      {kind === "chords" ? "My chord collection" : "My scales"}
    </button>
  );
}

// ───────── ChipRow with scroll-spy ─────────
// items: [{ id, label, group? }]  — when grouped=true, render group dividers
// scrollContainerRef: ref to the .jl-scroller element that hosts anchor targets
// anchorPrefix: e.g. "chord-" so DOM id is "chord-<id>"
function ChipRow({ items, scrollContainerRef, anchorPrefix, grouped = false, groupLabels = false }) {
  const [activeId, setActiveId] = useState(items[0]?.id);
  const chipRowRef = useRef(null);

  // Scroll-spy: observe which card is most visible
  useEffect(() => {
    const scroller = scrollContainerRef.current;
    if (!scroller) return;
    const targets = items
      .map((it) => scroller.querySelector(`#${anchorPrefix}${CSS.escape(it.id)}`))
      .filter(Boolean);
    if (!targets.length) return;

    const onScroll = () => {
      // Find first card whose top is below the header threshold
      const scRect = scroller.getBoundingClientRect();
      const threshold = scRect.top + 240; // approx header height
      let current = items[0].id;
      for (const t of targets) {
        const r = t.getBoundingClientRect();
        if (r.top <= threshold) current = t.id.replace(anchorPrefix, "");
        else break;
      }
      setActiveId(current);
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [items, anchorPrefix, scrollContainerRef]);

  // Auto-scroll the active chip into view within the chip row
  useEffect(() => {
    const row = chipRowRef.current;
    if (!row) return;
    const chip = row.querySelector(`[data-chip-id="${CSS.escape(activeId)}"]`);
    if (!chip) return;
    const rRect = row.getBoundingClientRect();
    const cRect = chip.getBoundingClientRect();
    if (cRect.left < rRect.left + 40 || cRect.right > rRect.right - 40) {
      const target = chip.offsetLeft - row.clientWidth / 2 + chip.offsetWidth / 2;
      row.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
    }
  }, [activeId]);

  const jumpTo = (id) => {
    const scroller = scrollContainerRef.current;
    const el = scroller?.querySelector(`#${anchorPrefix}${CSS.escape(id)}`);
    if (!el || !scroller) return;
    const scTop = scroller.getBoundingClientRect().top;
    const elTop = el.getBoundingClientRect().top;
    scroller.scrollBy({ top: elTop - scTop - 220, behavior: "smooth" });
  };

  // Group rendering
  if (grouped) {
    const groups = {};
    items.forEach((it) => {
      const g = it.group || "Other";
      if (!groups[g]) groups[g] = [];
      groups[g].push(it);
    });
    const out = [];
    Object.entries(groups).forEach(([gname, list], gi) => {
      if (gi > 0) out.push(<span className="jl-chip-divider" key={`div-${gi}`} />);
      if (groupLabels) out.push(<span className="jl-chip-group-label" key={`lbl-${gi}`}>{gname}</span>);
      list.forEach((it) => {
        out.push(
          <button
            key={it.id}
            className="jl-chip"
            data-chip-id={it.id}
            aria-current={activeId === it.id}
            onClick={() => jumpTo(it.id)}
          >{it.label}</button>
        );
      });
    });
    return <div className="jl-chiprow" ref={chipRowRef}>{out}</div>;
  }

  return (
    <div className="jl-chiprow" ref={chipRowRef}>
      {items.map((it) => (
        <button
          key={it.id}
          className="jl-chip"
          data-chip-id={it.id}
          aria-current={activeId === it.id}
          onClick={() => jumpTo(it.id)}
        >{it.label}</button>
      ))}
    </div>
  );
}

// ───────── Bottom sheet (mobile root) ─────────
function RootSheet({ open, onClose, value, onChange }) {
  if (!open) return null;
  return (
    <div className="jl-sheet-backdrop" onClick={onClose}>
      <div className="jl-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="jl-sheet-handle" />
        <div className="jl-sheet-title">Root note</div>
        <RootPicker value={value} onChange={(i) => { onChange(i); onClose(); }} />
      </div>
    </div>
  );
}

// ───────── Body lists ─────────
function ChordsBody({ root, device, showGroupHeaders = false }) {
  const rootLabel = window.JL_ROOTS[root].label;
  if (!showGroupHeaders) {
    return (
      <div className="jl-body">
        {window.JL_CHORDS.map((c) => (
          <ChordCard key={c.id} chord={c} root={rootLabel} device={device} />
        ))}
      </div>
    );
  }
  // Group-header variant: inject a faint section header before each group's chords.
  return (
    <div className="jl-body">
      {window.JL_CHORD_GROUPS.map((g) => (
        <React.Fragment key={g.label}>
          <div className="jl-section-header" id={`chord-section-${g.label}`}>{g.label}</div>
          {g.ids.map((id) => {
            const c = window.JL_CHORDS.find((x) => x.id === id);
            return c ? <ChordCard key={c.id} chord={c} root={rootLabel} device={device} /> : null;
          })}
        </React.Fragment>
      ))}
    </div>
  );
}

function ScalesBody({ root, device }) {
  const rootLabel = window.JL_ROOTS[root].label;
  return (
    <div className="jl-body">
      {window.JL_SCALE_GROUPS.map((g, gi) => (
        <React.Fragment key={g.id}>
          <div
            className="jl-group"
            id={`scale-group-${g.id}`}
            data-jl-anchor={`group-${g.id}`}
          >
            <span>{g.label} <span className="jl-group-count">({g.scales?.length || g.count})</span></span>
            <span style={{ color: "var(--jl-text-muted)" }}>{g.expanded ? "▾" : "▸"}</span>
          </div>
          {g.expanded && g.scales.map((s) => (
            <div key={s.id} id={`scale-group-${g.id}-item-${s.id}`}>
              <ScaleCard scale={s} root={rootLabel} />
            </div>
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}

// Expose to global scope so variation file can use
Object.assign(window, {
  MiniKeyboard, ChordCard, ScaleCard,
  RootPicker, RootCompactButton, ThemeToggle, MyPill,
  ChipRow, RootSheet, ChordsBody, ScalesBody,
});
