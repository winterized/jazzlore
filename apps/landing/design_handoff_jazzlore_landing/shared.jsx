// Shared design tokens, marks, and motion primitives for the Jazzlore gate.
// Two directions (Gallery + Launcher) reuse this layer.

const themes = {
  light: {
    bg: '#faf8f4',           // warm near-white
    bgAlt: '#f1ece1',
    surface: '#ffffff',
    ink: '#1c1917',          // stone-900
    inkSoft: '#3f3a36',
    muted: '#78716c',        // stone-500
    faint: '#a8a29e',
    rule: '#e7e2d6',
    accent: '#b45309',       // amber-700
    accentSoft: '#92400e',
    duoBg: '#e8d3a0',        // amber wash for tiles
    duoBgAlt: '#1c1917',     // ink tile bg
    duoFg: '#1c1917',
    duoFgInv: '#faf8f4',
    glow: 'rgba(180,83,9,0.20)',
  },
  dark: {
    bg: '#0e0c0a',
    bgAlt: '#161311',
    surface: '#1c1917',
    ink: '#f5f5f4',
    inkSoft: '#d6d3d1',
    muted: '#a8a29e',
    faint: '#78716c',
    rule: '#2a2622',
    accent: '#fbbf24',
    accentSoft: '#f59e0b',
    duoBg: '#2a2218',
    duoBgAlt: '#fbbf24',
    duoFg: '#fbbf24',
    duoFgInv: '#1c1917',
    glow: 'rgba(251,191,36,0.25)',
  },
};

const fonts = {
  sans: '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  mono: '"Geist Mono", ui-monospace, "SF Mono", Menlo, monospace',
  serif: '"Newsreader", "Iowan Old Style", "Georgia", serif',
};

// ── Global keyframes — injected once ─────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('jzl-anims')) {
  const s = document.createElement('style');
  s.id = 'jzl-anims';
  s.textContent = `
    @keyframes jzl-pulse {
      0%, 100% { transform: scale(1); opacity: 0.95; }
      50% { transform: scale(1.35); opacity: 1; }
    }
    @keyframes jzl-pulse-2 {
      0%, 100% { transform: scale(1); opacity: 0.85; }
      50% { transform: scale(1.25); opacity: 1; }
    }
    @keyframes jzl-pulse-soft {
      0%, 100% { opacity: 0.55; }
      50% { opacity: 1; }
    }
    @keyframes jzl-sweep {
      0% { transform: translateX(-20%); opacity: 0; }
      8% { opacity: 1; }
      92% { opacity: 1; }
      100% { transform: translateX(120%); opacity: 0; }
    }
    @keyframes jzl-swing {
      0%, 100% { transform: rotate(-22deg); }
      50% { transform: rotate(22deg); }
    }
    @keyframes jzl-tick {
      0%, 49% { opacity: 1; transform: scale(1.15); }
      50%, 100% { opacity: 0.45; transform: scale(1); }
    }
    @keyframes jzl-key-press {
      0%, 90%, 100% { transform: translateY(0); }
      45%, 55% { transform: translateY(3px); }
    }
    @keyframes jzl-fade-loop {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 1; }
    }
    @keyframes jzl-edge-draw {
      0% { stroke-dashoffset: 100; }
      100% { stroke-dashoffset: 0; }
    }
    /* Tile lift on hover */
    .jzl-tile { transition: transform .35s cubic-bezier(.2,.7,.3,1), box-shadow .35s ease, filter .35s ease; }
    .jzl-tile:hover { transform: translateY(-3px); }
    .jzl-tile .jzl-arrow { transition: transform .35s cubic-bezier(.2,.7,.3,1); }
    .jzl-tile:hover .jzl-arrow { transform: translate(4px,-4px); }
    .jzl-tile .jzl-cta-underline { transition: width .35s cubic-bezier(.2,.7,.3,1); }
    .jzl-tile:hover .jzl-cta-underline { width: 100% !important; }
  `;
  document.head.appendChild(s);
}

