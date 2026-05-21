/* eslint-disable react/no-unknown-property */
// Jazzlore Metronome — component.
// Single responsive piece, exposes layout="mobile"|"desktop", theme="light"|"dark".
// All beat-flash / running visuals are static here (mock) — driven by the
// `running` and `currentBeat` props rather than a live audio engine.

const { useState } = React;

// ─── inline icons ──────────────────────────────────────────────────────
const IconPlay = ({ s=18, c="currentColor" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M7.5 5.5 L19 12 L7.5 18.5 Z" fill={c}/>
  </svg>
);
const IconStop = ({ s=18, c="currentColor" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="6.5" y="6.5" width="11" height="11" rx="1.5" fill={c}/>
  </svg>
);
const IconSun = ({ s=16, c="currentColor" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" aria-hidden>
    <circle cx="12" cy="12" r="3.6"/>
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.5 1.5M16.9 16.9l1.5 1.5M5.6 18.4l1.5-1.5M16.9 7.1l1.5-1.5"/>
  </svg>
);
const IconMoon = ({ s=16, c="currentColor" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 14.5A8 8 0 1 1 9.5 4 A6.5 6.5 0 0 0 20 14.5Z"/>
  </svg>
);

// ─── single tempo-control row (nudges + classic stepper) ──────────────
//   semantic order, left → right:  [<<]  [-10]  [-1]  [+1]  [+10]  [>>]
//   classic-tempo steppers flank the edges so the "go bigger" gesture
//   pulls outward.
const NUDGES = [
  { kind: 'classic-prev', label: '◀◀', scale: 'CLASSIC' },
  { kind: 'minus-10',     label: '−10', scale: '' },
  { kind: 'minus-1',      label: '−1',  scale: '' },
  { kind: 'plus-1',       label: '+1',  scale: '' },
  { kind: 'plus-10',      label: '+10', scale: '' },
  { kind: 'classic-next', label: '▶▶', scale: 'CLASSIC' },
];

// Italian-tradition classic tempos used for slider ticks and classic-stepper.
const CLASSIC_TEMPOS = [40, 60, 66, 76, 108, 120, 144, 168, 200];

// ─── status label ──────────────────────────────────────────────────────
function StatusPill({ state }) {
  const lab = state === 'running' ? 'streaming · keep-alive on'
            : state === 'priming' ? 'priming · 400ms warmup'
            : 'idle';
  return (
    <div className={`status ${state}`}>
      <span className="dot"/>{lab}
    </div>
  );
}

// ─── Pattern row (single row — designed to stack to 2 rows in v2) ────
function PatternRow({ beats, pattern, currentBeat, running, label, dim }) {
  return (
    <div className="pttn-row">
      {label && <div className="lh">{label}</div>}
      {Array.from({ length: beats }, (_, i) => {
        const s = pattern[i] || 'empty';
        const flash = running && currentBeat === i;
        return (
          <div
            key={i}
            className={`dot ${flash ? 'flash' : ''}`}
            data-s={dim ? 'empty' : s}
            style={dim ? { opacity: 0.35 } : undefined}
            title={`beat ${i+1}: ${s}`}
          />
        );
      })}
    </div>
  );
}

// ─── Mode card ────────────────────────────────────────────────────────
function ModeCard({ id, on, label, sub, vis, onClick }) {
  return (
    <button className={`mode ${on ? 'on' : ''}`} onClick={onClick}>
      <div className="vis">{vis}</div>
      <div className="lab">{label}</div>
      <div className="sub">{sub}</div>
    </button>
  );
}

// ─── Tick generator for slider ────────────────────────────────────────
function SliderTicks({ min, max }) {
  const total = max - min;
  const range = [];
  for (let v = min; v <= max; v += 10) range.push(v);
  return (
    <>
      {range.map(v => {
        const left = ((v - min) / total) * 100;
        const isClassic = CLASSIC_TEMPOS.includes(v);
        return (
          <span
            key={v}
            className={`tick ${isClassic ? 'classic' : ''}`}
            style={{ left: `${left}%` }}
          />
        );
      })}
      {CLASSIC_TEMPOS.filter(v => v >= min && v <= max && (v === 60 || v === 120 || v === 168)).map(v => {
        const left = ((v - min) / total) * 100;
        return (
          <span key={`L${v}`} className="tick-lab" style={{ left: `${left}%` }}>{v}</span>
        );
      })}
    </>
  );
}

// ─── Main component ──────────────────────────────────────────────────
function Metronome({
  theme = 'dark',
  layout = 'mobile',     // 'mobile' | 'desktop'
  bpm = 120,
  beats = 4,
  pattern = ['accent','normal','normal','normal'],
  mode = 'all',          // 'all' | 'backbeat' | 'altmeasure' | null
  status = 'idle',       // 'idle' | 'priming' | 'running'
  currentBeat = -1,
  tapArmed = false,
  bpmEditing = false,
  showAltMeasureOff = false,
}) {
  const running = status === 'running';
  const MIN = 30, MAX = 240;
  const sliderPct = ((bpm - MIN) / (MAX - MIN)) * 100;

  const NudgeButton = ({ n }) => (
    <button className={`nudge ${n.kind}`} title={n.kind}>
      {n.scale && <span className="scale-tag">{n.scale}</span>}
      <span>{n.label}</span>
    </button>
  );

  const headerBlock = (
    <div className="hdr">
      <div className="brand">
        <b>jazzlore</b>
        <span className="div">/</span>
        <span className="sub">metronome</span>
      </div>
      <div className="spc"/>
      <StatusPill state={status}/>
      <button className="ic" title="Toggle theme" style={{ marginLeft: 8 }}>
        {theme === 'dark' ? <IconSun s={15}/> : <IconMoon s={15}/>}
      </button>
    </div>
  );

  // Decide flowing tempo-meaning label (largo, andante, allegro…)
  const tempoLabel = (b) => {
    if (b < 60) return 'Largo';
    if (b < 76) return 'Adagio';
    if (b < 108) return 'Andante';
    if (b < 120) return 'Moderato';
    if (b < 156) return 'Allegro';
    if (b < 200) return 'Vivace';
    return 'Presto';
  };

  const bpmHero = (
    <div className="bpm-hero">
      <div className="pre">{running ? 'Now playing' : 'Tempo'}</div>
      <div className="bpm-num">
        {bpm}{bpmEditing && <span className="edit-caret"/>}
      </div>
      <div className="lab">
        BPM<b>{tempoLabel(bpm)}</b>
      </div>
      {running && <div className="pulse beating"/>}
    </div>
  );

  const tempoBlock = (
    <div className="tempo">
      <div className="slider">
        <div className="track"/>
        <div className="fill" style={{ width: `${sliderPct}%` }}/>
        <SliderTicks min={MIN} max={MAX}/>
        <div className="thumb" style={{ left: `${sliderPct}%` }}/>
      </div>
      <div className="slider-foot">
        <span>30</span>
        <span style={{ color: 'var(--muted)' }}>BPM</span>
        <span>240</span>
      </div>

      <div className="nudge-row">
        {NUDGES.map(n => <NudgeButton key={n.kind} n={n}/>)}
      </div>

      <div className="tap-row">
        <button className={`tap-big ${tapArmed ? 'armed' : ''}`}>
          <span>TAP</span>
          <span className="hint">tap a few times, last 6 averaged · <kbd>T</kbd></span>
        </button>
      </div>
    </div>
  );

  const meterBlock = (
    <>
      <div className="sec-h">
        <span>Beats per bar</span>
        <span className="meta">{beats} / 4</span>
      </div>
      <div className="meter">
        {[2,3,4,5,6,7].map(n => (
          <button key={n} className={n === beats ? 'on' : ''}>{n}</button>
        ))}
      </div>
    </>
  );

  const patternBlock = (
    <>
      <div className="sec-h">
        <span>Pattern</span>
        <span className="meta">click to cycle · empty → click → accent</span>
      </div>
      <div className="pattern">
        <PatternRow
          beats={beats}
          pattern={pattern}
          currentBeat={currentBeat}
          running={running}
          label={null}
          dim={false}
        />
        {showAltMeasureOff && (
          <PatternRow
            beats={beats}
            pattern={pattern}
            currentBeat={-1}
            running={false}
            label="bar 2 — silent"
            dim
          />
        )}
        <div className="ptn-foot">
          <div className="legend">
            <span><span className="lk empty"/>silent</span>
            <span><span className="lk normal"/>click</span>
            <span><span className="lk accent"/>accent</span>
          </div>
          <span>tap a dot</span>
        </div>
      </div>
    </>
  );

  const modesBlock = (
    <>
      <div className="sec-h">
        <span>Quick patterns</span>
        <span className="meta">override pattern · clears when you tweak a dot</span>
      </div>
      <div className="modes">
        <ModeCard
          id="all"
          on={mode === 'all'}
          label="Accent on 1"
          sub="default click, every beat"
          vis={
            <>
              <span className="v acc"/><span className="v"/><span className="v"/><span className="v"/>
            </>
          }
        />
        <ModeCard
          id="backbeat"
          on={mode === 'backbeat'}
          label="2 & 4"
          sub="backbeat — jazz feel"
          vis={
            <>
              <span className="v off"/><span className="v"/><span className="v off"/><span className="v"/>
            </>
          }
        />
        <ModeCard
          id="altmeasure"
          on={mode === 'altmeasure'}
          label="Bar on / off"
          sub="alternate measures silent"
          vis={
            <>
              <span className="bar"><span className="v acc"/><span className="v"/><span className="v"/><span className="v"/></span>
              <span className="bar off"><span className="v"/><span className="v"/><span className="v"/><span className="v"/></span>
            </>
          }
        />
      </div>
    </>
  );

  const startBlock = (
    <div className="start-row">
      <button className={`start ${running ? 'running' : ''}`}>
        {running
          ? <><IconStop s={20}/><span className="label">Stop</span><span className="kbd-hint">space</span></>
          : <><IconPlay s={20}/><span className="label">Start</span><span className="kbd-hint">space</span></>
        }
      </button>
    </div>
  );

  const kbdFooter = (
    <div className="kbd-hints">
      <span><kbd>space</kbd> start / stop</span>
      <span><kbd>T</kbd> tap</span>
      <span><kbd>←</kbd><kbd>→</kbd> ±1</span>
      <span><kbd>⇧</kbd>+<kbd>←</kbd><kbd>→</kbd> ±10</span>
      <span><kbd>[</kbd><kbd>]</kbd> classic step</span>
    </div>
  );

  if (layout === 'desktop') {
    return (
      <div className="mt mt-artboard" data-theme={theme} data-layout="desktop">
        {headerBlock}
        <div className="desk-wrap">
          <div className="desk-side left">
            <h4>Keyboard</h4>
            <div className="kb-list">
              <div className="row"><span className="k"><kbd>space</kbd></span><span className="d">start / stop</span></div>
              <div className="row"><span className="k"><kbd>T</kbd></span><span className="d">tap tempo</span></div>
              <div className="row"><span className="k"><kbd>←</kbd><kbd>→</kbd></span><span className="d">±1 BPM</span></div>
              <div className="row"><span className="k"><kbd>⇧</kbd><kbd>←</kbd></span><span className="d">±10 BPM</span></div>
              <div className="row"><span className="k"><kbd>[</kbd><kbd>]</kbd></span><span className="d">classic ±</span></div>
              <div className="row"><span className="k"><kbd>1</kbd>…<kbd>7</kbd></span><span className="d">set meter</span></div>
            </div>
            <div className="signature">
              <b>Notes</b>
              Mobile-first by design — built for an iPhone plugged into a Kawai over USB-C → RCA. Desktop reuses the same control surface, gives the keyboard a place to live, and otherwise gets out of the way.
            </div>
          </div>

          <div className="page" style={{ paddingTop: 8 }}>
            {bpmHero}
            {tempoBlock}
            {meterBlock}
            {patternBlock}
            {modesBlock}
            {startBlock}
          </div>

          <div className="desk-side right">
            <h4>Status</h4>
            <div className="kb-list">
              <div className="row"><span className="k">stream</span><span className="d" style={{ color: status === 'running' ? 'var(--accent)' : 'var(--muted)' }}>{status}</span></div>
              <div className="row"><span className="k">wake lock</span><span className="d">{running ? 'held' : 'released'}</span></div>
              <div className="row"><span className="k">scheduler</span><span className="d">25ms tick · 100ms lookahead</span></div>
              <div className="row"><span className="k">warmup</span><span className="d">400ms before beat 1</span></div>
            </div>
            <div className="signature">
              <b>Why a keep-alive</b>
              iOS lets the USB audio stream idle between sounds. A sub-audible 30 Hz oscillator at ~0.0008 gain runs Start → Stop so the DAC never sleeps and no click loses its leading edge.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // mobile
  return (
    <div className="mt mt-artboard" data-theme={theme}>
      {headerBlock}
      <div className="page">
        {bpmHero}
        {tempoBlock}
        {meterBlock}
        {patternBlock}
        {modesBlock}
        {startBlock}
        {kbdFooter}
      </div>
    </div>
  );
}
