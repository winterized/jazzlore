/* eslint-disable react/no-unknown-property */
// Jazzlore Musicians · Pass 5 — final handoff README.

function HandoffV5() {
  const card = {
    maxWidth: 920,
    margin: '0 auto 32px',
    padding: '32px',
    background: '#fff',
    border: '1px solid rgba(60,50,40,.12)',
    borderRadius: 12,
    color: '#2a251f',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    lineHeight: 1.55,
  };
  const h2 = {fontSize:18, fontWeight:700, letterSpacing:'-0.01em', margin:'24px 0 8px'};
  const kicker = {fontSize:10, letterSpacing:'.16em', textTransform:'uppercase', color:'rgba(60,50,40,.55)', marginBottom:8};
  const code = {fontFamily:'ui-monospace, Menlo, monospace', fontSize:12, color:'#2a251f'};
  const table = {width:'100%', borderCollapse:'collapse', fontSize:13};
  const td = {padding:'6px 8px', borderBottom:'1px solid rgba(60,50,40,.10)', verticalAlign:'top'};

  return (
    <div style={card}>
      <div style={kicker}>Jazzlore · musicians.jazzlore.com · pass 5 · final handoff</div>
      <h1 style={{fontSize:34, fontWeight:700, letterSpacing:'-0.015em', margin:'0 0 8px'}}>
        Build notes — final.
      </h1>
      <p style={{fontSize:15, color:'rgba(60,50,40,.75)', margin:'0 0 4px'}}>
        Composition, tokens, motion, accessibility, and the two pass-5
        reversals that locked the design.
      </p>

      <h2 style={h2}>The composition (locked)</h2>
      <table style={table}>
        <tbody>
          <tr><td style={{...td, width:160, fontWeight:600}}>Detail page</td><td style={td}>header → identity strip → bio line + listen → image-only mosaic → ranked rail (16 fat headliners) → "Show all N →" expansion CTA → "From the same era" → records.</td></tr>
          <tr><td style={{...td, width:160, fontWeight:600}}>Home page</td><td style={td}>hero invitation · visible search bar · "Start a journey" row (random / era / label) · curated 12 with hooks.</td></tr>
          <tr><td style={{...td, width:160, fontWeight:600}}>Desktop detail</td><td style={td}>same rail spine on the left (480 px), force-directed graph as a permanent side panel on the right. Click a node to re-centre.</td></tr>
        </tbody>
      </table>

      <h2 style={h2}>Pass-5 reversals</h2>
      <ol style={{margin:'8px 0 0', paddingLeft:18}}>
        <li style={{marginBottom:14}}>
          <b>Rail length — "Show all N →" expansion, not density tiering.</b><br/>
          <span style={{color:'rgba(60,50,40,.8)'}}>
            Default: 16 fat headliners + accent expansion CTA + "Same era" + records.
            The CTA hosts a preview line ("47 more, including Hancock, Williams, Henderson and 44 others") so the user knows what's behind the tap.
            Expanded: the long tail loads inline as fat cards — same treatment, no density downgrade —
            with an italic <code style={code}>tail-marker</code> dividing headliners from "the rest."
            Predictable layout across musicians regardless of collaborator count.
            Long-tail discovery is opt-in, not opt-out — both casual browsing and completionism stay first-class.
          </span>
        </li>
        <li style={{marginBottom:14}}>
          <b>Graph — force-directed, not deterministic radial.</b><br/>
          <span style={{color:'rgba(60,50,40,.8)'}}>
            For a jazz-network visualization, "alive" matters more than structural predictability.
            With ~16 surrounding nodes the physics solve is calm enough that re-centre jitter never materializes.
            Keep the pass-3 GraphView with hand-tuned starting positions; in production seed the simulation
            with a stable hash of each canonical id so cold starts are reproducible, then let the solver settle.
            Annotate with brief easing on re-centre (≤ 1 s) so motion reads as <em>life</em>, not stutter.
          </span>
        </li>
      </ol>

      <h2 style={h2}>Connection-card anatomy (same everywhere)</h2>
      <table style={table}>
        <tbody>
          <tr><td style={{...td, width:160, fontWeight:600}}>Fields</td><td style={td}>64 px duotone portrait · name · instrument + relationship · "Most: <i>'Moanin\''</i> '58 · +6 more" · per-card Spotify + Apple buttons.</td></tr>
          <tr><td style={{...td, width:160, fontWeight:600}}>Hit target</td><td style={td}>Entire row is tappable. Inline listen buttons stop propagation. 88 px minimum row height.</td></tr>
          <tr><td style={{...td, width:160, fontWeight:600}}>Aria-label</td><td style={td}><code style={code}>{`{name + inst + count + topRecord}`}</code> verbatim; render is just a styling of those facts.</td></tr>
        </tbody>
      </table>

      <h2 style={h2}>Mosaic · always-on initials</h2>
      <table style={table}>
        <tbody>
          <tr><td style={{...td, width:160, fontWeight:600}}>Default tile</td><td style={td}>Geist Mono, 10–11 px, top-left corner, ~78% white, 1 px black text-shadow. An identifier of last resort, not a label.</td></tr>
          <tr><td style={{...td, width:160, fontWeight:600}}>photo:false fallback</td><td style={td}>Duotone collapses to flat <code style={code}>--card</code> surface. Initials lift to centered + 18 px (small tile) / 28 px (hero). Same component, graceful degradation.</td></tr>
          <tr><td style={{...td, width:160, fontWeight:600}}>Tap</td><td style={td}>Scroll the matching <code style={code}>ConnRow</code> into view + 240 ms accent pulse. Long-press → direct navigation (power-user shortcut).</td></tr>
        </tbody>
      </table>

      <h2 style={h2}>Image attribution (mandatory, per-image)</h2>
      <table style={table}>
        <tbody>
          <tr><td style={{...td, width:160, fontWeight:600}}>Two-line caption</td><td style={td}>Line 1: photographer / source. Line 2: licence + crop note. Geist Mono 9.5 px, muted/dim colour ramp. Renders directly under the image, not in a footer.</td></tr>
          <tr><td style={{...td, width:160, fontWeight:600}}>Missing photo</td><td style={td}>Italic placeholder ("No portrait on file — Wikimedia Commons request pending"). Never silent.</td></tr>
          <tr><td style={{...td, width:160, fontWeight:600}}>Where it appears</td><td style={td}>Musician hero portrait + every album cover. Detail screens flip this on via <code style={code}>withAttribution</code> prop; production renders it always.</td></tr>
        </tbody>
      </table>

      <h2 style={h2}>Motion specs</h2>
      <table style={table}>
        <tbody>
          <tr><td style={{...td, width:160, fontWeight:600}}>Mosaic-tap pulse</td><td style={td}>1.4 s ease-out, single iteration. Background <code style={code}>rgba(244,162,51,.20)</code> → transparent. Triggered on the matching rail card after scroll lands.</td></tr>
          <tr><td style={{...td, width:160, fontWeight:600}}>Mosaic-tap scroll</td><td style={td}>360 ms, <code style={code}>cubic-bezier(.22,.61,.36,1)</code>. <code style={code}>{"scrollIntoView({block:'center', behavior:'smooth'})"}</code>; reduced-motion → instant.</td></tr>
          <tr><td style={{...td, width:160, fontWeight:600}}>"Show all" expansion</td><td style={td}>320 ms ease-out. Height animates from 0 to <code style={code}>auto</code> via <code style={code}>height: max-content</code> + content-fade 200 ms. Scroll position pinned to the CTA's previous y so the user isn't whipped.</td></tr>
          <tr><td style={{...td, width:160, fontWeight:600}}>Graph re-centre</td><td style={td}>900 ms ease-in-out. Physics solver re-settles; existing nodes ease toward their new positions, new node appears with 200 ms opacity fade-in. Edge weights re-interpolate in lockstep.</td></tr>
          <tr><td style={{...td, width:160, fontWeight:600}}>"More about" sheet</td><td style={td}>open: 280 ms, <code style={code}>cubic-bezier(.32,.72,0,1)</code>, translateY 100% → 0%; backdrop fades 200 ms. Dismiss on backdrop tap, ↓ swipe (≥ 80 px), or × press.</td></tr>
          <tr><td style={{...td, width:160, fontWeight:600}}>Autosuggest</td><td style={td}>Debounce 80 ms. Render hits with 60 ms stagger (max 6). Highlighted span wrapped in <code style={code}>&lt;em&gt;</code>, never re-mounted to avoid focus loss.</td></tr>
          <tr><td style={{...td, width:160, fontWeight:600}}>Reduced motion</td><td style={td}>All durations clamp to 0 ms; pulse becomes a single-frame solid then transparent; scroll is instant; the graph snaps rather than settles.</td></tr>
        </tbody>
      </table>

      <h2 style={h2}>Design tokens</h2>
      <table style={table}>
        <tbody>
          <tr><td style={{...td, width:160, fontWeight:600}}>Dark · surfaces</td><td style={td}><code style={code}>--bg #0a0a0a · --bg-soft #0d0d0d · --paper #161616 · --card #181818 · --card-hover #1d1d1d</code></td></tr>
          <tr><td style={{...td, width:160, fontWeight:600}}>Dark · text</td><td style={td}><code style={code}>--text #f4eede · --text-soft #d9d2c1 · --muted #8a8378 · --dim #565047</code></td></tr>
          <tr><td style={{...td, width:160, fontWeight:600}}>Dark · lines</td><td style={td}><code style={code}>--line #242322 · --line-soft #1c1c1b</code></td></tr>
          <tr><td style={{...td, width:160, fontWeight:600}}>Light · surfaces</td><td style={td}><code style={code}>--bg #f4f1ea · --bg-soft #f8f5ee · --paper #ffffff · --card #ffffff · --card-hover #faf7f0</code></td></tr>
          <tr><td style={{...td, width:160, fontWeight:600}}>Light · text</td><td style={td}><code style={code}>--text #1a1612 · --text-soft #3a342c · --muted #6a6258 · --dim #9b9384</code></td></tr>
          <tr><td style={{...td, width:160, fontWeight:600}}>Light · lines</td><td style={td}><code style={code}>--line #e2ddd0 · --line-soft #ede8dc</code></td></tr>
          <tr><td style={{...td, width:160, fontWeight:600}}>Accent</td><td style={td}><code style={code}>--accent #f4a233 (dark) / #c87f1a (light) · --accent-soft rgba(244,162,51,.14–.16)</code></td></tr>
          <tr><td style={{...td, width:160, fontWeight:600}}>Typography</td><td style={td}><code style={code}>Geist 400/500/600/700 · Geist Mono 400/500/600 · Newsreader 400/500/600 + italic</code> — body 13–16 px, italics for editorial voice, mono for metadata.</td></tr>
          <tr><td style={{...td, width:160, fontWeight:600}}>Radii</td><td style={td}><code style={code}>3–4 px album thumbs · 4–6 px tiles · 6–8 px cards · 14 px bottom-sheet</code></td></tr>
        </tbody>
      </table>

      <h2 style={h2}>Accessibility</h2>
      <ul style={{margin:'8px 0 0', paddingLeft:18, color:'rgba(60,50,40,.85)'}}>
        <li><b>Color-not-sole-signal.</b> Mosaic tiles always carry initials. Connection cards always carry instrument + relationship text. Graph nodes carry name + instrument labels.</li>
        <li><b>Hit targets ≥ 44 px.</b> Connection rows are 88 px tall; mosaic tile minimum 44 × 44 at the densest packing; expansion CTA 48 px.</li>
        <li><b>Aria-labels on every tappable.</b> Mosaic tiles, connection cards, expansion CTA all expose name / count / relationship verbatim regardless of what's visible.</li>
        <li><b>Focus order matches reading order.</b> Header → identity → bio → listen → mosaic → rail (top-to-bottom) → CTA → era → records. Bottom-sheet traps focus while open.</li>
        <li><b>Contrast.</b> Body text ≥ 4.5:1 in both themes. The muted family is reserved for non-essential metadata.</li>
        <li><b>Reduced motion.</b> All scroll, pulse, expansion, sheet, graph, and stagger animations honour <code style={code}>prefers-reduced-motion: reduce</code>.</li>
      </ul>

      <h2 style={h2}>Implementation gotchas</h2>
      <ul style={{margin:'8px 0 0', paddingLeft:18, color:'rgba(60,50,40,.85)'}}>
        <li><b>Mosaic-to-rail mapping.</b> Tap → <code style={code}>{"scrollIntoView({block:'center'})"}</code> on the matching <code style={code}>ConnRow</code> by <code style={code}>data-collab-id</code>. Apply the pulse class on scroll-land, not on tap, or the highlight clips under the sticky header.</li>
        <li><b>Bottom sheet portal-out.</b> Render at the app-shell root, not inside the scrolled detail panel — same lesson the sticky-header pattern taught us.</li>
        <li><b>Expansion CTA hidden in expanded state.</b> When the rail is open, hide the CTA entirely (don't replace with "Show less" at the top — the user's already scrolled past the headliners and a top-anchored collapser becomes invisible). If you want collapse, put it after the tail.</li>
        <li><b>Graph determinism via seeds, not positions.</b> Seed the force-directed simulation from <code style={code}>hash(canonical_id)</code> for cold start reproducibility, but DON'T freeze positions. Let the solver settle for the alive feel. This is the reversal from pass-4 radial.</li>
        <li><b>Autosuggest accent-folding.</b> Use <code style={code}>{"name.normalize('NFD').replace(/\\p{Diacritic}/gu, '')"}</code> for the fold, but render the original name. <code style={code}>&lt;em&gt;</code> match-highlight uses offsets from the original string, not the folded one.</li>
        <li><b>Photo:false flag is data, not derived.</b> Set it from the presence of an <code style={code}>image_url</code> in the graph. Don't try to guess from name.</li>
      </ul>

      <h2 style={h2}>What's in this canvas</h2>
      <ul style={{margin:'8px 0 0', paddingLeft:18, color:'rgba(60,50,40,.85)'}}>
        <li>Mobile detail · Miles · <b>default</b> (16 headliners + "Show all 56") — dark + light.</li>
        <li>Mobile detail · Miles · <b>expanded</b> (all 56 inline as fat cards) — dark.</li>
        <li>Mobile detail · Bobby with image attribution — dark + light.</li>
        <li>Mobile detail · Antoine sparse (mosaic centered-initials fallback) — dark.</li>
        <li>Mobile home — dark + light.</li>
        <li>States: autosuggest, "More about" sheet, error state.</li>
        <li>Desktop home — dark + light.</li>
        <li>Desktop detail with force-directed graph — Miles + Bobby, dark.</li>
      </ul>
    </div>
  );
}

Object.assign(window, { HandoffV5 });
