/* eslint-disable react/no-unknown-property */
// Jazzlore Metronome — icon-decision matrix + visual-language card.
// One <DCArtboard> wide-format doc, sits at the top of the canvas.

function IconMatrix() {
  const Row = (props) => (
    <tr>
      <td>
        {props.name}
        <span className="role">{props.role}</span>
      </td>
      <td>
        {props.options.map((o, i) => (
          <div key={i} className={`opt ${o.pick ? 'pick' : ''}`}>
            <span className="glyph">{o.glyph}</span>
            <span className="note">
              {o.pick && <b>pick · </b>}{o.label}
              {o.because && <> — {o.because}</>}
            </span>
          </div>
        ))}
      </td>
    </tr>
  );

  return (
    <div className="dock">
      <div className="pre">Jazzlore · metronome.jazzlore.com · icon decisions</div>
      <h1>Two-component icon set, <em>biased toward words</em>.</h1>
      <p className="sub">
        The metronome lives mostly on a phone, propped on a music stand, glanced
        at between beats. Clarity beats cleverness, and word-buttons read faster
        than glyphs at arm's length. The choices below favor labels for any
        non-universal action, and reserve true icons for the two operations
        every player already knows by shape: <b>play / stop</b> and <b>theme</b>.
      </p>

      <table>
        <thead>
          <tr>
            <th>Control</th>
            <th>Options considered · pick highlighted</th>
          </tr>
        </thead>
        <tbody>
          <Row
            name="Start / Stop"
            role="primary action"
            options={[
              { glyph: '▶', label: 'Solid play triangle (start) → solid square (stop).', because: 'universal media-player vocabulary; legible at small and large size; the only icon a musician will not need to read.', pick: true },
              { glyph: '⏵⏸', label: 'Play triangle → two pause bars.', because: 'Pause implies "resumes where it left off." A metronome resets to beat 1 on next start — a square reads as a hard stop, which matches the behavior.' },
              { glyph: 'GO',  label: 'Word-button "GO" / "STOP".', because: 'Considered, rejected — louder than necessary; the triangle already does this job and lets the button breathe.' },
            ]}
          />
          <Row
            name="Tap tempo"
            role="tempo by tapping"
            options={[
              { glyph: 'TAP', label: 'Word "TAP", letter-spaced.', because: 'Unambiguous; matches the gesture name; reads at a glance; pairs naturally with the visual armed-state when taps are landing.', pick: true },
              { glyph: '☝',  label: 'Index-finger glyph.', because: 'Cute, but ambiguous with "press." Most users will read it as a generic tap target, not as the tap-to-set-tempo action.' },
              { glyph: '◉',  label: 'Concentric-target glyph.', because: 'Reads as "record" first. Wrong association for musicians.' },
            ]}
          />
          <Row
            name="Nudge ±1"
            role="finest tempo adjustment"
            options={[
              { glyph: '−1', label: 'Literal "−1" / "+1" in Geist Mono.', because: 'Numeric magnitude is the value of this control. Geist Mono makes the sign + digit the same visual weight as the BPM number above — they belong together.', pick: true },
              { glyph: '◂',  label: 'Single chevron.', because: 'No magnitude — could be ±1 or ±5. Forces the user to remember which row this is.' },
              { glyph: '−',  label: 'Bare minus / plus.', because: 'Cleaner but lacks the magnitude that makes this control distinct from ±10.' },
            ]}
          />
          <Row
            name="Stepper ±10"
            role="coarse tempo adjustment"
            options={[
              { glyph: '−10', label: 'Literal "−10" / "+10" in Geist Mono.', because: 'Same logic as ±1 — the number is the affordance. Two-character labels stay legible in a 56–60px button.', pick: true },
              { glyph: '⏪',  label: 'Double-chevron / rewind glyph.', because: 'Borrowed from media transport but does not communicate "10."' },
            ]}
          />
          <Row
            name="Classic stepper"
            role="next/prev classic tempo (60, 76, 108…)"
            options={[
              { glyph: '◀◀', label: 'Double-arrow with tiny "CLASSIC" tag above.', because: 'Flanking-position on the row + double-arrow says "bigger jump." The CLASSIC tag inside the button disambiguates from ±10 without spending a whole label.', pick: true },
              { glyph: '60↦76', label: 'Show next-classic numeric inside the button.', because: 'Concrete but recomputes on every change — visual noise, especially when sweeping through tempos.' },
              { glyph: '♩=',  label: 'Italian-marking glyph (Adagio / Allegro etc.).', because: 'Felt right initially but breaks down past three values; classic markers also live in the BPM hero already.' },
            ]}
          />
          <Row
            name="Quick-access modes"
            role="3 toggle pills above pattern"
            options={[
              { glyph: '●○○○', label: 'Tiny dot-pattern previews + short label + italic sub-line.', because: 'Each mode is a pattern, so the preview IS the icon. Pairs naturally with the pattern editor below. Backbeat = ○●○●, alt-measure = filled-bar + ghost-bar.', pick: true },
              { glyph: '𝄾♩',  label: 'Music notation glyphs (rest + note).', because: 'Beautiful in isolation, but the metronome editor uses dots — switching vocabulary mid-screen costs more than it teaches.' },
              { glyph: 'BB',  label: 'Pure text pills ("All", "BB", "1/0").', because: 'Lightest but loses the at-a-glance pattern read.' },
            ]}
          />
          <Row
            name="Meter selector"
            role="2…7 beats per bar"
            options={[
              { glyph: '4',   label: 'Six numeric buttons, 2 through 7, current state filled amber.', because: 'Numbers are the language of meter. One row, no decoration.', pick: true },
              { glyph: '4/4', label: 'Time-signature labels (3/4, 4/4, 5/4).', because: 'Implies a denominator the metronome does not actually let you change. Misleading.' },
            ]}
          />
          <Row
            name="Accent pattern editor"
            role="per-beat state (empty · click · accent)"
            options={[
              { glyph: '○●◉', label: 'Dashed ring (silent) → solid dot (click) → larger amber filled dot in halo (accent).', because: 'Three states need three visual weights, not three colors. Size+halo for accent reads as emphasis; dashed for empty reads as absence.', pick: true },
              { glyph: '·●!', label: 'Tiny dot / dot / dot-with-bang.', because: 'Punctuation reads as text, not as a beat.' },
            ]}
          />
          <Row
            name="Theme toggle"
            role="light / dark"
            options={[
              { glyph: '☀ ☾', label: 'Sun (in dark mode) / moon (in light mode), 1.6px stroke.', because: 'Matches existing Jazzlore convention from packages/ui. Inherits one of the two universal icon-only controls in this UI.', pick: true },
            ]}
          />
        </tbody>
      </table>

      {/* visual language card */}
      <div className="vlang">
        <div className="card">
          <h5>Color · light + dark</h5>
          <div className="swatches">
            <div className="swatch"><div className="sw" style={{ background:'#f4f1ea' }}/><div className="nm">bg light</div></div>
            <div className="swatch"><div className="sw" style={{ background:'#0a0a0a', borderColor:'#333' }}/><div className="nm">bg dark</div></div>
            <div className="swatch"><div className="sw" style={{ background:'#c87f1a' }}/><div className="nm">amber light</div></div>
            <div className="swatch"><div className="sw" style={{ background:'#f4a233' }}/><div className="nm">amber dark</div></div>
            <div className="swatch"><div className="sw" style={{ background:'#1a1612' }}/><div className="nm">text</div></div>
            <div className="swatch"><div className="sw" style={{ background:'#6a6258' }}/><div className="nm">muted</div></div>
          </div>
          <div style={{ marginTop:12, fontSize:12.5, color:'rgba(60,50,40,.7)', lineHeight:1.5 }}>
            Single accent (amber). Stone neutrals. Each token has a light and dark anchor that the rest of jazzlore already uses — the metronome inherits them whole, no new color decisions.
          </div>
        </div>

        <div className="card">
          <h5>Typography</h5>
          <div className="type">
            <div className="sample">
              <span className="role">Display</span>
              <span style={{ fontFamily:'"Geist Mono", monospace', fontSize:40, letterSpacing:'-0.04em', lineHeight:1, color:'#1a1612', fontWeight:500 }}>120</span>
              <span style={{ fontFamily:'"Geist Mono", monospace', fontSize:11, color:'rgba(60,50,40,.55)', letterSpacing:'0.16em' }}>Geist Mono · num</span>
            </div>
            <div className="sample">
              <span className="role">Body / UI</span>
              <span style={{ fontFamily:'"Geist", sans-serif', fontSize:15, color:'#1a1612' }}>Beats per bar · 2 & 4 backbeat</span>
              <span style={{ fontFamily:'"Geist Mono", monospace', fontSize:11, color:'rgba(60,50,40,.55)', letterSpacing:'0.16em' }}>Geist</span>
            </div>
            <div className="sample">
              <span className="role">Editorial</span>
              <span style={{ fontFamily:'"Newsreader", serif', fontStyle:'italic', fontSize:15, color:'#3a342c' }}>backbeat — jazz feel</span>
              <span style={{ fontFamily:'"Geist Mono", monospace', fontSize:11, color:'rgba(60,50,40,.55)', letterSpacing:'0.16em' }}>Newsreader</span>
            </div>
          </div>
          <div style={{ marginTop:6, fontSize:12.5, color:'rgba(60,50,40,.7)', lineHeight:1.5 }}>
            Geist Mono carries the BPM and every numeric label, so digits never resize as their value changes. Newsreader-italic appears only for sub-lines and tempo names (Largo, Allegro). Everything else is Geist.
          </div>
        </div>
      </div>

      <div className="pickline">
        <b>Shape language</b>
        Pills and rounded buttons (8–14px radii). Single amber accent. Buttons are
        flat by default; the start button is the only element that earns a soft
        amber halo when idle so it's unmistakable. Dotted dashed borders mark
        "armed but inactive" affordances (TAP, empty beats). Status indicator
        is whisper-quiet — a 6px dot in the header — exactly as the spec asks.
      </div>
    </div>
  );
}
