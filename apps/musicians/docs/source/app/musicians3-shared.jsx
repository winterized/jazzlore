/* eslint-disable react/no-unknown-property */
// Jazzlore Musicians · Pass 3 — shared primitives.
// The reusable pieces every screen composes: Duo3 (duotone tile),
// MosaicHeader (image-only orbit), ConnRow (the spine row), EraStrip,
// RecordsStrip.

function Duo3({ name, style, initials = true, big, children, className = '' }) {
  const [lo, hi] = duotoneFor(name);
  return (
    <div className={`duo3 ${className}`}
         style={{ ['--duo-lo']: lo, ['--duo-hi']: hi, ...style }}>
      {initials && (
        <span className="duo3-initials" style={big ? { fontSize: '48px' } : undefined}>
          {initialsOf(name)}
        </span>
      )}
      {children}
    </div>
  );
}

// Tiny inline icons sized to the current font.
const I3 = {
  search: () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="4.5"/><path d="m11 11 3 3" strokeLinecap="round"/></svg>,
  moon:   () => <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M12.5 9.5A5 5 0 0 1 6.5 3.5a.5.5 0 0 0-.7-.5 6 6 0 1 0 7.2 7.2.5.5 0 0 0-.5-.7Z"/></svg>,
  sun:    () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="3"/><path d="M8 1.5v1.5M8 13v1.5M1.5 8h1.5M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" strokeLinecap="round"/></svg>,
  spot:   () => <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.3"/><path d="M5 6q3-1 6 .5M5 8q3-1 6 .5M5 10q2-.7 5 .3" stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinecap="round"/></svg>,
  apple:  () => <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M11.2 8.5c0-1.8 1.5-2.6 1.5-2.6-.8-1.2-2.1-1.4-2.5-1.4-1.1-.1-2.1.6-2.6.6-.6 0-1.4-.6-2.3-.6-1.2 0-2.3.7-2.9 1.8-1.2 2.2-.3 5.4.9 7.2.6.9 1.3 1.9 2.2 1.8.9 0 1.2-.6 2.3-.6s1.4.6 2.3.5c1 0 1.6-.9 2.2-1.8.7-1 .9-2 .9-2.1 0-.1-1.8-.7-1.8-2.8ZM9.8 3.2c.5-.6.8-1.4.7-2.2-.7 0-1.6.5-2 1.1-.5.5-.9 1.4-.8 2.1.8.1 1.6-.4 2.1-1Z"/></svg>,
  chev:   () => <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="m6 4 4 4-4 4" strokeLinecap="round"/></svg>,
  dots:   () => <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><circle cx="3" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="13" cy="8" r="1.5"/></svg>,
  graph:  () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="8" cy="8" r="2"/><circle cx="3" cy="3" r="1.5"/><circle cx="13" cy="3" r="1.5"/><circle cx="3" cy="13" r="1.5"/><circle cx="13" cy="13" r="1.5"/><path d="m4 4 3 3M12 4 9 7M4 12l3-3M12 12 9 9"/></svg>,
};

// MosaicHeader — image-only tiles. Size encodes record count.
// `pulseTarget`: when set, the rail card with that name gets a 1.4s
// highlight. The mosaic stays a TL;DR; the rail is the decision.
function MosaicHeader({ collabs, onTap = () => {}, hero }) {
  const max = Math.max(...collabs.map(c => c.count || 1));
  // Hand-tuned size-class buckets so the visual rhythm reads well at
  // 6 columns × ~3 rows on mobile.
  const sizeClass = (i, count) => {
    if (hero && i === 0) return 'hero';
    const r = count / max;
    if (r >= 0.85) return 's3 h2';
    if (r >= 0.6)  return 's2 h2';
    if (r >= 0.4)  return 's2';
    if (r >= 0.25) return 'h2';
    return '';
  };
  return (
    <div className="mosaic">
      {collabs.slice(0, 12).map((c, i) => (
        <div className={`mtile ${sizeClass(i, c.count || 1)}`}
             key={c.name}
             title={`${c.name} · ${c.count} records`}
             onClick={() => onTap(c.name)}>
          <Duo3 name={c.name} initials={false}/>
          {c.count > 1 && <div className="mtile-num">×{c.count}</div>}
        </div>
      ))}
    </div>
  );
}

// ConnRow — the spine of the detail page. The card that lets the user
// make an informed tap: who, what they play, the strongest shared
// record, the count, and quick-listen.
function ConnRow({ c, pulse, onClick }) {
  return (
    <div className={`conn ${pulse ? 'pulse' : ''}`} onClick={onClick}>
      <Duo3 name={c.name}/>
      <div>
        <div className="nm">{c.name}</div>
        <div className="role">{c.inst}{c.rel ? ` · ${c.rel}` : ''}</div>
        <div className="why">
          {c.top ? (
            <>
              <span className="top">Most: <span className="t">"{c.top.t}"</span> '{String(c.top.y).slice(-2)}</span>
              <span className="ct">+{c.count - 1} more</span>
            </>
          ) : (
            <span className="rel">{c.rel || 'No record details on file'}</span>
          )}
        </div>
      </div>
      <div className="conn-act">
        <button className="ic" title="Listen on Spotify"><I3.spot/></button>
        <button className="ic" title="Apple Music"><I3.apple/></button>
      </div>
    </div>
  );
}

// EraStrip — sideways serendipity: contemporaries who weren't in their
// bands. A divergence affordance, not a primary path.
function EraStrip({ items }) {
  if (!items?.length) return null;
  return (
    <section className="era">
      <div className="era-h">
        <div>
          <div className="lab">From the same era<b>{items.length}</b></div>
          <div className="blurb">Contemporaries who weren't in their bands — a way to wander sideways.</div>
        </div>
      </div>
      <div className="era-strip">
        {items.map(c => (
          <div className="era-tile" key={c.name}>
            <Duo3 name={c.name}/>
            <div className="body">
              <div className="nm">{c.name}</div>
              <div className="hint">{c.inst} · {c.hint}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RecordsStrip({ records }) {
  if (!records?.length) return null;
  return (
    <>
      <div className="sec-h"><span>Records they shaped</span><em>{records.length} key</em></div>
      <div className="rec-strip">
        {records.map((r, i) => (
          <div className="rec-tile" key={i}>
            <Duo3 name={r.t} initials={false}/>
            <div className="rt">{r.t}</div>
            <div className="rm">{r.a} · {r.label}</div>
            <div className="ry">'{String(r.y).slice(-2)}</div>
          </div>
        ))}
      </div>
    </>
  );
}

// Board3 — themed artboard wrapper. theme = "dark" | "light".
function Board3({ theme = 'dark', desktop = false, children, style }) {
  return (
    <div className="mu3-artboard" data-theme={theme} style={style}>
      <div className="mu3" data-theme={theme} style={{ minHeight: '100%' }}>
        {children}
      </div>
    </div>
  );
}

Object.assign(window, { Duo3, I3, MosaicHeader, ConnRow, EraStrip, RecordsStrip, Board3 });