// ── External-link arrow ──────────────────────────────────────────────────
function ArrowOut({ size = 12, stroke = 1.2 }) {
  return (
    <svg viewBox="0 0 12 12" width={size} height={size} className="jzl-arrow"
      style={{ display: 'inline-block', flex: 'none' }}>
      <path d="M3 9 L9 3 M4 3 H9 V8"
        fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="square" />
    </svg>
  );
}

// ── Theme dot ────────────────────────────────────────────────────────────
// ── Theme toggle — visual stand-in for the shared <ThemeToggle> from
// packages/ui (sun/moon icon button). Build-time TODO: replace this with
// the real shared component so a click round-trips to the app's theme
// store like the four apps do.
function SharedThemeToggle({ t, dark }) {
  const sz = 32;
  return (
    <button aria-label={`Switch to ${dark ? 'light' : 'dark'} theme`}
      style={{
        width: sz, height: sz, padding: 0,
        background: 'transparent',
        border: `1px solid ${t.rule}`,
        borderRadius: 8,
        cursor: 'pointer',
        color: t.ink,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        transition: 'border-color .15s, background .15s',
      }}>
      {dark ? (
        // Sun
        <svg viewBox="0 0 16 16" width={15} height={15}>
          <circle cx="8" cy="8" r="2.8" fill="currentColor" />
          <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
            <line x1="8" y1="1.5" x2="8" y2="3" />
            <line x1="8" y1="13" x2="8" y2="14.5" />
            <line x1="1.5" y1="8" x2="3" y2="8" />
            <line x1="13" y1="8" x2="14.5" y2="8" />
            <line x1="3.4" y1="3.4" x2="4.5" y2="4.5" />
            <line x1="11.5" y1="11.5" x2="12.6" y2="12.6" />
            <line x1="3.4" y1="12.6" x2="4.5" y2="11.5" />
            <line x1="11.5" y1="4.5" x2="12.6" y2="3.4" />
          </g>
        </svg>
      ) : (
        // Moon — circle masked by an offset circle for the crescent
        <svg viewBox="0 0 16 16" width={15} height={15}>
          <defs>
            <mask id={`m-${dark ? 'd' : 'l'}-moon`}>
              <rect width="16" height="16" fill="white" />
              <circle cx="11" cy="5.5" r="5.2" fill="black" />
            </mask>
          </defs>
          <circle cx="8" cy="8" r="6" fill="currentColor"
            mask={`url(#m-${dark ? 'd' : 'l'}-moon)`} />
        </svg>
      )}
    </button>
  );
}

function ThemeDot({ t, dark }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      fontFamily: fonts.mono, fontSize: 10.5, color: t.muted, letterSpacing: '0.16em',
      textTransform: 'uppercase',
    }}>
      <span style={{
        width: 11, height: 11, borderRadius: '50%',
        background: `linear-gradient(135deg, ${dark ? '#fbbf24' : '#1c1917'} 50%, ${dark ? '#1c1917' : '#faf8f4'} 50%)`,
        border: `1px solid ${t.rule}`,
      }} />
      <span>{dark ? 'dark' : 'light'}</span>
    </div>
  );
}

