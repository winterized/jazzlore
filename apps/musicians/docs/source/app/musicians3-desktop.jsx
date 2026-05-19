/* eslint-disable react/no-unknown-property */
// Jazzlore Musicians · Pass 3 — desktop screens.

// ─── Desktop Home ──────────────────────────────────────────────────────
function DesktopHome({ theme = 'dark' }) {
  return (
    <Board3 theme={theme}>
      <header className="desk-hdr">
        <div className="desk-brand">Jazz<b>lore</b> · Musicians</div>
        <div className="desk-search">
          <I3.search/> Search a musician…
          <span className="kbd">⌘ K</span>
        </div>
        <div className="desk-nav">
          <span className="util">Chords</span>
          <span className="util">Scales</span>
          <span className="util">Musicians</span>
          <button className="ic">{theme === 'dark' ? <I3.moon/> : <I3.sun/>}</button>
        </div>
      </header>

      <div className="desk-home-wrap">
        <section className="home-hero">
          <div className="kicker">— A graph database, edited like a museum guide.</div>
          <h1>Step into a musician.<br/><em>Follow whoever they played with.</em></h1>
          <p className="sub">
            Twelve carefully-chosen starting points. Or, if you'd rather be
            led, three ways to wander.
          </p>
        </section>

        <div className="home-journeys-h">Start a journey</div>
        <div className="journeys">
          <button className="journey">
            <div className="icn">⚄</div>
            <div className="lab">Random jump</div>
            <div className="blb">Drop into any of 1,847 musicians, anywhere on the graph.</div>
          </button>
          <button className="journey">
            <div className="icn">≡</div>
            <div className="lab">Era walk</div>
            <div className="blb">Step through the 1950s, one musician at a time.</div>
          </button>
          <button className="journey">
            <div className="icn">⌘</div>
            <div className="lab">Label walk</div>
            <div className="blb">Follow the Blue Note story, 1955–1966.</div>
          </button>
        </div>

        <div className="home-12-h">
          <span className="lab">Twelve to begin with</span>
          <span className="ct">CURATED · 12</span>
        </div>
        <div className="home-grid">
          {HOME12.map(m => (
            <div className="home-card" key={m.id}>
              <Duo3 name={m.name}/>
              <div className="body">
                <div className="nm">{m.name}</div>
                <div className="ml">{m.inst} · {m.era}</div>
                <div className="hook">{m.hook}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Board3>
  );
}

// ─── Desktop Graph view ────────────────────────────────────────────────
// Static SVG with hand-placed nodes. In production this is force-directed
// (d3-force or similar). The visual idea: center = current musician, edges
// weighted by record count, node radius weighted by record count.

function GraphView({ graph, accent = '#f4a233' }) {
  const c = graph.center;
  return (
    <svg
      className="desk-graph-svg"
      viewBox="0 0 600 500"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* edges from each peripheral node to the center */}
      {graph.nodes.map(n => {
        const sw = Math.max(0.5, Math.min(4, n.w * 0.22));
        const strong = n.w >= 7;
        return (
          <line
            key={n.name + '_edge'}
            className={`gedge ${strong ? 'strong' : ''}`}
            x1={c.x} y1={c.y}
            x2={n.x} y2={n.y}
            strokeWidth={sw}
          />
        );
      })}
      {/* center node */}
      <g className="gnode gnode-center" transform={`translate(${c.x},${c.y})`}>
        <circle r={c.r + 6} fill="none" stroke={accent} strokeWidth="1" opacity="0.4"/>
        <circle r={c.r} fill={accent}/>
        <text className="gnode-label" textAnchor="middle" dy={c.r + 18}>{c.name}</text>
      </g>
      {/* peripheral nodes */}
      {graph.nodes.map(n => {
        const [lo, hi] = duotoneFor(n.name);
        return (
          <g className="gnode" key={n.name} transform={`translate(${n.x},${n.y})`}>
            <circle r={n.r} fill={lo}/>
            <circle r={n.r} fill={hi} opacity="0.55"/>
            <circle r={n.r} fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.4"/>
            <text className="gnode-label" textAnchor="middle" dy={n.r + 14}>{n.name}</text>
            <text className="gnode-sub"   textAnchor="middle" dy={n.r + 26}>{n.inst}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Desktop Detail (split-pane: rail | graph) ─────────────────────────
function DesktopDetail({ m, theme = 'dark', graph }) {
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
            <p>{m.bioLine}
              <a className="more">More about {m.name.split(' ')[0]} →</a>
            </p>
          </div>

          <div className="listen">
            <button className="btn"><I3.spot/> Listen on Spotify</button>
            <button className="btn alt"><I3.apple/> Apple Music</button>
          </div>

          <div className="mosaic-h">
            <span>Orbit</span>
            <span className="legend"><span className="dot"/> size = records together · tap to jump</span>
          </div>
          <MosaicHeader collabs={m.rail} hero/>

          <div className="sec-h">
            <span>Where to go from here</span>
            <em>{m.rail.length}{m.railMore ? ` of ${m.rail.length + m.railMore}` : ''} shown</em>
          </div>
          <div className="rail">
            {m.rail.slice(0, 6).map(c => <ConnRow key={c.name} c={c}/>)}
            {m.railMore > 0 && (
              <div className="conn" style={{ gridTemplateColumns: '1fr', justifyContent: 'center', textAlign: 'center', cursor: 'pointer' }}>
                <div>
                  <div className="nm" style={{ color: 'var(--accent)', fontSize: 13 }}>
                    See all {m.rail.length + m.railMore} collaborators →
                  </div>
                </div>
              </div>
            )}
          </div>

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
          <GraphView graph={graph}/>
          <div className="legend-bottom">
            <span className="lk"><span className="dot"/> Node size = records together</span>
            <span className="lk"><span className="lin"/> Highlighted edge = strong collaboration (≥7 records)</span>
            <span className="lk">Tap any node to re-center →</span>
          </div>
        </section>
      </div>
    </Board3>
  );
}

Object.assign(window, { DesktopHome, DesktopDetail, GraphView });
