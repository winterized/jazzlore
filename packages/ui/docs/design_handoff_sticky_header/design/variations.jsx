// Jazzlore sticky-header variations.
//
// Each variation exports a HeaderVN({ app, device, root, setRoot, theme, setTheme, scrollerRef }) component.
// `app` ∈ "chords" | "scales".  `device` ∈ "desktop" | "mobile".

const { useState: _useState, useEffect: _useEffect, useRef: _useRef } = React;

// ───────── chip-row item builders ─────────
function chipsForChords({ grouped = false } = {}) {
  // flatten by group order so the chip row is grouped left→right
  const items = [];
  window.JL_CHORD_GROUPS.forEach((g) => {
    g.ids.forEach((id) => {
      const c = window.JL_CHORDS.find((x) => x.id === id);
      if (!c) return;
      items.push({ id: c.id, label: c.short, group: grouped ? g.label : undefined });
    });
  });
  return items;
}
function chipsForScales() {
  return window.JL_SCALE_GROUPS.map((g) => ({ id: `group-${g.id}`, label: g.label }));
}

// Scale chips need their anchor prefix to match the group elements' DOM ids.
// We're using id="scale-group-<id>" and data-anchor "group-<id>".
const ANCHOR = {
  chords: "chord-",
  scales: "scale-group-", // strip leading "group-" when looking up
};
// Custom prefix logic: ChipRow looks up `#${prefix}${item.id}`.
// For chords: id="maj", prefix="chord-"  → "#chord-maj" ✓
// For scales: id="group-major", prefix="scale-"  → "#scale-group-major" ✓
const PREFIX = { chords: "chord-", scales: "scale-" };

// ───────── shared utility row pieces ─────────
function Util({ app, theme, onTheme, device }) {
  return (
    <>
      <MyPill kind={app} />
      <ThemeToggle theme={theme} onToggle={onTheme} />
    </>
  );
}
function MobileRootButton({ root, onOpen }) {
  return <RootCompactButton rootLabel={window.JL_ROOTS[root].label} onClick={onOpen} />;
}