// ── Big Constellation — for Musicians, large format ──────────────────────
// Centered on Miles Davis + the First Great Quintet (1955–58):
//   Miles · John Coltrane · Red Garland · Paul Chambers · Philly Joe Jones.
// Surrounding anonymous nodes give the "wider network" feel; the 5 named
// nodes carry labels so the tile reads as who-played-with-whom, not dots.
function ConstellationLarge({ t, width = 660, height = 380, dense = true, labelScale = 1 }) {
  // Quintet (indices 0–4). Hero = Miles, soft halo on other 4.
  const Q = [
    { x: 0.42, y: 0.50, r: 12, hero: true, name: 'Miles Davis',     lp: 'right' },
    { x: 0.22, y: 0.18, r: 8,                 name: 'John Coltrane',   lp: 'top' },
    { x: 0.66, y: 0.20, r: 8,                 name: 'Red Garland',     lp: 'right' },
    { x: 0.74, y: 0.78, r: 8,                 name: 'Paul Chambers',   lp: 'bottom' },
    { x: 0.18, y: 0.78, r: 8,                 name: 'Philly Joe Jones',lp: 'bottom' },
  ];
  // Anonymous nodes (indices 5–15) — graph density
  const A = [
    { x: 0.07, y: 0.40, r: 4 },
    { x: 0.05, y: 0.62, r: 3 },
    { x: 0.78, y: 0.52, r: 5 },
    { x: 0.91, y: 0.34, r: 3 },
    { x: 0.55, y: 0.94, r: 3 },
    { x: 0.40, y: 0.93, r: 3 },
    { x: 0.94, y: 0.66, r: 4 },
    { x: 0.86, y: 0.08, r: 2 },
    { x: 0.42, y: 0.06, r: 3 },
    { x: 0.30, y: 0.40, r: 3 },
    { x: 0.54, y: 0.34, r: 3 },
  ];
  const N = [...Q, ...A];
  // Strong: Miles ↔ each quintet member.
  const strong = [[0,1],[0,2],[0,3],[0,4]];
  // Medium: among quintet + quintet to nearby anonymous.
  const medium = [
    [1,2],[1,4],[2,3],[3,4],
    [0,15],[1,13],[2,8],[3,7],[4,6],
  ];
  // Faint: anonymous + secondary connections.
  const faint = dense ? [
    [5,6],[5,14],[7,11],[7,12],[8,12],[9,10],
    [9,11],[10,4],[13,1],[13,2],[15,7],[14,0],[6,4],
  ] : [];
  const allEdges = [
    ...strong.map(e => ({ e, op: 0.65, w: 1.0 })),
    ...medium.map(e => ({ e, op: 0.35, w: 0.8 })),
    ...faint.map(e => ({ e, op: 0.15, w: 0.6 })),
  ];
  const px = (n) => n.x * width;
  const py = (n) => n.y * height;
  const labelSize = 10.5 * labelScale;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height}
      style={{ display: 'block' }}>
      {allEdges.map(({ e, op, w }, i) => (
        <line key={'e'+i}
          x1={px(N[e[0]])} y1={py(N[e[0]])}
          x2={px(N[e[1]])} y2={py(N[e[1]])}
          stroke={t.duoFg} strokeOpacity={op} strokeWidth={w} />
      ))}
      {/* Nodes — halo behind, dot on top */}
      {N.map((n, i) => (
        <g key={'n'+i}>
          <circle cx={px(n)} cy={py(n)} r={n.r + (i < 5 ? 6 : 4)}
            fill={t.duoBg} opacity={i < 5 ? 0.95 : 0.7} />
          <circle cx={px(n)} cy={py(n)} r={n.r}
            fill={t.duoFg}
            style={n.hero ? {
              transformOrigin: `${px(n)}px ${py(n)}px`,
              animation: 'jzl-pulse-2 2.4s ease-in-out infinite',
            } : undefined} />
        </g>
      ))}
      {/* Named labels for the quintet */}
      {Q.map((n, i) => {
        const cx = px(n), cy = py(n);
        let lx = cx, ly = cy, anchor = 'start';
        const offset = n.r + 10;
        if (n.lp === 'right')  { lx = cx + offset; ly = cy + labelSize/3; anchor = 'start'; }
        if (n.lp === 'left')   { lx = cx - offset; ly = cy + labelSize/3; anchor = 'end'; }
        if (n.lp === 'top')    { lx = cx;          ly = cy - offset - 2;  anchor = 'middle'; }
        if (n.lp === 'bottom') { lx = cx;          ly = cy + offset + labelSize; anchor = 'middle'; }
        return (
          <text key={'l'+i} x={lx} y={ly}
            fontFamily={fonts.mono} fontSize={labelSize}
            fill={t.duoFg} opacity={n.hero ? 0.95 : 0.78}
            letterSpacing="0.04em" textAnchor={anchor}>
            {n.name}
          </text>
        );
      })}
    </svg>
  );
}

