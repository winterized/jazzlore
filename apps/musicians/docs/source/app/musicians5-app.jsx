/* eslint-disable react/no-unknown-property */
// Jazzlore Musicians · Pass 5 canvas root (final).

const MOBILE5  = { w: 390,  h: 844  };
const DESKTOP5 = { w: 1280, h: 820  };

function App5() {
  return (
    <DesignCanvas>
      <div style={{
        maxWidth: 920,
        margin: '0 auto 32px',
        padding: '28px 32px',
        background: '#fff',
        border: '1px solid rgba(60,50,40,.12)',
        borderRadius: 12,
        color: '#2a251f',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
        lineHeight: 1.55,
      }}>
        <div style={{fontSize:11, letterSpacing:'.16em', textTransform:'uppercase', color:'rgba(60,50,40,.55)', marginBottom:8}}>
          Jazzlore · musicians.jazzlore.com · pass 5 · final
        </div>
        <h1 style={{fontSize:32, fontWeight:700, letterSpacing:'-0.015em', margin:'0 0 10px', textWrap:'balance'}}>
          Two reversals, then the lock.
        </h1>
        <p style={{fontSize:15, color:'rgba(60,50,40,.78)', margin:'0 0 14px', textWrap:'pretty'}}>
          Pass-4 carried everything forward except two decisions that wanted
          a different answer after sitting with them. Pass 5 reverses both
          and leaves the rest untouched.
        </p>
        <div style={{display:'grid', gridTemplateColumns:'170px 1fr', gap:'12px 18px', fontSize:13, borderTop:'1px solid rgba(60,50,40,.12)', paddingTop:14}}>
          <div style={{fontSize:10, letterSpacing:'.14em', textTransform:'uppercase', color:'rgba(60,50,40,.55)'}}>Rail length</div>
          <div><b>"Show all N →" expansion, not density tiering.</b> Default state: 16 fat headliners + accent CTA + Same Era + records. Expanded: long tail loads inline as fat cards (same treatment — no downgrade). Discovery is opt-in, not opt-out.</div>
          <div style={{fontSize:10, letterSpacing:'.14em', textTransform:'uppercase', color:'rgba(60,50,40,.55)'}}>Graph layout</div>
          <div><b>Force-directed, not deterministic radial.</b> "Alive" beats structurally predictable for a jazz network. Reverts to pass-3 GraphView; seed the simulation from a stable hash for cold-start reproducibility, then let the solver settle.</div>
          <div style={{fontSize:10, letterSpacing:'.14em', textTransform:'uppercase', color:'rgba(60,50,40,.55)'}}>What carries forward</div>
          <div>Mosaic initials, image attribution, error state, autosuggest, "More about" sheet, light + dark, mobile + desktop, the full long-tail data, the README handoff.</div>
        </div>
      </div>

      {/* ───── Miles · default (collapsed) ───── */}
      <DCSection id="p5-miles-default" title="Mobile detail · Miles Davis — default state" subtitle="16 fat headliners + 'Show all 56' CTA. Predictable layout regardless of collaborator count. Same Era is one tap away.">
        <DCArtboard id="p5-miles-dark"  label="Default · Dark"  width={MOBILE5.w} height={MOBILE5.h}><MobileDetailV5 m={MILES4} theme="dark"/></DCArtboard>
        <DCArtboard id="p5-miles-light" label="Default · Light" width={MOBILE5.w} height={MOBILE5.h}><MobileDetailV5 m={MILES4} theme="light"/></DCArtboard>
      </DCSection>

      {/* ───── Miles · expanded ───── */}
      <DCSection id="p5-miles-expanded" title="Mobile detail · Miles — expanded state" subtitle="Long tail loaded inline as fat cards. Same treatment as headliners — no density downgrade. Italic tail-marker breaks the run, Same Era and records still close to hand.">
        <DCArtboard id="p5-miles-expanded-dark" label="Expanded · Dark" width={MOBILE5.w} height={1500}><MobileDetailV5 m={MILES4} theme="dark" expanded/></DCArtboard>
      </DCSection>

      {/* ───── Bobby (small set, attribution) ───── */}
      <DCSection id="p5-bobby" title="Mobile detail · Bobby Timmons — with image attribution" subtitle="Bobby's ~14 collaborators sit just inside the headliner cap. No expansion CTA renders. Magazine captions visible under hero portrait + Moanin' cover.">
        <DCArtboard id="p5-bobby-dark"  label="Attrib · Dark"  width={MOBILE5.w} height={MOBILE5.h}><MobileDetailV5 m={BOBBY4} theme="dark"  withAttribution/></DCArtboard>
        <DCArtboard id="p5-bobby-light" label="Attrib · Light" width={MOBILE5.w} height={MOBILE5.h}><MobileDetailV5 m={BOBBY4} theme="light" withAttribution/></DCArtboard>
      </DCSection>

      {/* ───── Antoine sparse ───── */}
      <DCSection id="p5-antoine" title="Mobile detail · Antoine — sparse" subtitle="No bio · 2 collaborators · no portraits. Mosaic falls back to centered initials, hero photo italic placeholder, dupe flag in identity.">
        <DCArtboard id="p5-antoine" label="Sparse · Dark" width={MOBILE5.w} height={MOBILE5.h}><MobileDetailV5 m={ANTOINE4} theme="dark" sparse withAttribution/></DCArtboard>
      </DCSection>

      {/* ───── Mobile home ───── */}
      <DCSection id="p5-home" title="Mobile home" subtitle="Unchanged from pass 3. Invitational headline, visible search bar, journey row, curated 12 with hooks.">
        <DCArtboard id="p5-home-dark"  label="Home · Dark"  width={MOBILE5.w} height={MOBILE5.h}><MobileHome theme="dark"/></DCArtboard>
        <DCArtboard id="p5-home-light" label="Home · Light" width={MOBILE5.w} height={MOBILE5.h}><MobileHome theme="light"/></DCArtboard>
      </DCSection>

      {/* ───── States ───── */}
      <DCSection id="p5-states" title="States — autosuggest · More about · error" subtitle="All carrying forward from earlier passes. Error tone calm, fallback names cached locally so the user is never stranded.">
        <DCArtboard id="p5-suggest-dark"   label="Autosuggest · Dark"  width={MOBILE5.w} height={MOBILE5.h}><Autosuggest theme="dark"/></DCArtboard>
        <DCArtboard id="p5-suggest-light"  label="Autosuggest · Light" width={MOBILE5.w} height={MOBILE5.h}><Autosuggest theme="light"/></DCArtboard>
        <DCArtboard id="p5-moreabout"      label="'More about' sheet"  width={MOBILE5.w} height={MOBILE5.h}><MoreAbout m={BOBBY3} theme="dark"/></DCArtboard>
        <DCArtboard id="p5-err-dark"       label="Error · Dark"        width={MOBILE5.w} height={MOBILE5.h}><ErrorState theme="dark"/></DCArtboard>
        <DCArtboard id="p5-err-light"      label="Error · Light"       width={MOBILE5.w} height={MOBILE5.h}><ErrorState theme="light"/></DCArtboard>
      </DCSection>

      {/* ───── Desktop home ───── */}
      <DCSection id="p5-desk-home" title="Desktop home" subtitle="Generous hero, 4-column grid of 12, journey row.">
        <DCArtboard id="p5-desk-home-dark"  label="Desktop home · Dark"  width={DESKTOP5.w} height={DESKTOP5.h}><DesktopHome theme="dark"/></DCArtboard>
        <DCArtboard id="p5-desk-home-light" label="Desktop home · Light" width={DESKTOP5.w} height={DESKTOP5.h}><DesktopHome theme="light"/></DCArtboard>
      </DCSection>

      {/* ───── Desktop detail · force-directed graph ───── */}
      <DCSection id="p5-desk-detail" title="Desktop detail · force-directed graph" subtitle="Same rail composition. Graph reverts to the pass-3 GraphView — alive, organic, hand-tuned starting positions. Production: seed the simulation from a stable hash and let it settle.">
        <DCArtboard id="p5-desk-miles-dark"  label="Miles · Dark"  width={DESKTOP5.w} height={DESKTOP5.h}><DesktopDetailV5 m={MILES4} theme="dark"  graph={MILES_GRAPH}/></DCArtboard>
        <DCArtboard id="p5-desk-miles-light" label="Miles · Light" width={DESKTOP5.w} height={DESKTOP5.h}><DesktopDetailV5 m={MILES4} theme="light" graph={MILES_GRAPH}/></DCArtboard>
        <DCArtboard id="p5-desk-bobby-dark"  label="Bobby · Dark"  width={DESKTOP5.w} height={DESKTOP5.h}><DesktopDetailV5 m={BOBBY4} theme="dark"  graph={BOBBY_GRAPH}/></DCArtboard>
      </DCSection>

      <HandoffV5/>

      <DCPostIt x={60} y={60} w={300}>
        <b>Pass 5 — final →</b><br/><br/>
        Two reversals from pass 4:<br/>
        · Rail = "Show all" expansion (was density tier)<br/>
        · Graph = force-directed (was radial)<br/><br/>
        Sections, top to bottom:<br/>
        · Miles default + expanded<br/>
        · Bobby with attribution<br/>
        · Antoine sparse<br/>
        · Mobile home<br/>
        · States — suggest · more · error<br/>
        · Desktop home<br/>
        · Desktop detail w/ force-directed graph<br/>
        · Final handoff README<br/>
      </DCPostIt>
    </DesignCanvas>
  );
}

const root5 = ReactDOM.createRoot(document.getElementById('root'));
root5.render(<App5/>);
