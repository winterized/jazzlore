// Direction B — "Launcher"
// Tiles look like live app widgets. Each one previews a slice of the actual
// app's interface — chord name + voicing keyboard, scale name + staff, BPM
// reading + tick, graph + selected name. Hover lifts the tile and reveals
// the "open" CTA.

const { themes: _Lth, fonts: _Lft,
  ArrowOut: _LArr, SharedThemeToggle: _LTT,
  ConstellationLarge: _LCL,
  ScaleStaffMini: _LSSm, ChordDotsStaff: _LCD, MetronomeBeatMini: _LMB } = window;

// Tile palette — every tile reads as a surface card on the page.
function widgetPalette(t, dark) {
  return dark ? {
    bg: '#1c1917', fg: '#f5f5f4', mute: '#a8a29e', faint: '#78716c',
    border: '#2a2622',
    duoBg: '#2a2218', duoFg: '#fbbf24',
    cta: '#fbbf24', accentDim: '#7c5b14',
    chip: '#2a2622',
  } : {
    bg: '#ffffff', fg: '#1c1917', mute: '#78716c', faint: '#a8a29e',
    border: '#e7e2d6',
    duoBg: '#f1ece1', duoFg: '#1c1917',
    cta: '#b45309', accentDim: '#e8d3a0',
    chip: '#f5f0e3',
  };
}

function WidgetFrame({ pal, w, h, children, hoverArrow = true }) {
  return (
    <a href="#" className="jzl-tile" style={{
      display: 'block', textDecoration: 'none', color: pal.fg,
      width: w, height: h, background: pal.bg,
      border: `1px solid ${pal.border}`, position: 'relative',
      overflow: 'hidden',
    }}>
      {children}
    </a>
  );
}