// ── Compact constellation — for small tiles ───────────────────────────────
function ConstellationSmall({ t, width = 200, height = 120 }) {
  const N = [
    { x: 0.18, y: 0.40, r: 6, hero: true },
    { x: 0.36, y: 0.20, r: 3 },
    { x: 0.48, y: 0.62, r: 4 },
    { x: 0.62, y: 0.32, r: 3 },
    { x: 0.78, y: 0.56, r: 5 },
    { x: 0.32, y: 0.80, r: 3 },
    { x: 0.86, y: 0.20, r: 2 },
  ];
  const E = [[0,1],[0,2],[1,3],[2,3],[3,4],[2,5],[4,6]];
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} style={{ display: 'block' }}>
      {E.map(([a,b], i) => (
        <line key={i} x1={N[a].x*width} y1={N[a].y*height} x2={N[b].x*width} y2={N[b].y*height}
          stroke={t.duoFg} strokeOpacity="0.5" strokeWidth="0.7" />
      ))}
      {N.map((n, i) => (
        <circle key={i} cx={n.x*width} cy={n.y*height} r={n.r} fill={t.duoFg}
          style={n.hero ? {
            transformOrigin: `${n.x*width}px ${n.y*height}px`,
            animation: 'jzl-pulse-2 2.4s ease-in-out infinite',
          } : undefined} />
      ))}
    </svg>
  );
}

// ── Big Scales mark — full staff with sweep highlight ────────────────────
function ScalesLarge({ t, width = 360, height = 160 }) {
  // 5-line staff, scale of notes ascending, vertical highlight sweeping.
  const staffY = [40, 56, 72, 88, 104];
  const notes = [
    { x: 50, y: 100 }, { x: 80, y: 92 }, { x: 110, y: 84 }, { x: 140, y: 76 },
    { x: 170, y: 68 }, { x: 200, y: 60 }, { x: 230, y: 52 }, { x: 260, y: 44 },
    { x: 290, y: 60 },
  ];
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="jzl-staff-sweep" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor={t.duoFg} stopOpacity="0" />
          <stop offset="50%" stopColor={t.duoFg} stopOpacity="0.30" />
          <stop offset="100%" stopColor={t.duoFg} stopOpacity="0" />
        </linearGradient>
      </defs>
      {staffY.map((y, i) => (
        <line key={i} x1="24" y1={y} x2={width - 24} y2={y}
          stroke={t.duoFg} strokeOpacity="0.55" strokeWidth="0.8" />
      ))}
      {/* Treble clef sketch — kept very abstract: a vertical line and a circle */}
      <line x1="34" y1="32" x2="34" y2="112" stroke={t.duoFg} strokeOpacity="0.6" strokeWidth="1.2" />
      <circle cx="34" cy="96" r="6" fill="none" stroke={t.duoFg} strokeWidth="1.2" strokeOpacity="0.6" />
      {notes.map((n, i) => (
        <ellipse key={i} cx={n.x} cy={n.y} rx="6" ry="4.5" fill={t.duoFg}
          transform={`rotate(-22 ${n.x} ${n.y})`} />
      ))}
      {/* Stems */}
      {notes.map((n, i) => (
        <line key={'s'+i} x1={n.x + 5} y1={n.y - 1} x2={n.x + 5} y2={n.y - 28}
          stroke={t.duoFg} strokeWidth="1.2" />
      ))}
      {/* Sweep highlight */}
      <rect x="0" y="20" width="60" height="100" fill="url(#jzl-staff-sweep)"
        style={{ animation: 'jzl-sweep 3.8s linear infinite' }} />
    </svg>
  );
}

