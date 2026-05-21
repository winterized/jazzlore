/* eslint-disable react/no-unknown-property */
// Jazzlore Metronome — canvas root.
// One file presenting:
//   · Icon-decision matrix + visual language
//   · Pass 1 mobile (single mobile artboard, rough commit)
//   · Pass 2 mobile, light + dark
//   · Pass 2 desktop, light + dark
//   · A couple of state variants (running, tap-armed, alt-measure expanded)

const MOBILE  = { w: 390,  h: 880 };
const DESKTOP = { w: 1280, h: 980 };

function MetronomeApp() {
  return (
    <DesignCanvas>
      <IconMatrix/>

      {/* ─── Pass 1 — mobile only, baseline ────────────────────── */}
      <DCSection
        id="mt-pass1"
        title="Pass 1 · Mobile baseline (390×844)"
        subtitle="First commitment to the layout. All controls present, system tokens applied, icons in place. Light + dark for reference. The polish lives in pass 2."
      >
        <DCArtboard id="mt-p1-dark"  label="Pass 1 · Dark"  width={MOBILE.w} height={MOBILE.h}>
          <Metronome theme="dark"  layout="mobile" bpm={120} beats={4} mode="all"
                     pattern={['accent','normal','normal','normal']} status="idle"/>
        </DCArtboard>
        <DCArtboard id="mt-p1-light" label="Pass 1 · Light" width={MOBILE.w} height={MOBILE.h}>
          <Metronome theme="light" layout="mobile" bpm={120} beats={4} mode="all"
                     pattern={['accent','normal','normal','normal']} status="idle"/>
        </DCArtboard>
      </DCSection>

      {/* ─── Pass 2 — mobile, polished ──────────────────────────── */}
      <DCSection
        id="mt-pass2-mobile"
        title="Pass 2 · Mobile (390×844) — light & dark"
        subtitle="Final mobile pass. Default state on the left (just-loaded, classic 120 BPM, accent-on-1). Running state on the right (status pill lit, beat 2 flashing, alt-measure mode showing the bar-off preview). Same component, different props."
      >
        <DCArtboard id="mt-p2-dark"  label="Default · Dark"  width={MOBILE.w} height={MOBILE.h}>
          <Metronome theme="dark"  layout="mobile" bpm={120} beats={4} mode="all"
                     pattern={['accent','normal','normal','normal']} status="idle"/>
        </DCArtboard>
        <DCArtboard id="mt-p2-light" label="Default · Light" width={MOBILE.w} height={MOBILE.h}>
          <Metronome theme="light" layout="mobile" bpm={120} beats={4} mode="all"
                     pattern={['accent','normal','normal','normal']} status="idle"/>
        </DCArtboard>
        <DCArtboard id="mt-p2-running" label="Running · Dark · backbeat" width={MOBILE.w} height={MOBILE.h}>
          <Metronome theme="dark"  layout="mobile" bpm={144} beats={4} mode="backbeat"
                     pattern={['empty','accent','empty','normal']}
                     currentBeat={1} status="running"/>
        </DCArtboard>
        <DCArtboard id="mt-p2-alt"     label="Alt-measure · Light · 5/4" width={MOBILE.w} height={920}>
          <Metronome theme="light" layout="mobile" bpm={108} beats={5} mode="altmeasure"
                     pattern={['accent','normal','normal','normal','normal']}
                     status="running" currentBeat={0}
                     showAltMeasureOff/>
        </DCArtboard>
      </DCSection>

      {/* ─── Pass 2 — desktop ───────────────────────────────────── */}
      <DCSection
        id="mt-pass2-desktop"
        title="Pass 2 · Desktop (1280×900) — light & dark"
        subtitle="Same component, layout='desktop'. Center column holds the metronome at its mobile width (it's a small focused tool — wider would be wrong). Side rails carry keyboard shortcuts and live status, which on mobile collapse into the footer hints."
      >
        <DCArtboard id="mt-p2-desk-dark"  label="Desktop · Dark"  width={DESKTOP.w} height={DESKTOP.h}>
          <Metronome theme="dark"  layout="desktop" bpm={120} beats={4} mode="all"
                     pattern={['accent','normal','normal','normal']} status="idle"/>
        </DCArtboard>
        <DCArtboard id="mt-p2-desk-light" label="Desktop · Light" width={DESKTOP.w} height={DESKTOP.h}>
          <Metronome theme="light" layout="desktop" bpm={120} beats={4} mode="all"
                     pattern={['accent','normal','normal','normal']} status="idle"/>
        </DCArtboard>
        <DCArtboard id="mt-p2-desk-running" label="Desktop · Dark · running" width={DESKTOP.w} height={DESKTOP.h}>
          <Metronome theme="dark"  layout="desktop" bpm={168} beats={3} mode="all"
                     pattern={['accent','normal','normal']}
                     currentBeat={0} status="running"/>
        </DCArtboard>
      </DCSection>

      <DCPostIt x={56} y={64} w={300}>
        <b>Jazzlore metronome →</b><br/><br/>
        Deliverable:<br/>
        · Icon-decision matrix at the top<br/>
        · Pass 1 mobile (light + dark)<br/>
        · Pass 2 mobile + variants<br/>
        · Pass 2 desktop (light + dark)<br/><br/>
        Inheriting the Musicians-v5 design system:<br/>
        · Geist + Geist Mono + Newsreader<br/>
        · Stone neutrals + single amber<br/>
        · Same header pattern + theme toggle<br/><br/>
        No new color decisions. The metronome is one accent button on a stone background — every other surface stays quiet.
      </DCPostIt>
    </DesignCanvas>
  );
}

const rootMt = ReactDOM.createRoot(document.getElementById('root'));
rootMt.render(<MetronomeApp/>);