function PageTitle({ app, root, size = "" }) {
  const label = window.JL_ROOTS[root].label;
  return (
    <h1 className={`jl-title ${size}`}>{label} {app}</h1>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// V1 — CLASSIC STACK
//   row 1: title | spacer | utils
//   row 2: root picker (full width, 12 cols)
//   row 3: scroll-spy chip row
// Mobile: title | C▾ | theme  /  chip row
// ═══════════════════════════════════════════════════════════════════════
function HeaderV1({ app, device, root, setRoot, theme, setTheme, scrollerRef, openRootSheet }) {
  const items = app === "chords" ? chipsForChords() : chipsForScales();
  if (device === "desktop") {
    return (
      <div className="jl-header">
        <div className="jl-header-row">
          <PageTitle app={app} root={root} />
          <div className="jl-spacer" />
          <Util app={app} theme={theme} onTheme={setTheme} />
        </div>
        <RootPicker value={root} onChange={setRoot} />
        <ChipRow items={items} scrollContainerRef={scrollerRef} anchorPrefix={PREFIX[app]} />
      </div>
    );
  }
  return (
    <div className="jl-header">
      <div className="jl-header-row">
        <PageTitle app={app} root={root} />
        <div className="jl-spacer" />
        <MobileRootButton root={root} onOpen={openRootSheet} />
        <ThemeToggle theme={theme} onToggle={setTheme} />
      </div>
      <ChipRow items={items} scrollContainerRef={scrollerRef} anchorPrefix={PREFIX[app]} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// V2 — TITLE + ROOT INLINE; CHIPS BELOW
//   Desktop row 1: title | root picker (inline, 12 small) | utils
//   Desktop row 2: chip row
// Mobile: title | C▾ | theme  /  chip row
// ═══════════════════════════════════════════════════════════════════════
function HeaderV2({ app, device, root, setRoot, theme, setTheme, scrollerRef, groupedChips = false, openRootSheet }) {
  // Group labels only make sense for chords (the scales chip row is already one chip per group).
  const showGrouped = groupedChips && app === "chords";
  const items = app === "chords" ? chipsForChords({ grouped: showGrouped }) : chipsForScales();
  if (device === "desktop") {
    return (
      <div className="jl-header">
        <div className="jl-header-row" style={{ paddingBottom: 12 }}>
          <PageTitle app={app} root={root} size="jl-title-sm" />
          <div
            className="jl-rootpicker"
            style={{ padding: 0, gridTemplateColumns: "repeat(12, 36px)", gap: 4, flex: "0 1 auto" }}
          >
            {window.JL_ROOTS.map((r, i) => (
              <button
                key={i}
                className="jl-root"
                style={{ height: 32, fontSize: 12 }}
                aria-pressed={root === i}
                onClick={() => setRoot(i)}
              >
                {r.label}
                {r.enharmonic ? <span className="jl-enh" style={{ fontSize: 8, top: -6 }}>{r.enharmonic}</span> : null}
              </button>
            ))}
          </div>
          <div className="jl-spacer" />
          <Util app={app} theme={theme} onTheme={setTheme} />
        </div>
        <ChipRow
          items={items}
          scrollContainerRef={scrollerRef}
          anchorPrefix={PREFIX[app]}
          grouped={showGrouped}
          groupLabels={showGrouped}
        />
      </div>
    );
  }
  return (
    <div className="jl-header">
      <div className="jl-header-row">
        <PageTitle app={app} root={root} />
        <div className="jl-spacer" />
        <MobileRootButton root={root} onOpen={openRootSheet} />
        <ThemeToggle theme={theme} onToggle={setTheme} />
      </div>
      <ChipRow
        items={items}
        scrollContainerRef={scrollerRef}
        anchorPrefix={PREFIX[app]}
        grouped={showGrouped}
          groupLabels={showGrouped}
      />
    </div>
  );
}

// Wrapper variant that turns on grouped chip labels.
function HeaderV2Grouped(props) {
  return <HeaderV2 {...props} groupedChips={true} />;
}

// ═══════════════════════════════════════════════════════════════════════
// V3 — TITLE + CHIPS INLINE; ROOT PICKER BELOW
//   Desktop row 1: title | chip row (flexes/scrolls) | utils
//   Desktop row 2: root picker
// Mobile: title | chips (inline, scrolling) | menu  /  hidden root picker (sheet)
// ═══════════════════════════════════════════════════════════════════════
function HeaderV3({ app, device, root, setRoot, theme, setTheme, scrollerRef, openRootSheet }) {
  const items = app === "chords" ? chipsForChords() : chipsForScales();
  if (device === "desktop") {
    return (
      <div className="jl-header">
        <div className="jl-header-row" style={{ gap: 16, paddingBottom: 10 }}>
          <PageTitle app={app} root={root} size="jl-title-sm" />
          <div style={{ flex: "1 1 0", minWidth: 0 }}>
            <ChipRow items={items} scrollContainerRef={scrollerRef} anchorPrefix={PREFIX[app]} />
          </div>
          <Util app={app} theme={theme} onTheme={setTheme} />
        </div>
        <RootPicker value={root} onChange={setRoot} />
      </div>
    );
  }
  return (
    <div className="jl-header">
      <div className="jl-header-row" style={{ gap: 8 }}>
        <PageTitle app={app} root={root} />
        <div style={{ flex: "1 1 0", minWidth: 0 }}>
          <ChipRow items={items} scrollContainerRef={scrollerRef} anchorPrefix={PREFIX[app]} />
        </div>
        <MobileRootButton root={root} onOpen={openRootSheet} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// V4 — STACK WITH GROUPED CHIPS
//   Like V1 but chips have group labels + dividers (more typographic).
// Mobile: title | C▾ | theme  /  chip row with group labels
// ═══════════════════════════════════════════════════════════════════════
function HeaderV4({ app, device, root, setRoot, theme, setTheme, scrollerRef, openRootSheet }) {
  const chordsGrouped = app === "chords";
  const items = chordsGrouped ? chipsForChords({ grouped: true }) : chipsForScales();
  if (device === "desktop") {
    return (
      <div className="jl-header">
        <div className="jl-header-row">
          <PageTitle app={app} root={root} />
          <div className="jl-spacer" />
          <Util app={app} theme={theme} onTheme={setTheme} />
        </div>
        <RootPicker value={root} onChange={setRoot} />
        <ChipRow
          items={items}
          scrollContainerRef={scrollerRef}
          anchorPrefix={PREFIX[app]}
          grouped={chordsGrouped}
          groupLabels={chordsGrouped}
        />
      </div>
    );
  }
  return (
    <div className="jl-header">
      <div className="jl-header-row">
        <PageTitle app={app} root={root} />
        <div className="jl-spacer" />
        <MobileRootButton root={root} onOpen={openRootSheet} />
        <ThemeToggle theme={theme} onToggle={setTheme} />
      </div>
      <ChipRow
        items={items}
        scrollContainerRef={scrollerRef}
        anchorPrefix={PREFIX[app]}
        grouped={chordsGrouped}
        groupLabels={chordsGrouped}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// V5 — UNIFIED RAIL
//   Desktop row 1: title (with utils right-aligned, small)
//   Desktop row 2: ONE rail = root picker buttons + vertical divider + chips (scrolls)
// Mobile: title row; row 2: C▾ + divider + chips inline (one scrolling rail)
// ═══════════════════════════════════════════════════════════════════════
function HeaderV5({ app, device, root, setRoot, theme, setTheme, scrollerRef, openRootSheet }) {
  const items = app === "chords" ? chipsForChords() : chipsForScales();
  if (device === "desktop") {
    return (
      <div className="jl-header">
        <div className="jl-header-row" style={{ paddingBottom: 10 }}>
          <PageTitle app={app} root={root} />
          <div className="jl-spacer" />
          <Util app={app} theme={theme} onTheme={setTheme} />
        </div>
        <div
          className="jl-chiprow"
          style={{ paddingBottom: 14, gap: 8, alignItems: "center" }}
        >
          {window.JL_ROOTS.map((r, i) => (
            <button
              key={i}
              className="jl-root"
              style={{
                flex: "0 0 auto",
                height: 30,
                minWidth: 32,
                padding: "0 8px",
                fontSize: 12,
              }}
              aria-pressed={root === i}
              onClick={() => setRoot(i)}
            >
              {r.label}
              {r.enharmonic ? <span className="jl-enh" style={{ fontSize: 8, top: -6 }}>{r.enharmonic}</span> : null}
            </button>
          ))}
          <span
            style={{
              flex: "0 0 auto",
              width: 1,
              height: 22,
              background: "var(--jl-divider)",
              margin: "0 6px",
            }}
          />
          {items.map((it, i) => (
            <button
              key={it.id}
              className="jl-chip"
              data-chip-id={it.id}
              onClick={() => {
                const scroller = scrollerRef.current;
                const el = scroller?.querySelector(`#${PREFIX[app]}${CSS.escape(it.id)}`);
                if (!el || !scroller) return;
                const scTop = scroller.getBoundingClientRect().top;
                const elTop = el.getBoundingClientRect().top;
                scroller.scrollBy({ top: elTop - scTop - 180, behavior: "smooth" });
              }}
            >
              {it.label}
            </button>
          ))}
        </div>
        <V5Spy items={items} scrollerRef={scrollerRef} prefix={PREFIX[app]} />
      </div>
    );
  }
  return (
    <div className="jl-header">
      <div className="jl-header-row">
        <PageTitle app={app} root={root} />
        <div className="jl-spacer" />
        <ThemeToggle theme={theme} onToggle={setTheme} />
      </div>
      <div className="jl-chiprow" style={{ gap: 8, alignItems: "center" }}>
        <button
          className="jl-root-compact"
          onClick={openRootSheet}
          style={{ flex: "0 0 auto" }}
        >
          {window.JL_ROOTS[root].label} <span style={{ fontSize: 9, opacity: 0.7 }}>▾</span>
        </button>
        <span
          style={{
            flex: "0 0 auto",
            width: 1,
            height: 18,
            background: "var(--jl-divider)",
          }}
        />
        {items.map((it) => (
          <button
            key={it.id}
            className="jl-chip"
            data-chip-id={it.id}
            onClick={() => {
              const scroller = scrollerRef.current;
              const el = scroller?.querySelector(`#${PREFIX[app]}${CSS.escape(it.id)}`);
              if (!el || !scroller) return;
              const scTop = scroller.getBoundingClientRect().top;
              const elTop = el.getBoundingClientRect().top;
              scroller.scrollBy({ top: elTop - scTop - 140, behavior: "smooth" });
            }}
          >
            {it.label}
          </button>
        ))}
      </div>
      <V5Spy items={items} scrollerRef={scrollerRef} prefix={PREFIX[app]} />
    </div>
  );
}

// helper: paints the aria-current state on V5's manually-rendered chips
function V5Spy({ items, scrollerRef, prefix }) {
  _useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const targets = items
      .map((it) => ({ id: it.id, el: scroller.querySelector(`#${prefix}${CSS.escape(it.id)}`) }))
      .filter((x) => x.el);
    if (!targets.length) return;

    const onScroll = () => {
      const threshold = scroller.getBoundingClientRect().top + 200;
      let current = targets[0].id;
      for (const t of targets) {
        if (t.el.getBoundingClientRect().top <= threshold) current = t.id;
        else break;
      }
      // paint
      scroller.parentElement.querySelectorAll(`[data-chip-id]`).forEach((c) => {
        c.setAttribute("aria-current", c.dataset.chipId === current ? "true" : "false");
      });
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [items, prefix, scrollerRef]);
  return null;
}

window.HEADERS = { V1: HeaderV1, V2: HeaderV2, V2g: HeaderV2Grouped, V3: HeaderV3, V4: HeaderV4, V5: HeaderV5 };
window.VARIATION_META = [
  { id: "V1", name: "Classic stack",    desc: "Three rows: title, root picker, chip row. Closest to existing app." },
  { id: "V2", name: "Inline root",      desc: "Root picker sits on the title row at reduced size; chips below." },
  { id: "V3", name: "Inline chips",     desc: "Chips sit on the title row; root picker on row 2 (full size)." },
  { id: "V4", name: "Grouped chips",    desc: "Same stack as V1, but chip row is divided + labeled by category." },
  { id: "V5", name: "Unified rail",     desc: "Root + chips share one scrolling rail beneath the title." },
];
