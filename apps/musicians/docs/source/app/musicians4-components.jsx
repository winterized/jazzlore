/* eslint-disable react/no-unknown-property */
// Jazzlore Musicians · Pass 4 — components.
// New: MosaicV4 (always-on initials + missing-photo fallback),
//      DenseRow (long-tail row), RadialGraph (deterministic),
//      AttribPhoto, AttribAlbum, ErrorState, MobileDetailV4, DesktopDetailV4.

// Stable string hash → number in [0, 1) for spatial-memory positioning.
function hash01(s) {
  let h = 2166136261;
  s = String(s || '');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

// ── MosaicV4 ────────────────────────────────────────────────────────────
// Always-on subdued corner initials on every tile. When a tile carries
// photo:false the duotone collapses to a muted surface and initials lift
// to centered + large — same component, graceful degradation.
function MosaicV4({ collabs, hero = true, sparse = false }) {
  const max = Math.max(1, ...collabs.map(c => c.count || 1));
  const sizeClass = (i, c) => {
    if (sparse) return c.count >= max ? 's2 h2' : '';
    if (hero && i === 0) return 'hero';
    const r = (c.count || 1) / max;
    if (r >= 0.85) return 's3 h2';
    if (r >= 0.6)  return 's2 h2';
    if (r >= 0.4)  return 's2';
    if (r >= 0.25) return 'h2';
    return '';
  };
  return (
    <div className={`mosaic ${sparse ? 'mosaic-sparse' : ''}`}>
      {collabs.slice(0, 14).map((c, i) => {
        const noPhoto = c.photo === false;
        return (
          <div
            className={`mtile ${sizeClass(i, c)} ${noPhoto ? 'no-photo' : ''}`}
            key={c.name}
            role="link"
            aria-label={`${c.name}${c.inst ? ', ' + c.inst : ''}${c.count ? `, ${c.count} records together` : ''}`}
            title={`${c.name} · ${c.count || 1} record${(c.count || 1) > 1 ? 's' : ''}`}
          >
            <Duo3 name={c.name} initials={false}/>
            <span className="mtile-init" aria-hidden="true">
              {initialsOf(c.name)}
            </span>
            {c.count > 1 && !noPhoto && (
              <div className="mtile-num">×{c.count}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── DenseRow — single-line, smaller portrait, no inline listen ─────────
function DenseRow({ c }) {
  const noPhoto = c.photo === false;
  return (
    <div
      className={`dense-row ${noPhoto ? 'no-photo' : ''}`}
      role="link"
      aria-label={`${c.name}, ${c.inst}${c.top ? `, most ${c.top.t} ${c.top.y}, ${c.count} records together` : ''}`}
    >
      <div className="duo3" style={(() => { const [lo,hi] = duotoneFor(c.name); return { ['--duo-lo']:lo, ['--duo-hi']:hi }; })()}>
        <span className="ini" aria-hidden="true">{initialsOf(c.name)}</span>
      </div>
      <div>
        <div className="dn">{c.name}</div>
        <div className="dm">
          {c.inst.toUpperCase()}{c.top ? ` · ${c.top.t} '${String(c.top.y).slice(-2)}` : ''}
        </div>
      </div>
      <div className="dy" aria-label={`${c.count} records`}>
        ×{c.count}{c.count > 1 ? '' : ''}
      </div>
    </div>
  );
}

// ── AttribPhoto / AttribAlbum — magazine-style captions ────────────────
function AttribPhoto({ name, lines, missing = false }) {
  return (
    <figure className="ident-photo">
      <Duo3 name={name} big/>
      <figcaption>
        {missing ? (
          <span className="attr-missing">No portrait on file — Wikimedia Commons request pending.</span>
        ) : (
          <>
            <span className="a1">{lines.line1}</span>
            <span className="a2">{lines.line2}</span>
          </>
        )}
      </figcaption>
    </figure>
  );
}

function AttribAlbum({ rec, lines }) {
  return (
    <figure className="rec-tile fig">
      <Duo3 name={rec.t} initials={false}/>
      <div className="rt">{rec.t}</div>
      <div className="rm">{rec.a} · {rec.label}</div>
      <div className="ry">'{String(rec.y).slice(-2)}</div>
      <figcaption>
        <b>{lines.line1}</b><br/>
        {lines.line2}
      </figcaption>
    </figure>
  );
}

// ── Radial graph — deterministic, hash-stable, three rings by tier ─────
function radialPosition(name, count, cx, cy) {
  const angle = hash01(name) * Math.PI * 2;
  // ring radii — innermost is strongest collaborators
  const r =
    count >= 7 ? 130 :
    count >= 3 ? 200 :
                  260;
  return {
    x: cx + Math.cos(angle) * r,
    y: cy + Math.sin(angle) * r,
    radius: r,
    nodeR: Math.max(11, Math.min(30, 11 + count * 1.5))
  };
}

function RadialGraph({ name, collabs, accent = '#f4a233', size = 700 }) {
  const cx = size / 2;
  const cy = size / 2;
  return (
    <svg className="desk-graph-svg" viewBox={`0 0 ${size} ${size}`} preserveAspectRatio="xMidYMid meet">
      {/* concentric guide rings — subtle, signal the strength tiering */}
      <circle className="ring" cx={cx} cy={cy} r="130"/>
      <circle className="ring" cx={cx} cy={cy} r="200"/>
      <circle className="ring" cx={cx} cy={cy} r="260"/>
      <text className="ring-label" x={cx + 130 + 4} y={cy - 4} dominantBaseline="middle">7+ records</text>
      <text className="ring-label" x={cx + 200 + 4} y={cy - 4} dominantBaseline="middle">3–6</text>
      <text className="ring-label" x={cx + 260 + 4} y={cy - 4} dominantBaseline="middle">1–2</text>

      {/* edges — drawn first so nodes paint over */}
      {collabs.map(c => {
        const p = radialPosition(c.name, c.count, cx, cy);
        const strong = c.count >= 7;
        const sw = Math.max(0.5, Math.min(3.5, c.count * 0.22));
        return (
          <line
            key={c.name + '_e'}
            className={`gedge ${strong ? 'strong' : ''}`}
            x1={cx} y1={cy}
            x2={p.x} y2={p.y}
            strokeWidth={sw}
          />
        );
      })}

      {/* center node */}
      <g className="gnode gnode-center" transform={`translate(${cx},${cy})`}>
        <circle r="46" fill="none" stroke={accent} strokeWidth="1" opacity="0.32"/>
        <circle r="40" fill={accent}/>
        <text className="gnode-label" textAnchor="middle" dy="20">{name}</text>
      </g>

      {/* peripheral nodes */}
      {collabs.map(c => {
        const p = radialPosition(c.name, c.count, cx, cy);
        const [lo, hi] = duotoneFor(c.name);
        return (
          <g key={c.name} className="gnode" transform={`translate(${p.x},${p.y})`}>
            <circle r={p.nodeR} fill={lo}/>
            <circle r={p.nodeR} fill={hi} opacity="0.5"/>
            <circle r={p.nodeR} fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.4"/>
            <text className="gnode-label" textAnchor="middle" dy={p.nodeR + 14}>{c.name}</text>
            <text className="gnode-sub"   textAnchor="middle" dy={p.nodeR + 26}>{c.inst}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Error state — backend down ─────────────────────────────────────────
function ErrorState({ theme = 'dark' }) {
  return (
    <Board3 theme={theme}>
      <header className="hdr">
        <div className="hdr-row">
          <div className="brand">Jazz<b>lore</b></div>
          <div className="spacer"/>
          <button className="ic">{theme === 'dark' ? <I3.moon/> : <I3.sun/>}</button>
        </div>
      </header>
      <section className="err">
        <div className="err-mark">∿</div>
        <h1>The graph is <em>napping.</em></h1>
        <p>Our Neo4j database is unreachable right now. Nobody's gone anywhere — they're all still here when it wakes up.</p>
        <div className="actions">
          <button className="btn">Try again</button>
          <button className="btn alt">Report this</button>
        </div>
        <div className="meta">checked 12:04:38 UTC · retry in 8s</div>

        <div className="fallback">
          <div className="fallback-h">Or read offline</div>
          <div className="fallback-list">
            <b>Miles Davis</b> · <b>John Coltrane</b> · <b>Bobby Timmons</b> ·
            <b> Bill Evans</b> · <b>Thelonious Monk</b> · cached locally from your
            last visit.
          </div>
        </div>
      </section>
    </Board3>
  );
}

// ── MobileDetailV4 ─────────────────────────────────────────────────────
function MobileDetailV4({ m, theme = 'dark', sparse = false, withAttribution = false, pulseTarget = null }) {
  const headliners = m.rail.slice(0, 16);
  const tail = m.tail || [];
  return (
    <Board3 theme={theme}>
      <header className="hdr">
        <div className="hdr-row">
          <button className="ic ic-back"><I3.chev/></button>
          <div className="crumb">{m.name}</div>
          <div className="spacer"/>
          <button className="ic"><I3.search/></button>
          <button className="ic"><I3.dots/></button>
        </div>
      </header>

      <section className="ident">
        <Duo3 name={m.name}/>
        <div>
          <div className="nm">{m.name}</div>
          <div className="ml">
            <b>{m.primary}</b> · {m.era} · {m.birth.date.slice(-4)}{m.death ? `–${m.death.date.slice(-4)}` : '–present'}
          </div>
          {sparse && m.duplicate && (
            <div className="dupe-flag">⚠︎ Possible duplicate · merge?</div>
          )}
        </div>
      </section>

      {/* Magazine-style photo with attribution caption (only when requested) */}
      {withAttribution && !sparse && (
        <AttribPhoto name={m.name} lines={ATTR_SAMPLES.musician}/>
      )}
      {withAttribution && sparse && (
        <AttribPhoto name={m.name} missing/>
      )}

      <section className="bio">
        {m.bioLine ? (
          <p>{m.bioLine}<a className="more">More about {m.name.split(' ')[0]} →</a></p>
        ) : (
          <div className="sparse-note">
            <b>· Bio not yet written ·</b>
            {m.bioNote}
            {m.duplicate && <div className="dupe-flag">⚠︎ Possible duplicate · help us merge</div>}
          </div>
        )}
      </section>

      <section className="listen">
        <button className="btn"><I3.spot/> Listen on Spotify</button>
        <button className="btn alt"><I3.apple/> Apple Music</button>
      </section>

      <div className="mosaic-h">
        <span>Orbit · who they played with most</span>
        <span className="legend"><span className="dot"/> size = records · initials = name</span>
      </div>
      <MosaicV4 collabs={m.rail} hero={!sparse} sparse={sparse}/>

      <div className="sec-h">
        <span>Where to go from here</span>
        <em>{m.rail.length + (m.tail?.length || 0)} total</em>
      </div>
      <div className="rail">
        {m.rail.length === 0 ? (
          <div className="empty-section">No collaborators on file yet — help us add to this entry.</div>
        ) : (
          headliners.map(c => <ConnRow key={c.name} c={c} pulse={pulseTarget === c.name}/>)
        )}
      </div>

      {tail.length > 0 && (
        <>
          <div className="tier-divider">
            <span className="lab"><b>And {tail.length} more</b> — the long tail</span>
            <span className="ct">DISCOVERY</span>
          </div>
          <div className="tier-blurb">
            Players who appeared on fewer of {m.name.split(' ')[0]}'s records.
            Smaller cards, lighter information — tap any name for the full
            page.
          </div>
          <div className="dense-list">
            {tail.map(c => <DenseRow key={c.name} c={c}/>)}
          </div>
        </>
      )}

      <EraStrip items={m.sameEra}/>

      {/* Records strip — first record gets the magazine attribution treatment */}
      <div className="sec-h"><span>Records they shaped</span><em>{m.records.length} key</em></div>
      <div className="rec-strip">
        {m.records.map((r, i) => (
          i === 0 && withAttribution && r.t === "Moanin'"
            ? <AttribAlbum key={i} rec={r} lines={ATTR_SAMPLES.album}/>
            : (
              <div className="rec-tile" key={i}>
                <Duo3 name={r.t} initials={false}/>
                <div className="rt">{r.t}</div>
                <div className="rm">{r.a} · {r.label}</div>
                <div className="ry">'{String(r.y).slice(-2)}</div>
              </div>
            )
        ))}
      </div>

      <div style={{
        padding: '18px 14px 32px',
        fontFamily: '"Geist Mono", ui-monospace, monospace',
        fontSize: 9.5,
        color: 'var(--dim)',
        letterSpacing: '0.06em',
        lineHeight: 1.55,
      }}>
        Portraits · {withAttribution ? 'attribution rendered per-image, above. ' : 'duotone stand-ins for licensed session photography. '}
        Source · Jazzlore graph · last updated 2026-05.<br/>
        <span style={{ color: 'var(--muted)', cursor: 'pointer' }}>Report a problem ↗</span>
      </div>
    </Board3>
  );
}

// ── DesktopDetailV4 — same composition, radial graph side panel ────────
function DesktopDetailV4({ m, theme = 'dark' }) {
  const all = [...m.rail, ...(m.tail || [])];
  return (
    <Board3 theme={theme}>
      <header className="desk-hdr">
        <div className="desk-brand">Jazz<b>lore</b> · Musicians</div>
        <div className="desk-search">
          <I3.search/> Search a musician…
          <span className="kbd">⌘ K</span>
        </div>
        <div className="desk-nav">
          <span className="util">← Index</span>
          <button className="ic"><I3.dots/></button>
          <button className="ic">{theme === 'dark' ? <I3.moon/> : <I3.sun/>}</button>
        </div>
      </header>

      <div className="desk-detail">
        <section className="desk-rail">
          <div className="ident">
            <Duo3 name={m.name}/>
            <div>
              <div className="nm">{m.name}</div>
              <div className="ml">
                <b>{m.primary}</b> · {m.era} · {m.birth.date.slice(-4)}
                {m.death ? `–${m.death.date.slice(-4)}` : '–present'}
              </div>
            </div>
          </div>
          <div className="bio"><p>{m.bioLine}<a className="more">More about {m.name.split(' ')[0]} →</a></p></div>
          <div className="listen">
            <button className="btn"><I3.spot/> Listen on Spotify</button>
            <button className="btn alt"><I3.apple/> Apple Music</button>
          </div>

          <div className="mosaic-h">
            <span>Orbit</span>
            <span className="legend"><span className="dot"/> tap a tile to jump</span>
          </div>
          <MosaicV4 collabs={m.rail}/>

          <div className="sec-h">
            <span>Where to go from here</span>
            <em>{all.length} total</em>
          </div>
          <div className="rail">
            {m.rail.slice(0, 8).map(c => <ConnRow key={c.name} c={c}/>)}
          </div>

          {m.tail?.length > 0 && (
            <>
              <div className="tier-divider">
                <span className="lab"><b>And {m.tail.length} more</b> — long tail</span>
                <span className="ct">DISCOVERY</span>
              </div>
              <div className="dense-list">
                {m.tail.slice(0, 12).map(c => <DenseRow key={c.name} c={c}/>)}
              </div>
            </>
          )}

          <EraStrip items={m.sameEra}/>

          <RecordsStrip records={m.records}/>
        </section>

        <section className="desk-graph">
          <div className="desk-graph-bar">
            <div className="ttl">Graph view · <b>{m.name}</b> · radial layout</div>
            <div className="ctrls">
              <button title="Zoom out">−</button>
              <button title="Zoom in">+</button>
              <button title="Refit">⤢</button>
              <button className="toggle" title="Toggle layout">●</button>
            </div>
          </div>
          <RadialGraph name={m.name} collabs={all.slice(0, 24)}/>
          <div className="legend-bottom">
            <span className="lk"><span className="dot"/> Node size = records together</span>
            <span className="lk"><span className="lin"/> Inner ring = ≥7 records</span>
            <span className="lk">Deterministic — each musician keeps its angle on re-centre.</span>
          </div>
        </section>
      </div>
    </Board3>
  );
}

Object.assign(window, {
  MosaicV4, DenseRow,
  AttribPhoto, AttribAlbum,
  RadialGraph,
  ErrorState,
  MobileDetailV4,
  DesktopDetailV4,
});
