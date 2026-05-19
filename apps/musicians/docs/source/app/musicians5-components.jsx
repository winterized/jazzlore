/* eslint-disable react/no-unknown-property */
// Jazzlore Musicians · Pass 5 — final components.
// MobileDetailV5: 16 headliners + "Show all N →" expansion CTA; expanded
// state loads the long tail inline as fat cards (no density downgrade).
// DesktopDetailV5: reverts to the pass-3 force-directed GraphView.

function MobileDetailV5({ m, theme = 'dark', sparse = false, withAttribution = false, expanded = false, pulseTarget = null }) {
  const HEADLINER_CAP = 16;
  const all = [...m.rail, ...(m.tail || [])];
  const headliners = all.slice(0, HEADLINER_CAP);
  const longtail   = all.slice(HEADLINER_CAP);
  const showCTA    = !expanded && longtail.length > 0;

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

      {withAttribution && !sparse && <AttribPhoto name={m.name} lines={ATTR_SAMPLES.musician}/>}
      {withAttribution && sparse && <AttribPhoto name={m.name} missing/>}

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
        <em>
          {expanded
            ? `${all.length} total`
            : (longtail.length > 0
                ? `${Math.min(HEADLINER_CAP, all.length)} of ${all.length}`
                : `${all.length} total`)}
        </em>
      </div>
      <div className="rail">
        {all.length === 0 ? (
          <div className="empty-section">No collaborators on file yet — help us add to this entry.</div>
        ) : (
          headliners.map(c => <ConnRow key={c.name} c={c} pulse={pulseTarget === c.name}/>)
        )}

        {expanded && longtail.length > 0 && (
          <>
            <div className="tail-marker">
              <span className="lab"><b>The rest</b> — every other player on a {m.name.split(' ')[0]} record</span>
              <span className="ct">{longtail.length} MORE</span>
            </div>
            {longtail.map(c => <ConnRow key={c.name} c={c}/>)}
          </>
        )}
      </div>

      {showCTA && (
        <button className="conn-expand" aria-expanded="false" aria-label={`Show all ${all.length} collaborators`}>
          <span>
            Show all {all.length} collaborators
            <span className="sub">{longtail.length} more, including {longtail.slice(0,3).map(c => c.name.split(' ').pop()).join(', ')} and {longtail.length - 3} others</span>
          </span>
          <span className="arrow">↓</span>
        </button>
      )}

      <EraStrip items={m.sameEra}/>

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

// DesktopDetailV5 — same composition; reverts to pass-3 force-directed
// graph for the alive, organic register the user asked for.
function DesktopDetailV5({ m, theme = 'dark', graph }) {
  const all = [...m.rail, ...(m.tail || [])];
  const HEADLINER_CAP = 8;
  const headliners = all.slice(0, HEADLINER_CAP);
  const longtail   = all.slice(HEADLINER_CAP);
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
          <div className="bio">
            <p>{m.bioLine}<a className="more">More about {m.name.split(' ')[0]} →</a></p>
          </div>
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
            <em>{Math.min(HEADLINER_CAP, all.length)} of {all.length}</em>
          </div>
          <div className="rail">
            {headliners.map(c => <ConnRow key={c.name} c={c}/>)}
          </div>

          {longtail.length > 0 && (
            <button className="conn-expand" aria-expanded="false">
              <span>
                Show all {all.length} collaborators
                <span className="sub">{longtail.length} more</span>
              </span>
              <span className="arrow">↓</span>
            </button>
          )}

          <EraStrip items={m.sameEra}/>
          <RecordsStrip records={m.records}/>
        </section>

        <section className="desk-graph">
          <div className="desk-graph-bar">
            <div className="ttl">Graph view · <b>{m.name}</b></div>
            <div className="ctrls">
              <button title="Zoom out">−</button>
              <button title="Zoom in">+</button>
              <button title="Refit">⤢</button>
              <button className="toggle" title="Toggle layout">●</button>
            </div>
          </div>
          {/* Force-directed (pass-3 GraphView, hand-placed positions) */}
          <GraphView graph={graph}/>
          <div className="legend-bottom">
            <span className="lk"><span className="dot"/> Node size = records together</span>
            <span className="lk"><span className="lin"/> Heavier edge = stronger collaboration</span>
            <span className="lk">Click a node to re-centre.</span>
          </div>
        </section>
      </div>
    </Board3>
  );
}

Object.assign(window, { MobileDetailV5, DesktopDetailV5 });
