// PR 1 placeholder. The real component tree (Header / BpmHero / TempoSlider /
// NudgeRow / TapButton / MeterPicker / PatternEditor / ModeCards /
// StartStopButton / KbdFooter / DesktopSideRails) lands in the subsequent
// tasks per apps/metronome/docs/plans/2026-05-20-v1-build.md.
export default function MetronomePage() {
  return (
    <main className="mt">
      <div className="hdr">
        <div className="brand">
          <b>jazzlore</b>
          <span className="div">/</span>
          <span className="sub">metronome</span>
        </div>
      </div>
      <div className="page">
        <p style={{ color: 'var(--muted)', padding: '24px 16px', fontSize: 13 }}>
          Scaffold ready — v1 UI lands in the next task chunk.
        </p>
      </div>
    </main>
  )
}