// ── Piano keys with voicing lit ──────────────────────────────────────────
function ChordsLarge({ t, width = 360, height = 160, voicing = [0, 2, 4, 6] }) {
  // 12 white keys, black keys overlaid. Lit white keys flash subtly.
  const keyW = (width - 24) / 12;
  const x0 = 12;
  const whites = Array.from({ length: 12 }, (_, i) => i);
  // Black-key positions among the white keys (0-indexed white-key spots they sit after).
  const blackAfter = [0, 1, 3, 4, 5, 7, 8, 10, 11];
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} style={{ display: 'block' }}>
      {whites.map(i => (
        <rect key={'w'+i} x={x0 + i * keyW} y={20} width={keyW - 2} height={120}
          fill={voicing.includes(i) ? t.duoFg : t.duoBg}
          stroke={t.duoFg} strokeWidth="0.8" strokeOpacity="0.55"
          style={voicing.includes(i) ? {
            animation: `jzl-key-press 2.4s ease-in-out infinite`,
            animationDelay: `${i * 0.12}s`,
            transformOrigin: 'center top',
          } : undefined} />
      ))}
      {blackAfter.map((i, idx) => (
        <rect key={'b'+idx} x={x0 + (i + 1) * keyW - keyW * 0.32} y={20}
          width={keyW * 0.6} height={72}
          fill={t.duoFg} opacity="0.92" />
      ))}
    </svg>
  );
}

// ── Metronome — pendulum that swings ──────────────────────────────────────
function MetronomeLarge({ t, width = 240, height = 220 }) {
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} style={{ display: 'block' }}>
      {/* Body — trapezoid */}
      <polygon points={`${width*0.28},${height-12} ${width*0.72},${height-12} ${width*0.58},20 ${width*0.42},20`}
        fill="none" stroke={t.duoFg} strokeWidth="1.4" strokeOpacity="0.7" />
      {/* Scale ticks down the front */}
      {[0.30, 0.42, 0.56, 0.70, 0.84].map((p, i) => (
        <line key={i}
          x1={width*0.42 + (width*0.16)*p} y1={20 + (height-32)*p}
          x2={width*0.46 + (width*0.12)*p} y2={20 + (height-32)*p}
          stroke={t.duoFg} strokeWidth="0.8" strokeOpacity="0.5" />
      ))}
      {/* Pendulum, anchored at bottom-center, swings */}
      <g style={{
        transformOrigin: `${width / 2}px ${height - 12}px`,
        animation: 'jzl-swing 1.2s ease-in-out infinite',
      }}>
        <line x1={width/2} y1={height-12} x2={width/2} y2={28}
          stroke={t.duoFg} strokeWidth="1.6" />
        <rect x={width/2 - 7} y={56} width="14" height="10" fill={t.duoFg} />
        <circle cx={width/2} cy={26} r="4" fill={t.duoFg} />
      </g>
    </svg>
  );
}

// ── Small marks for the launcher (UI-snippet style) ───────────────────────
function ScaleStaffMini({ t, width = 180, height = 60 }) {
  const ys = [10, 20, 30, 40, 50];
  const notes = [{x:30,y:46},{x:50,y:40},{x:70,y:34},{x:90,y:28},{x:110,y:22},{x:130,y:28},{x:150,y:34}];
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} style={{ display: 'block' }}>
      {ys.map((y,i)=>(<line key={i} x1="2" y1={y} x2={width-2} y2={y}
        stroke={t.duoFg} strokeOpacity="0.5" strokeWidth="0.6" />))}
      {notes.map((n,i)=>(<ellipse key={i} cx={n.x} cy={n.y} rx="3.5" ry="2.6" fill={t.duoFg}
        transform={`rotate(-20 ${n.x} ${n.y})`} />))}
    </svg>
  );
}

