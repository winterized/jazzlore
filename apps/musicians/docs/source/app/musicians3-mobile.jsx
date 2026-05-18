/* eslint-disable react/no-unknown-property */
// Jazzlore Musicians · Pass 3 — mobile screens.

const { useState } = React;

// ─── Mobile Detail (converged composition) ─────────────────────────────
// Header → identity strip → bio line + listen → image-only mosaic header
// → main ranked rail → "From the same era" → records. Mosaic-tap scrolls
// the matching rail card into view + flashes a soft highlight.
function MobileDetail({ m, theme = 'dark', sparse = false, pulseTarget = null }) {
  const [pulse, setPulse] = useState(pulseTarget);
  // For the static-mock view we accept a `pulseTarget` prop so reviewers
  // can see exactly what the highlight looks like, anchored on a real
  // collaborator from the data.

  const handleMosaicTap = (name) => {
    setPulse(name);
    // In production: scrollIntoView({behavior:'smooth', block:'center'})
    // We don't scroll in the mock so the artboard stays viewable.
  };

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

      <section className="bio">
        {m.bioLine ? (
          <p>
            {m.bioLine}
            <a className="more">More about {m.name.split(' ')[0]} →</a>
          </p>
        ) : (
          <div className="sparse-note">
            <b>· Bio not yet written ·</b>
            {m.bioNote || `We don't yet have a biographical summary for ${m.name}.`}
            {m.duplicate && (
              <div className="dupe-flag">⚠︎ Possible duplicate · help us merge</div>
            )}
          </div>
        )}
      </section>

      <section className="listen">
        <button className="btn"><I3.spot/> Listen on Spotify</button>
        <button className="btn alt"><I3.apple/> Apple Music</button>
      </section>

      {m.rail?.length > 1 ? (
        <>
          <div className="mosaic-h">
            <span>Orbit · who they played with most</span>
            <span className="legend"><span className="dot"/> size = records together</span>
          </div>
          <MosaicHeader collabs={m.rail} hero onTap={handleMosaicTap}/>
        </>
      ) : (
        <div className="mosaic-h">
          <span>Orbit</span>
          <span className="legend">limited data</span>
        </div>
      )}

      <div className="sec-h">
        <span>Where to go from here</span>
        <em>{m.rail.length}{m.railMore ? ` of ${m.rail.length + m.railMore}` : ''}</em>
      </div>
      <div className="rail">
        {m.rail.length === 0 ? (
          <div className="empty-section">No collaborators on file yet. Help us add to this entry.</div>
        ) : (
          m.rail.map(c => (
            <ConnRow key={c.name} c={c} pulse={pulse === c.name}/>
          ))
        )}
        {m.railMore > 0 && (
          <div className="conn" style={{ justifyContent: 'center', textAlign: 'center', cursor: 'pointer', gridTemplateColumns: '1fr' }}>
            <div>
              <div className="nm" style={{ color: 'var(--accent)', fontSize: 13 }}>
                See all {m.rail.length + m.railMore} collaborators →
              </div>
              <div className="role">includes Gil Evans, Joe Zawinul, John McLaughlin, Chick Corea, +3 more</div>
            </div>
          </div>
        )}
      </div>

      <EraStrip items={m.sameEra}/>

      <RecordsStrip records={m.records}/>

      {/* attribution footer for the magazine-grade care promised earlier */}
      <div style={{
        padding: '14px 14px 32px',
        fontFamily: '"Geist Mono", ui-monospace, monospace',
        fontSize: 9.5,
        color: 'var(--dim)',
        letterSpacing: '0.06em',
        lineHeight: 1.5,
      }}>
        Portraits · duotone stand-ins for licensed session photography. <br/>
        Source · Jazzlore graph · last updated 2026-05.<br/>
        <span style={{ color: 'var(--muted)', cursor: 'pointer' }}>Report a problem ↗</span>
      </div>
    </Board3>
  );
}

// ─── Mobile Home (D2 voice, refined visual) ────────────────────────────
function MobileHome({ theme = 'dark' }) {
  return (
    <Board3 theme={theme}>
      <header className="hdr">
        <div className="hdr-row">
          <div className="brand">Jazz<b>lore</b> · Musicians</div>
          <div className="spacer"/>
          <button className="ic">{theme === 'dark' ? <I3.moon/> : <I3.sun/>}</button>
        </div>
      </header>

      <section className="home-hero">
        <div className="kicker">— A graph database, edited like a museum guide.</div>
        <h1>Step into a musician. <em>Follow whoever they played with.</em></h1>
        <p className="sub">
          Twelve carefully-chosen starting points. Or, if you'd rather be led,
          three ways to wander.
        </p>
      </section>

      <div className="home-search">
        <I3.search/>
        <span>Search a musician…</span>
        <span className="kbd">⌘ K</span>
      </div>

      <div className="home-journeys-h">Start a journey</div>
      <div className="journeys">
        <button className="journey">
          <div className="icn">⚄</div>
          <div className="lab">Random jump</div>
          <div className="blb">Drop into any of 1,847 musicians</div>
        </button>
        <button className="journey">
          <div className="icn">≡</div>
          <div className="lab">Era walk</div>
          <div className="blb">Step through the 1950s</div>
        </button>
        <button className="journey">
          <div className="icn">⌘</div>
          <div className="lab">Label walk</div>
          <div className="blb">Follow Blue Note, '55–'66</div>
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
    </Board3>
  );
}