function WidgetChrome({ pal, title, sub, big }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: big ? '14px 18px' : '10px 12px',
      borderBottom: `1px solid ${pal.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%', background: pal.cta,
          animation: 'jzl-pulse-soft 2.4s ease-in-out infinite',
        }} />
        <span style={{
          fontFamily: _Lft.mono, fontSize: big ? 11 : 10, letterSpacing: '0.20em',
          color: pal.fg, textTransform: 'uppercase',
        }}>{title}</span>
      </div>
      {sub ? (
        <span style={{
          fontFamily: _Lft.mono, fontSize: big ? 10 : 9, letterSpacing: '0.16em',
          color: pal.faint, textTransform: 'uppercase',
        }}>{sub}</span>
      ) : null}
    </div>
  );
}

function OpenCta({ pal, big }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      fontFamily: _Lft.mono, fontSize: big ? 11 : 10, letterSpacing: '0.20em',
      color: pal.cta, textTransform: 'uppercase', position: 'relative',
    }}>
      Open
      <_LArr size={big ? 11 : 10} />
      <span className="jzl-cta-underline" style={{
        position: 'absolute', bottom: -4, left: 0, height: 1, width: 18,
        background: pal.cta,
      }} />
    </div>
  );
}

// ── Musicians widget (BIG) ────────────────────────────────────────────────
function MusiciansWidget({ dark, w, h }) {
  const pal = widgetPalette(null, dark);
  const big = w >= 600;
  return (
    <WidgetFrame pal={pal} w={w} h={h}>
      <WidgetChrome pal={pal} big={big}
        title="Musicians"
        sub={`musicians.jazzlore.com`} />

      {/* The "live" graph */}
      <div style={{ position: 'relative', height: big ? h - 220 : h - 180 }}>
        <div style={{
          position: 'absolute', inset: big ? '20px 36px' : '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <_LCL t={{ duoBg: pal.duoBg, duoFg: pal.duoFg }}
            width={big ? 640 : 320} height={big ? 340 : 200} dense={big} />
        </div>
        {/* Miles is labelled inside the SVG; no separate chip needed. */}
      </div>

      {/* Bottom block — headline + stats + CTA */}
      <div style={{
        position: 'absolute', left: big ? 18 : 12, right: big ? 18 : 12,
        bottom: big ? 18 : 12,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        gap: 16,
      }}>
        <div>
          <h2 style={{
            fontFamily: _Lft.serif, fontWeight: 400, fontSize: big ? 44 : 28,
            lineHeight: 1.0, letterSpacing: '-0.022em', margin: 0,
            color: pal.fg,
          }}>
            Who played with whom.
          </h2>
          <div style={{
            marginTop: big ? 10 : 6, display: 'flex', gap: big ? 22 : 12, flexWrap: 'wrap',
            fontFamily: _Lft.mono, fontSize: big ? 11 : 9.5, letterSpacing: '0.14em',
            color: pal.mute, textTransform: 'uppercase',
          }}>
            <span><span style={{ color: pal.fg }}>12,847</span> musicians</span>
            <span><span style={{ color: pal.fg }}>84k</span> sessions</span>
            <span><span style={{ color: pal.fg }}>1917–2024</span></span>
          </div>
        </div>
        <OpenCta pal={pal} big={big} />
      </div>
    </WidgetFrame>
  );
}

// ── Scales widget ─────────────────────────────────────────────────────────
function ScalesWidget({ dark, w, h, showSub = true }) {
  const pal = widgetPalette(null, dark);
  const big = w >= 380;
  const sub = showSub ? (big ? 'scales.jazzlore.com' : null) : null;
  return (
    <WidgetFrame pal={pal} w={w} h={h}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <WidgetChrome pal={pal} big={big} title="Scales" sub={sub} />
        {/* Body — flex column so nothing overlaps */}
        <div style={{
          flex: '1 1 auto', minHeight: 0,
          padding: big ? '12px 18px 14px' : '8px 12px 10px',
          display: 'flex', flexDirection: 'column', gap: big ? 8 : 6,
        }}>
          {/* Title block */}
          <div>
            <div style={{
              fontFamily: _Lft.serif, fontWeight: 400, fontStyle: 'italic',
              fontSize: big ? 24 : 15,
              lineHeight: 1.0, letterSpacing: '-0.018em', color: pal.fg,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {big ? 'Lydian Dominant' : 'Lydian Dom.'}
            </div>
            {big ? (
              <div style={{
                marginTop: 4,
                fontFamily: _Lft.mono, fontSize: 10, letterSpacing: '0.14em',
                color: pal.mute, textTransform: 'uppercase',
              }}>
                C · Mixolydian ♯11
              </div>
            ) : null}
          </div>
          {/* Staff strip — flex 1 fills remaining space */}
          <div style={{
            flex: '1 1 auto', minHeight: big ? 44 : 28,
            background: pal.duoBg, position: 'relative',
            padding: big ? '6px 12px' : '4px 8px',
            display: 'flex', alignItems: 'center',
          }}>
            <_LSSm t={{ duoBg: pal.duoBg, duoFg: pal.duoFg }}
              width={big ? 300 : 70} height={big ? 40 : 24} />
            <div style={{
              position: 'absolute', right: big ? 12 : 8, top: '50%',
              transform: 'translateY(-50%)',
              width: big ? 18 : 12, height: big ? 18 : 12, borderRadius: '50%',
              background: pal.cta,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'jzl-pulse-soft 1.6s ease-in-out infinite',
            }}>
              <span style={{ color: pal.bg, fontSize: big ? 9 : 6, marginLeft: 1 }}>▶</span>
            </div>
          </div>
          {/* Bottom row */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            {big ? (
              <span style={{
                fontFamily: _Lft.mono, fontSize: 10, letterSpacing: '0.14em',
                color: pal.mute, textTransform: 'uppercase',
              }}>38 modes · notation · audio</span>
            ) : <span />}
            <OpenCta pal={pal} big={big} />
          </div>
        </div>
      </div>
    </WidgetFrame>
  );
}

// ── Chords widget ─────────────────────────────────────────────────────────
function ChordsWidget({ dark, w, h, showSub = true }) {
  const pal = widgetPalette(null, dark);
  const big = w >= 380;
  const sub = showSub ? (big ? 'chords.jazzlore.com' : null) : null;
  return (
    <WidgetFrame pal={pal} w={w} h={h}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <WidgetChrome pal={pal} big={big} title="Chords" sub={sub} />
        <div style={{
          flex: '1 1 auto', minHeight: 0,
          padding: big ? '12px 18px 14px' : '8px 12px 10px',
          display: 'flex', flexDirection: 'column', gap: big ? 8 : 6,
        }}>
          {/* Title block */}
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: big ? 14 : 8,
            flexWrap: 'nowrap',
          }}>
            <div style={{
              fontFamily: _Lft.serif, fontWeight: 400, fontSize: big ? 30 : 19,
              lineHeight: 1.0, letterSpacing: '-0.02em', color: pal.fg,
              whiteSpace: 'nowrap',
            }}>
              C<span style={{ color: pal.cta }}>m</span>7<span style={{ fontSize: '0.7em' }}>♭5</span>
            </div>
            {big ? (
              <div style={{
                fontFamily: _Lft.serif, fontStyle: 'italic',
                fontSize: 15, color: pal.mute, whiteSpace: 'nowrap',
              }}>
                half-diminished
              </div>
            ) : null}
          </div>
          {/* Dots-on-staff strip — the chords.jazzlore.com visual style */}
          <div style={{
            flex: '1 1 auto', minHeight: big ? 48 : 30,
            display: 'flex', alignItems: 'center',
          }}>
            <_LCD t={{ duoBg: pal.duoBg, duoFg: pal.duoFg }}
              width={big ? 354 : 80} height={big ? 56 : 36} compact={!big} />
          </div>
          {/* Bottom row */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            {big ? (
              <span style={{
                fontFamily: _Lft.mono, fontSize: 10, letterSpacing: '0.14em',
                color: pal.mute, textTransform: 'uppercase',
              }}>voicings · two notations</span>
            ) : <span />}
            <OpenCta pal={pal} big={big} />
          </div>
        </div>
      </div>
    </WidgetFrame>
  );
}

// ── Metronome widget ──────────────────────────────────────────────────────
function MetronomeWidget({ dark, w, h, showSub = true }) {
  const pal = widgetPalette(null, dark);
  const big = w >= 380;
  const sub = showSub ? (big ? 'metronome.jazzlore.com' : null) : null;
  return (
    <WidgetFrame pal={pal} w={w} h={h}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <WidgetChrome pal={pal} big={big} title="Metronome" sub={sub} />
        <div style={{
          flex: '1 1 auto', minHeight: 0,
          padding: big ? '10px 18px 12px' : '8px 12px 10px',
          display: 'flex', flexDirection: 'column', gap: big ? 6 : 4,
        }}>
          {/* Reading + pendulum */}
          <div style={{
            flex: '1 1 auto', minHeight: 0,
            display: 'flex', alignItems: 'center', gap: big ? 16 : 8,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: big ? 6 : 3 }}>
              <div style={{
                display: 'flex', alignItems: 'baseline', gap: 8,
                fontFamily: _Lft.serif, fontWeight: 400,
                lineHeight: 0.9, letterSpacing: '-0.025em', color: pal.fg,
              }}>
                <span style={{ fontSize: big ? 56 : 32 }}>96</span>
                <span style={{
                  fontFamily: _Lft.mono, fontSize: big ? 11 : 8.5,
                  letterSpacing: '0.18em', color: pal.mute, textTransform: 'uppercase',
                }}>bpm</span>
              </div>
              <div style={{
                fontFamily: _Lft.mono, fontSize: big ? 11 : 8.5,
                letterSpacing: '0.16em', color: pal.mute, textTransform: 'uppercase',
                display: 'flex', gap: big ? 12 : 6, alignItems: 'center',
              }}>
                <span>4/4</span>
                {big ? (
                  <>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: pal.faint }} />
                    <span>♩ stable</span>
                  </>
                ) : null}
              </div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <_LMB t={{ duoBg: pal.duoBg, duoFg: pal.duoFg }} size={big ? 96 : 60} />
            </div>
          </div>
          {/* Beat dots + Open */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ display: 'flex', gap: big ? 8 : 5 }}>
              {[0, 1, 2, 3].map(i => (
                <span key={i} style={{
                  width: big ? 9 : 6, height: big ? 9 : 6, borderRadius: '50%',
                  background: pal.duoFg,
                  animation: `jzl-tick 1.2s steps(2, end) infinite`,
                  animationDelay: `${i * 0.3}s`,
                }} />
              ))}
            </div>
            <OpenCta pal={pal} big={big} />
          </div>
        </div>
      </div>
    </WidgetFrame>
  );
}

// ── About overlay — full personal note, behind the ABOUT link ─────────────
function AboutOverlay({ open, onClose, t, big }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'rgba(10,8,6,0.55)', backdropFilter: 'blur(2px)',
      display: 'flex', alignItems: big ? 'center' : 'flex-end',
      justifyContent: 'center', cursor: 'pointer',
      animation: 'jzl-fade-loop 0.3s ease-out',
      animationIterationCount: 1, animationDirection: 'normal',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: t.bg, color: t.ink,
        border: `1px solid ${t.rule}`,
        padding: big ? '52px 56px 44px' : '32px 24px 28px',
        maxWidth: big ? 640 : '100%',
        width: big ? '60%' : '100%',
        position: 'relative', cursor: 'default',
        boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
      }}>
        <button onClick={onClose} aria-label="Close" style={{
          position: 'absolute', top: big ? 18 : 12, right: big ? 18 : 12,
          width: 28, height: 28, padding: 0,
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: t.muted, fontFamily: _Lft.mono, fontSize: 22, lineHeight: 1,
        }}>×</button>
        <div style={{
          fontFamily: _Lft.mono, fontSize: 10.5, color: t.muted,
          letterSpacing: '0.24em', textTransform: 'uppercase',
          marginBottom: big ? 24 : 18,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.accent }} />
          About
        </div>
        <p style={{
          fontFamily: _Lft.serif, fontSize: big ? 22 : 17,
          lineHeight: 1.55, color: t.ink, margin: 0,
          letterSpacing: '-0.005em',
        }}>
          I built these tools for myself, for my practice as an amateur,
          not-very-good jazz pianist. <span style={{ fontStyle: 'italic', color: t.accent }}>Musicians is different</span>
          {' '}— it's an exploration device I'd wanted to build for a long time,
          because I believe human relationships are the core of jazz, as they
          are of many things in life.
        </p>
        <p style={{
          fontFamily: _Lft.serif, fontStyle: 'italic',
          fontSize: big ? 18 : 14.5, lineHeight: 1.55,
          color: t.muted, margin: big ? '20px 0 0' : '14px 0 0',
        }}>
          This is personal; it doesn't aspire to be the right fit for everyone.
        </p>
      </div>
    </div>
  );
}

// ── Wordmark / header utilities (lighter than Gallery's) ─────────────────
function HeaderRow({ t, dark, big, onAboutClick }) {
  return (
    <header style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: big ? '28px 56px 0' : '18px 20px 0',
    }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 10,
        fontFamily: _Lft.serif, fontSize: big ? 22 : 18, fontWeight: 500,
        color: t.ink, letterSpacing: '-0.012em',
      }}>
        <span style={{
          width: big ? 10 : 8, height: big ? 10 : 8, borderRadius: '50%',
          background: t.accent, display: 'inline-block', alignSelf: 'center',
        }} />
        <span>Jazzlore</span>
        <span style={{
          marginLeft: big ? 12 : 8,
          fontFamily: _Lft.mono, fontSize: big ? 10 : 9, color: t.faint,
          letterSpacing: '0.20em', textTransform: 'uppercase',
        }}>
          a workbench
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: big ? 28 : 16 }}>
        <button onClick={onAboutClick} style={{
          background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
          fontFamily: _Lft.mono, fontSize: big ? 11 : 10, color: t.muted,
          letterSpacing: '0.18em', textTransform: 'uppercase',
        }}>About</button>
        <_LTT t={t} dark={dark} />
      </div>
    </header>
  );
}

// ── Desktop Launcher ─────────────────────────────────────────────────────
function LauncherDesktop({ dark = false }) {
  const t = dark ? _Lth.dark : _Lth.light;
  const [aboutOpen, setAboutOpen] = React.useState(false);
  return (
    <div style={{
      width: 1280, height: 800, background: t.bg, color: t.ink,
      fontFamily: _Lft.sans, position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      <HeaderRow t={t} dark={dark} big onAboutClick={() => setAboutOpen(true)} />

      {/* Plain explanation — utilitarian; the personal "why" lives in About */}
      <div style={{
        padding: '14px 56px 18px',
        fontFamily: _Lft.sans, fontSize: 15.5,
        color: t.muted, maxWidth: 800, letterSpacing: '-0.005em',
      }}>
        A jazz musician's workbench — explore who played with whom,
        and practise with scales, chords, and a metronome.
      </div>

      {/* The grid */}
      <div style={{
        flex: 1, padding: '0 56px 28px',
        display: 'grid', gridTemplateColumns: '720px 1fr', gap: 16,
        minHeight: 0,
      }}>
        <MusiciansWidget dark={dark} w={720} h={620} />
        <div style={{ display: 'grid', gridTemplateRows: 'repeat(3, 1fr)', gap: 16 }}>
          <ScalesWidget dark={dark} w={392} h={196} />
          <ChordsWidget dark={dark} w={392} h={196} />
          <MetronomeWidget dark={dark} w={392} h={196} />
        </div>
      </div>

      <footer style={{
        padding: '0 56px 18px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontFamily: _Lft.mono, fontSize: 10, letterSpacing: '0.16em',
        color: t.faint, textTransform: 'uppercase',
      }}>
        <div>jazzlore.com · mmxxvi</div>
        <div style={{ display: 'flex', gap: 22 }}>
          <a href="#" style={{ color: t.faint, textDecoration: 'none' }}>Source</a>
          <a href="#" style={{ color: t.faint, textDecoration: 'none' }}>Colophon</a>
        </div>
      </footer>

      <AboutOverlay open={aboutOpen} onClose={() => setAboutOpen(false)} t={t} big />
    </div>
  );
}

// ── Mobile Launcher ──────────────────────────────────────────────────────
function LauncherMobile({ dark = false }) {
  const t = dark ? _Lth.dark : _Lth.light;
  const [aboutOpen, setAboutOpen] = React.useState(false);
  return (
    <div style={{
      width: 390, height: 844, background: t.bg, color: t.ink,
      fontFamily: _Lft.sans, position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      <HeaderRow t={t} dark={dark} onAboutClick={() => setAboutOpen(true)} />

      <div style={{
        padding: '10px 20px 14px',
        fontFamily: _Lft.sans, fontSize: 13.5,
        color: t.muted, lineHeight: 1.45, letterSpacing: '-0.005em',
      }}>
        A jazz musician's workbench — explore who played with whom,
        and practise with scales, chords, and a metronome.
      </div>

      <div style={{ flex: 1, padding: '0 20px 16px', minHeight: 0,
        display: 'flex', flexDirection: 'column', gap: 10 }}>
        <MusiciansWidget dark={dark} w={350} h={420} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          <ScalesWidget    dark={dark} w={111} h={158} showSub={false} />
          <ChordsWidget    dark={dark} w={111} h={158} showSub={false} />
          <MetronomeWidget dark={dark} w={111} h={158} showSub={false} />
        </div>
      </div>

      <footer style={{
        padding: '0 20px 14px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontFamily: _Lft.mono, fontSize: 9, letterSpacing: '0.14em',
        color: t.faint, textTransform: 'uppercase',
      }}>
        <div>jazzlore · mmxxvi</div>
        <div>Source · Colophon</div>
      </footer>

      <AboutOverlay open={aboutOpen} onClose={() => setAboutOpen(false)} t={t} />
    </div>
  );
}

Object.assign(window, { LauncherDesktop, LauncherMobile });