function ChordDotsStaff({ t, width = 320, height = 64, compact = false }) {
  // Treble staff with 4 filled dots stacked at chord-tone positions —
  // previewing the dots-on-notes style of chords.jazzlore.com.
  // Voicing shown: Cm7♭5 close root position = C4 / E♭4 / G♭4 / B♭4.
  const lineGap = Math.max(5, Math.min(8, Math.floor((height - 18) / 5)));
  const top = (height - lineGap * 4) / 2;
  const lineY = [0, 1, 2, 3, 4].map(i => top + i * lineGap);
  const cefX = Math.max(14, width * 0.06);
  const cefR = Math.min(lineGap * 0.9, 6);
  const dotX = compact ? width * 0.55 : width * 0.42;
  const labelX = width - 4;
  const dots = [
    { y: lineY[4] + lineGap, flat: false, name: 'C'  }, // C4 (leger)
    { y: lineY[4],           flat: true,  name: 'E♭' }, // Eb4 (bottom line)
    { y: lineY[3],           flat: true,  name: 'G♭' }, // Gb4 (4th line up)
    { y: lineY[2],           flat: true,  name: 'B♭' }, // Bb4 (middle line)
  ];
  const r = Math.max(3, Math.min(4.5, lineGap * 0.55));
  const flatSize = lineGap * 1.6;
  const labelSize = Math.max(8, Math.min(10.5, lineGap * 1.2));
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height}
      style={{ display: 'block' }}>
      {lineY.map((y, i) => (
        <line key={i} x1={cefX + 12} y1={y}
          x2={compact ? width - 6 : labelX - lineGap * 4} y2={y}
          stroke={t.duoFg} strokeOpacity="0.5" strokeWidth="0.7" />
      ))}
      {/* Abstract treble-clef mark */}
      <g stroke={t.duoFg} strokeWidth="1.2" fill="none" strokeOpacity="0.65">
        <line x1={cefX} y1={lineY[0] - lineGap * 0.3} x2={cefX} y2={lineY[4] + lineGap * 0.3} />
        <circle cx={cefX} cy={lineY[3] + lineGap * 0.5} r={cefR} />
      </g>
      {/* Leger line for middle C */}
      <line x1={dotX - r * 2.2} y1={lineY[4] + lineGap}
        x2={dotX + r * 2.2} y2={lineY[4] + lineGap}
        stroke={t.duoFg} strokeOpacity="0.55" strokeWidth="0.7" />
      {/* Flat accidentals */}
      {dots.filter(d => d.flat).map((d, i) => (
        <text key={'f'+i} x={dotX - r * 3} y={d.y + r * 1.1}
          fontFamily={fonts.serif} fontSize={flatSize}
          fill={t.duoFg} opacity="0.92">♭</text>
      ))}
      {/* Chord-tone dots — gently breathe in sequence */}
      {dots.map((d, i) => (
        <circle key={'d'+i} cx={dotX} cy={d.y} r={r} fill={t.duoFg}
          style={{
            animation: 'jzl-pulse-soft 2.6s ease-in-out infinite',
            animationDelay: `${i * 0.18}s`,
          }} />
      ))}
      {!compact && dots.map((d, i) => (
        <text key={'lb'+i} x={labelX} y={d.y + r * 0.9}
          fontFamily={fonts.mono} fontSize={labelSize}
          fill={t.duoFg} opacity="0.7"
          letterSpacing="0.06em" textAnchor="end">
          {d.name}
        </text>
      ))}
    </svg>
  );
}

function MetronomeBeatMini({ t, size = 110 }) {
  // Just the pendulum, big.
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ display: 'block' }}>
      <g style={{
        transformOrigin: `${size/2}px ${size-6}px`,
        animation: 'jzl-swing 1.0s ease-in-out infinite',
      }}>
        <line x1={size/2} y1={size-6} x2={size/2} y2={14}
          stroke={t.duoFg} strokeWidth="2" />
        <rect x={size/2 - 6} y={36} width="12" height="9" fill={t.duoFg} />
        <circle cx={size/2} cy={14} r="4.5" fill={t.duoFg} />
      </g>
    </svg>
  );
}

Object.assign(window, {
  themes, fonts,
  ArrowOut, ThemeDot, SharedThemeToggle,
  ConstellationLarge, ConstellationSmall,
  ScalesLarge, ChordsLarge, MetronomeLarge,
  ScaleStaffMini, ChordDotsStaff, MetronomeBeatMini,
});