// ─── Autosuggest dropdown ──────────────────────────────────────────────
// Real states: typing "antoi" → 5 hits including accent-folded "Antônio
// Carlos Jobim". The dropdown looks like a continuation of the input,
// not a separate widget.
function Autosuggest({ theme = 'dark' }) {
  const h = SUGGEST_HITS;
  // Render highlighted match: the bit of name that matched the query
  // gets wrapped in <em>.
  const renderHit = (text, q) => {
    const fold = (s) => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    const ql = q.toLowerCase();
    const fl = fold(text);
    const i = fl.indexOf(ql);
    if (i < 0) return text;
    return <>{text.slice(0, i)}<em>{text.slice(i, i + ql.length)}</em>{text.slice(i + ql.length)}</>;
  };

  return (
    <Board3 theme={theme}>
      <header className="hdr">
        <div className="hdr-row">
          <button className="ic ic-back"><I3.chev/></button>
          <div className="crumb">Search</div>
          <div className="spacer"/>
        </div>
      </header>
      <div className="suggest-shell">
        <div className="suggest-input">
          <I3.search/>
          <span className="typed">{h.query}</span>
          <span className="caret"/>
          <span className="clear">esc</span>
        </div>
        <div className="suggest-dropdown">
          {h.hits.map((hit, i) => (
            <div className="suggest-row" key={hit.id}
                 aria-selected={i === 0 ? 'true' : 'false'}>
              <Duo3 name={hit.name}/>
              <div>
                <div className="nm">{renderHit(hit.name, h.query)}</div>
                <div className="meta">{hit.inst.toUpperCase()} · {hit.era}</div>
              </div>
              <div className="tag">{hit.tag}</div>
            </div>
          ))}
          <div className="suggest-foot">
            <span>5 matches · accent-folded</span>
            <span><kbd>↑↓</kbd> navigate &nbsp; <kbd>↵</kbd> open</span>
          </div>
        </div>

        <div className="suggest-fallback-h">
          If you'd typed nothing — <em>popular starts</em>
        </div>
        <div className="suggest-dropdown" style={{ borderColor: 'var(--line)' }}>
          {h.fallback.map((f, i) => (
            <div className="suggest-row" key={f.name}>
              <Duo3 name={f.name}/>
              <div>
                <div className="nm">{f.name}</div>
                <div className="meta">FALLBACK · {f.reason.toUpperCase()}</div>
              </div>
              <div className="tag">→</div>
            </div>
          ))}
          <div className="suggest-foot">
            <span>No "no-results" state · always something to tap.</span>
            <span/>
          </div>
        </div>

        <div style={{
          fontFamily: '"Newsreader", serif',
          fontStyle: 'italic',
          fontSize: 13,
          color: 'var(--muted)',
          padding: '16px 2px 8px',
          lineHeight: 1.5,
          textWrap: 'pretty',
        }}>
          The input and its results read as one component. Typing five
          characters always yields something tappable; the only invariant
          is that the user is never stranded.
        </div>
      </div>
    </Board3>
  );
}

// ─── "More about" expansion ────────────────────────────────────────────
function MoreAbout({ m = BOBBY3, theme = 'dark' }) {
  // Renders the detail screen behind a translucent overlay carrying the
  // full multi-paragraph bio. The overlay is a bottom sheet on mobile.
  return (
    <Board3 theme={theme}>
      <header className="hdr">
        <div className="hdr-row">
          <button className="ic ic-back"><I3.chev/></button>
          <div className="crumb">{m.name}</div>
          <div className="spacer"/>
          <button className="ic"><I3.dots/></button>
        </div>
      </header>

      {/* Dimmed background — render the identity + a glimpse of mosaic */}
      <section className="ident" style={{ opacity: 0.35 }}>
        <Duo3 name={m.name}/>
        <div>
          <div className="nm">{m.name}</div>
          <div className="ml"><b>{m.primary}</b> · {m.era} · {m.birth.date.slice(-4)}{m.death ? `–${m.death.date.slice(-4)}` : '–present'}</div>
        </div>
      </section>
      <section className="bio" style={{ opacity: 0.35 }}>
        <p>{m.bioLine}</p>
      </section>
      <section className="listen" style={{ opacity: 0.35 }}>
        <button className="btn"><I3.spot/> Listen on Spotify</button>
        <button className="btn alt"><I3.apple/> Apple Music</button>
      </section>
      <div style={{ opacity: 0.35 }}>
        <div className="mosaic-h"><span>Orbit · who they played with most</span><span className="legend"><span className="dot"/> size = records</span></div>
        <MosaicHeader collabs={m.rail} hero/>
      </div>

      {/* The overlay sheet */}
      <div className="more-overlay">
        <div className="more-sheet">
          <div className="more-handle"/>
          <div className="more-head">
            <div className="ttl">More about <em>{m.name}</em></div>
            <div className="close">close ×</div>
          </div>
          <div className="more-body">
            {m.bioFull?.map((p, i) => <p key={i}>{p}</p>)}
            <div className="attribution">
              Bio · Jazzlore staff, drawn from Wikipedia, MusicBrainz, and the AAJ archives.<br/>
              Photograph · stand-in for a Francis Wolff session, 1959.
            </div>
          </div>
        </div>
      </div>
    </Board3>
  );
}

Object.assign(window, { MobileDetail, MobileHome, Autosuggest, MoreAbout });
