// No-photo figure library — editorial single-line instrument figures used
// inside `<Duo3>` when a musician has no portrait. Ported from the
// 2026-05-23 design handoff (`apps/musicians/docs/design_handoff_no_photo/`)
// — see that bundle's README for figure inventory, viewBox conventions,
// per-context sizing, and the corner-monogram rationale.
//
// Figure artwork: the B / Open redraw shipped in `apps/musicians/docs/
// figure-redraw-brief/figures-redrawn-source.md`. Same FIG_LIB keys, same
// 100×140 viewBox, same `.ln / .dot / .keyfill` class contract — only the
// inner SVG markup differs. The redraw was reviewed against the brief's
// constraints (legibility at stroke widths 2.0 → 4.5, head at y≈22, feet
// at y=134) and accepted 2026-05-23.
//
// The pass-3 handoff shipped this as a window-global plain JS module; here
// it's a normal ES module: NoPhotoMark is a real React component, FIG_LIB
// is a strongly-typed map, and the monogram reuses the single `initialsOf`
// from `./duotone` (no duplicate implementation, no particle-skip fork).
//
// Test seam: the `.duo3-mark` wrapper carries `data-no-photo-key` so unit
// tests and the live-prod spec can assert the resolved figure without
// poking SVG inner markup.
import { initialsOf } from './duotone'

/** Stable set of figure keys. `figKey` returns one of these for any input;
 * `FIG_LIB[k]` is total because the record is typed `Record<FigKey, string>`. */
export type FigKey =
  | 'piano'
  | 'organ'
  | 'trumpet'
  | 'trombone'
  | 'sax'
  | 'clarinet'
  | 'flute'
  | 'bass'
  | 'violin'
  | 'guitar'
  | 'drums'
  | 'vibes'
  | 'voice'
  | 'rest'

/** 14 single-weight stroked SVG figures (inner markup only — wrapped in
 * `<svg viewBox="0 0 100 140" preserveAspectRatio="xMidYMax meet">` by
 * `NoPhotoMark`). Stroke width is set via CSS (`.duo3-mark svg .ln`) so
 * each `.mu3` context can tune line weight independently. */
export const FIG_LIB: Record<FigKey, string> = {
  piano: `
      <!-- B.piano · Open · seated profile, hip clearly bent -->
      <ellipse class="ln" cx="30" cy="22" rx="6" ry="7" transform="rotate(-12 30 22)"></ellipse>
      <!-- spine — ends cleanly at hip ~y86 -->
      <path class="ln" d="M 32 30 C 30 50, 28 72, 30 86"></path>
      <!-- short shoulder gesture, gap to spine intentional -->
      <path class="ln" d="M 26 36 Q 34 32, 44 38"></path>
      <!-- long reach to fingertips on keys -->
      <path class="ln" d="M 44 38 C 62 46, 82 56, 96 64"></path>
      <!-- lower-arm hint, shorter -->
      <path class="ln" d="M 40 52 C 54 58, 68 62, 82 64"></path>
      <!-- bench — horizontal plank with two short legs -->
      <line class="ln" x1="14" y1="92" x2="38" y2="92"></line>
      <line class="ln" x1="18" y1="92" x2="18" y2="112"></line>
      <line class="ln" x1="34" y1="92" x2="34" y2="112"></line>
      <!-- front thigh cantilevers off the bench front -->
      <line class="ln" x1="30" y1="88" x2="46" y2="94"></line>
      <!-- front shin -->
      <path class="ln" d="M 46 94 C 48 112, 50 124, 50 134"></path>
      <!-- back thigh + shin -->
      <line class="ln" x1="30" y1="90" x2="24" y2="96"></line>
      <path class="ln" d="M 24 96 C 22 112, 22 124, 22 134"></path>
      <!-- feet -->
      <path class="ln" d="M 16 134 Q 22 131, 28 134"></path>
      <path class="ln" d="M 44 134 Q 50 131, 56 134"></path>
      <!-- keyboard — minimal: two rails + key strip -->
      <line class="ln" x1="56" y1="64" x2="100" y2="64"></line>
      <line class="ln" x1="56" y1="78" x2="100" y2="78"></line>
      <rect class="keyfill" x="62" y="64" width="3.4" height="9"></rect>
      <rect class="keyfill" x="72" y="64" width="3.4" height="9"></rect>
      <rect class="keyfill" x="84" y="64" width="3.4" height="9"></rect>
      <rect class="keyfill" x="93" y="64" width="3.4" height="9"></rect>
    `,
  trumpet: `
      <!-- B.trumpet · Open · standing, head back, horn up-right -->
      <ellipse class="ln" cx="44" cy="24" rx="6" ry="7" transform="rotate(-22 44 24)"></ellipse>
      <path class="ln" d="M 44 32 C 42 56, 42 76, 44 96"></path>
      <path class="ln" d="M 38 34 Q 44 36, 50 34"></path>
      <!-- raised arm to mouthpiece -->
      <path class="ln" d="M 50 34 C 54 26, 56 20, 56 18"></path>
      <!-- trumpet -->
      <line class="ln" x1="56" y1="18" x2="92" y2="6"></line>
      <line class="ln" x1="57" y1="22" x2="92" y2="13"></line>
      <path class="ln" d="M 92 4 L 100 0 L 100 16 L 92 14 Z"></path>
      <circle class="dot" cx="73" cy="13" r="1.3"></circle>
      <circle class="dot" cx="77" cy="12" r="1.3"></circle>
      <circle class="dot" cx="81" cy="11" r="1.3"></circle>
      <!-- hip + legs -->
      <path class="ln" d="M 36 96 Q 44 100, 52 96"></path>
      <path class="ln" d="M 38 96 C 34 114, 30 124, 28 134"></path>
      <path class="ln" d="M 50 96 C 54 114, 58 124, 60 134"></path>
      <line class="ln" x1="22" y1="134" x2="34" y2="134"></line>
      <line class="ln" x1="54" y1="134" x2="66" y2="134"></line>
    `,
  trombone: `
      <!-- B.trombone · Open · standing facing right; bell + slide both forward (right), bell flare opens to the right -->
      <ellipse class="ln" cx="40" cy="24" rx="6" ry="7"></ellipse>
      <path class="ln" d="M 40 32 C 40 56, 40 76, 40 96"></path>
      <path class="ln" d="M 34 34 Q 40 32, 48 34"></path>
      <!-- BELL TUBE — from mouthpiece, up-right, ending in a flare at the far right -->
      <line class="ln" x1="46" y1="22" x2="86" y2="14"></line>
      <path class="ln" d="M 86 12 L 100 7 L 100 21 L 86 18 Z"></path>
      <!-- SLIDE ASSEMBLY — two parallel tubes going right from mouthpiece, with the u-loop at the far end -->
      <line class="ln" x1="46" y1="26" x2="86" y2="24"></line>
      <path class="ln" d="M 86 24 Q 90 24, 90 28 Q 90 32, 86 32"></path>
      <line class="ln" x1="86" y1="32" x2="48" y2="34"></line>
      <!-- thin strut connecting bell rim back to slide assembly (the brace) -->
      <line class="ln" x1="86" y1="18" x2="86" y2="24" opacity="0.55"></line>
      <!-- slide-hand grip dot at far end of the slide -->
      <circle class="dot" cx="82" cy="28" r="1.4"></circle>
      <!-- hip + legs -->
      <path class="ln" d="M 34 96 Q 40 100, 48 96"></path>
      <path class="ln" d="M 36 96 C 32 114, 28 124, 26 134"></path>
      <path class="ln" d="M 48 96 C 52 114, 56 124, 58 134"></path>
      <line class="ln" x1="20" y1="134" x2="32" y2="134"></line>
      <line class="ln" x1="52" y1="134" x2="64" y2="134"></line>
    `,
  sax: `
      <!-- B.sax · Open · standing, sax body as TWO J-curves that widen toward the bell -->
      <ellipse class="ln" cx="42" cy="24" rx="6" ry="7"></ellipse>
      <path class="ln" d="M 42 32 C 42 56, 42 76, 42 96"></path>
      <path class="ln" d="M 36 34 Q 42 32, 50 36"></path>
      <!-- sax neck — two short parallels out of the mouth -->
      <line class="ln" x1="46" y1="30" x2="52" y2="38"></line>
      <line class="ln" x1="49" y1="28" x2="55" y2="36"></line>
      <!-- ONE arm wrapping from the shoulder down around the sax body -->
      <path class="ln" d="M 36 38 C 30 56, 32 76, 44 88"></path>
      <!-- two hands as dots ON the body — upper grip + lower grip -->
      <circle class="dot" cx="50" cy="60" r="1.5"></circle>
      <circle class="dot" cx="48" cy="86" r="1.5"></circle>
      <!-- OUTER J-curve — narrow at the neck, splays wider through the body to the bell rim -->
      <path class="ln" d="M 50 38 C 52 52, 56 66, 58 78 C 60 90, 64 98, 74 98 C 86 98, 92 88, 92 76 L 100 60"></path>
      <!-- INNER J-curve — hugs tighter, ends at the bell throat -->
      <path class="ln" d="M 56 38 C 58 50, 62 64, 64 76 C 66 86, 68 92, 72 92 C 78 92, 78 86, 78 76 L 84 64"></path>
      <!-- bell rim line — closes the bell mouth between the two J-ends -->
      <line class="ln" x1="84" y1="64" x2="100" y2="60"></line>
      <!-- key dots running down between the parallels -->
      <circle class="dot" cx="61" cy="54" r="0.9"></circle>
      <circle class="dot" cx="63" cy="66" r="0.9"></circle>
      <circle class="dot" cx="65" cy="78" r="0.9"></circle>
      <!-- hip + legs -->
      <path class="ln" d="M 36 96 Q 42 100, 50 96"></path>
      <path class="ln" d="M 38 96 C 34 114, 30 124, 28 134"></path>
      <path class="ln" d="M 50 96 C 54 114, 58 124, 60 134"></path>
      <line class="ln" x1="22" y1="134" x2="34" y2="134"></line>
      <line class="ln" x1="54" y1="134" x2="66" y2="134"></line>
    `,
  clarinet: `
      <!-- B.clarinet · Open · standing, two-line clarinet tube, ONE arm wrapping to the lower grip -->
      <ellipse class="ln" cx="44" cy="24" rx="6" ry="7"></ellipse>
      <path class="ln" d="M 44 32 C 44 56, 44 76, 44 96"></path>
      <path class="ln" d="M 38 34 Q 44 32, 50 34"></path>
      <!-- clarinet body — two parallel verticals (tube) -->
      <line class="ln" x1="49" y1="30" x2="51" y2="80"></line>
      <line class="ln" x1="53" y1="30" x2="55" y2="80"></line>
      <!-- bell at the bottom -->
      <path class="ln" d="M 47 80 L 57 80 L 59 86 L 45 86 Z"></path>
      <!-- ONE arm wrapping from shoulder around to the lower grip -->
      <path class="ln" d="M 38 36 C 34 50, 38 64, 50 68"></path>
      <!-- two hands as dots ON the clarinet — upper grip + lower grip -->
      <circle class="dot" cx="50" cy="48" r="1.5"></circle>
      <circle class="dot" cx="50" cy="68" r="1.5"></circle>
      <!-- minimal key dots -->
      <circle class="dot" cx="54" cy="40" r="0.9"></circle>
      <circle class="dot" cx="54" cy="58" r="0.9"></circle>
      <circle class="dot" cx="54" cy="74" r="0.9"></circle>
      <!-- hip + legs -->
      <path class="ln" d="M 38 96 Q 44 100, 52 96"></path>
      <path class="ln" d="M 40 96 C 36 114, 32 124, 30 134"></path>
      <path class="ln" d="M 50 96 C 54 114, 58 124, 60 134"></path>
      <line class="ln" x1="24" y1="134" x2="36" y2="134"></line>
      <line class="ln" x1="54" y1="134" x2="66" y2="134"></line>
    `,
  flute: `
      <!-- B.flute · Open · standing, flute horizontal across face -->
      <ellipse class="ln" cx="44" cy="24" rx="6" ry="7"></ellipse>
      <path class="ln" d="M 44 32 C 44 56, 44 76, 44 96"></path>
      <path class="ln" d="M 38 34 Q 44 32, 50 34"></path>
      <!-- flute body, horizontal, two parallels (it's a tube, but at this weight one stroke would read as bare) -->
      <line class="ln" x1="52" y1="22" x2="92" y2="22"></line>
      <line class="ln" x1="52" y1="26" x2="92" y2="26"></line>
      <!-- mouthpiece circle at left end -->
      <circle class="ln" cx="53" cy="24" r="1.4"></circle>
      <!-- key dots along the body -->
      <circle class="dot" cx="64" cy="24" r="0.9"></circle>
      <circle class="dot" cx="72" cy="24" r="0.9"></circle>
      <circle class="dot" cx="80" cy="24" r="0.9"></circle>
      <circle class="dot" cx="88" cy="24" r="0.9"></circle>
      <!-- two arms reaching up to flute -->
      <path class="ln" d="M 48 36 C 56 30, 64 26, 68 24"></path>
      <path class="ln" d="M 44 42 C 56 34, 70 28, 84 24"></path>
      <!-- hip + legs -->
      <path class="ln" d="M 38 96 Q 44 100, 52 96"></path>
      <path class="ln" d="M 40 96 C 36 114, 32 124, 30 134"></path>
      <path class="ln" d="M 50 96 C 54 114, 58 124, 60 134"></path>
      <line class="ln" x1="24" y1="134" x2="36" y2="134"></line>
      <line class="ln" x1="54" y1="134" x2="66" y2="134"></line>
    `,
  bass: `
      <!-- B.bass · Open · player at left, single spine, simple pear body -->
      <ellipse class="ln" cx="22" cy="26" rx="6" ry="7" transform="rotate(16 22 26)"></ellipse>
      <path class="ln" d="M 22 34 C 22 56, 22 80, 24 100"></path>
      <path class="ln" d="M 16 36 Q 22 32, 30 38"></path>
      <!-- upper arm up to fingerboard -->
      <path class="ln" d="M 30 38 C 38 30, 46 24, 52 22"></path>
      <!-- lower arm to bridge -->
      <path class="ln" d="M 28 52 C 40 60, 52 76, 60 92"></path>
      <!-- bass scroll -->
      <path class="ln" d="M 52 18 Q 47 18, 47 22 Q 47 26, 52 24"></path>
      <!-- bass neck — single line -->
      <line class="ln" x1="52" y1="24" x2="64" y2="62"></line>
      <!-- bass body — open pear -->
      <path class="ln" d="M 64 62 C 84 64, 88 84, 84 102 C 78 122, 64 124, 56 114 C 48 100, 50 76, 58 64 C 62 62, 64 62, 64 62 Z"></path>
      <!-- bridge -->
      <line class="ln" x1="62" y1="98" x2="74" y2="98"></line>
      <!-- single faded string -->
      <line class="ln" x1="68" y1="22" x2="69" y2="116" opacity="0.4"></line>
      <!-- hip line -->
      <path class="ln" d="M 16 100 Q 22 102, 30 100"></path>
      <!-- legs -->
      <path class="ln" d="M 18 100 C 14 114, 12 124, 12 134"></path>
      <path class="ln" d="M 28 100 C 30 114, 32 124, 32 134"></path>
      <line class="ln" x1="6" y1="134" x2="18" y2="134"></line>
      <line class="ln" x1="26" y1="134" x2="38" y2="134"></line>
    `,
  violin: `
      <!-- B.violin · Open · violin tucked under chin, scroll up-right, long bow drawn across -->
      <ellipse class="ln" cx="46" cy="22" rx="6" ry="7" transform="rotate(-18 46 22)"></ellipse>
      <path class="ln" d="M 46 32 C 46 56, 46 76, 46 96"></path>
      <path class="ln" d="M 40 34 Q 46 32, 52 34"></path>
      <!-- violin body — angled ellipse tucked under chin -->
      <ellipse class="ln" cx="62" cy="32" rx="11" ry="6.5" transform="rotate(20 62 32)"></ellipse>
      <!-- NECK — two parallel strokes extending up-right from body to scroll -->
      <line class="ln" x1="70" y1="26" x2="84" y2="20"></line>
      <line class="ln" x1="72" y1="30" x2="86" y2="24"></line>
      <!-- SCROLL at the end of the neck -->
      <path class="ln" d="M 84 20 Q 90 19, 90 23 Q 90 27, 84 26"></path>
      <!-- BOW — long, clearly horizontal across the strings -->
      <line class="ln" x1="34" y1="46" x2="86" y2="34"></line>
      <!-- bow frog (left hand grip end) -->
      <path class="ln" d="M 34 46 Q 30 48, 34 50"></path>
      <!-- bow tip dot -->
      <circle class="dot" cx="86" cy="34" r="1"></circle>
      <!-- bowing arm from shoulder to bow frog -->
      <path class="ln" d="M 38 36 C 36 40, 34 44, 34 46"></path>
      <!-- one faded string running the length of the instrument -->
      <line class="ln" x1="54" y1="34" x2="86" y2="22" opacity="0.4"></line>
      <!-- hip + legs -->
      <path class="ln" d="M 40 96 Q 46 100, 52 96"></path>
      <path class="ln" d="M 42 96 C 38 114, 34 124, 32 134"></path>
      <path class="ln" d="M 50 96 C 54 114, 58 124, 60 134"></path>
      <line class="ln" x1="26" y1="134" x2="38" y2="134"></line>
      <line class="ln" x1="54" y1="134" x2="66" y2="134"></line>
    `,
  guitar: `
      <!-- B.guitar · Open · seated 3/4, guitar diagonal across the lap -->
      <ellipse class="ln" cx="28" cy="22" rx="6" ry="7"></ellipse>
      <path class="ln" d="M 28 30 C 26 50, 24 70, 26 86"></path>
      <path class="ln" d="M 22 34 Q 30 32, 38 36"></path>
      <!-- guitar body — oval across lap -->
      <ellipse class="ln" cx="56" cy="76" rx="17" ry="13" transform="rotate(-22 56 76)"></ellipse>
      <!-- sound hole -->
      <circle class="ln" cx="54" cy="76" r="3.5"></circle>
      <!-- bridge tick -->
      <line class="ln" x1="46" y1="82" x2="54" y2="86"></line>
      <!-- neck up-right -->
      <line class="ln" x1="68" y1="62" x2="92" y2="36"></line>
      <line class="ln" x1="71" y1="64" x2="95" y2="38"></line>
      <!-- headstock -->
      <path class="ln" d="M 92 34 L 100 26 L 102 28 L 94 36 Z"></path>
      <!-- one faded string running from bridge along the neck to the headstock -->
      <line class="ln" x1="48" y1="82" x2="96" y2="30" opacity="0.4"></line>
      <!-- fretting hand high on neck -->
      <circle class="dot" cx="84" cy="48" r="1.8"></circle>
      <!-- strumming hand at sound hole -->
      <circle class="dot" cx="52" cy="74" r="1.8"></circle>
      <!-- arm to fretting hand -->
      <path class="ln" d="M 38 38 C 52 38, 70 44, 84 48"></path>
      <!-- arm to strumming hand -->
      <path class="ln" d="M 30 52 C 38 58, 44 66, 50 74"></path>
      <!-- stool / bench -->
      <line class="ln" x1="10" y1="92" x2="34" y2="92"></line>
      <line class="ln" x1="14" y1="92" x2="12" y2="112"></line>
      <line class="ln" x1="30" y1="92" x2="32" y2="112"></line>
      <!-- front thigh -->
      <line class="ln" x1="28" y1="88" x2="42" y2="100"></line>
      <!-- front shin -->
      <path class="ln" d="M 42 100 C 44 116, 44 126, 44 134"></path>
      <!-- back thigh + shin -->
      <line class="ln" x1="28" y1="90" x2="22" y2="96"></line>
      <path class="ln" d="M 22 96 C 20 114, 18 124, 18 134"></path>
      <!-- feet -->
      <path class="ln" d="M 12 134 Q 18 131, 24 134"></path>
      <path class="ln" d="M 38 134 Q 44 131, 50 134"></path>
    `,
  drums: `
      <!-- B.drums · Open · seated, facing viewer, snare in front -->
      <ellipse class="ln" cx="50" cy="22" rx="6" ry="7"></ellipse>
      <!-- short spine to where snare hides the body -->
      <path class="ln" d="M 50 30 C 50 50, 50 70, 50 86"></path>
      <!-- shoulder -->
      <path class="ln" d="M 42 34 Q 50 32, 58 34"></path>
      <!-- raised arm with stick, left -->
      <path class="ln" d="M 42 34 C 32 28, 22 22, 14 14"></path>
      <line class="ln" x1="14" y1="14" x2="6" y2="6"></line>
      <circle class="dot" cx="6" cy="6" r="1.5"></circle>
      <!-- raised arm with stick, right -->
      <path class="ln" d="M 58 34 C 68 28, 78 22, 86 14"></path>
      <line class="ln" x1="86" y1="14" x2="94" y2="6"></line>
      <circle class="dot" cx="94" cy="6" r="1.5"></circle>
      <!-- snare drum — ellipse top + side cylinder -->
      <ellipse class="ln" cx="50" cy="92" rx="22" ry="6"></ellipse>
      <line class="ln" x1="28" y1="92" x2="28" y2="108"></line>
      <line class="ln" x1="72" y1="92" x2="72" y2="108"></line>
      <line class="ln" x1="28" y1="108" x2="72" y2="108"></line>
      <!-- three faded lug ticks on snare side -->
      <line class="ln" x1="38" y1="92" x2="38" y2="108" opacity="0.45"></line>
      <line class="ln" x1="50" y1="92" x2="50" y2="108" opacity="0.45"></line>
      <line class="ln" x1="62" y1="92" x2="62" y2="108" opacity="0.45"></line>
      <!-- hi-hat (left) -->
      <ellipse class="ln" cx="14" cy="62" rx="6" ry="2"></ellipse>
      <line class="ln" x1="14" y1="64" x2="14" y2="82"></line>
      <!-- ride/crash (right) -->
      <ellipse class="ln" cx="86" cy="38" rx="9" ry="2.5"></ellipse>
      <line class="ln" x1="86" y1="40.5" x2="86" y2="62"></line>
      <line class="ln" x1="82" y1="62" x2="90" y2="62"></line>
      <!-- player legs visible to either side of snare -->
      <path class="ln" d="M 38 96 C 32 110, 26 124, 22 134"></path>
      <path class="ln" d="M 62 96 C 68 110, 74 124, 78 134"></path>
      <!-- feet -->
      <line class="ln" x1="16" y1="134" x2="28" y2="134"></line>
      <line class="ln" x1="72" y1="134" x2="84" y2="134"></line>
    `,
  vibes: `
      <!-- B.vibes · Open · standing at vibraphone, mallets over horizontal bars -->
      <ellipse class="ln" cx="50" cy="22" rx="6" ry="7"></ellipse>
      <!-- short spine — vibes frame hides below the waist -->
      <path class="ln" d="M 50 30 C 50 50, 50 70, 50 84"></path>
      <path class="ln" d="M 42 34 Q 50 32, 58 34"></path>
      <!-- arms reaching forward+out holding mallets -->
      <path class="ln" d="M 42 36 C 36 46, 32 58, 28 70"></path>
      <path class="ln" d="M 58 36 C 64 46, 68 58, 72 70"></path>
      <!-- mallet shafts -->
      <line class="ln" x1="28" y1="70" x2="26" y2="80"></line>
      <line class="ln" x1="72" y1="70" x2="74" y2="80"></line>
      <!-- mallet heads -->
      <circle class="dot" cx="26" cy="82" r="2.4"></circle>
      <circle class="dot" cx="74" cy="82" r="2.4"></circle>
      <!-- vibe bars: two horizontal rails + verticals between keys -->
      <line class="ln" x1="14" y1="88" x2="86" y2="88"></line>
      <line class="ln" x1="14" y1="94" x2="86" y2="94"></line>
      <line class="ln" x1="22" y1="88" x2="22" y2="94"></line>
      <line class="ln" x1="30" y1="88" x2="30" y2="94"></line>
      <line class="ln" x1="38" y1="88" x2="38" y2="94"></line>
      <line class="ln" x1="46" y1="88" x2="46" y2="94"></line>
      <line class="ln" x1="54" y1="88" x2="54" y2="94"></line>
      <line class="ln" x1="62" y1="88" x2="62" y2="94"></line>
      <line class="ln" x1="70" y1="88" x2="70" y2="94"></line>
      <line class="ln" x1="78" y1="88" x2="78" y2="94"></line>
      <!-- frame -->
      <line class="ln" x1="16" y1="94" x2="14" y2="118"></line>
      <line class="ln" x1="84" y1="94" x2="86" y2="118"></line>
      <line class="ln" x1="14" y1="118" x2="86" y2="118"></line>
      <!-- legs visible below the frame -->
      <line class="ln" x1="44" y1="120" x2="42" y2="134"></line>
      <line class="ln" x1="56" y1="120" x2="58" y2="134"></line>
      <line class="ln" x1="36" y1="134" x2="48" y2="134"></line>
      <line class="ln" x1="52" y1="134" x2="64" y2="134"></line>
    `,
  organ: `
      <!-- B.organ · Open · seated profile, two manuals + drawbar strip -->
      <ellipse class="ln" cx="30" cy="22" rx="6" ry="7" transform="rotate(-12 30 22)"></ellipse>
      <path class="ln" d="M 32 30 C 30 50, 28 72, 30 86"></path>
      <path class="ln" d="M 26 36 Q 34 32, 44 38"></path>
      <!-- arms to upper + lower manual -->
      <path class="ln" d="M 44 38 C 60 42, 78 46, 96 48"></path>
      <path class="ln" d="M 42 50 C 58 54, 74 58, 90 60"></path>
      <!-- bench -->
      <line class="ln" x1="14" y1="92" x2="38" y2="92"></line>
      <line class="ln" x1="18" y1="92" x2="18" y2="112"></line>
      <line class="ln" x1="34" y1="92" x2="34" y2="112"></line>
      <!-- legs -->
      <line class="ln" x1="30" y1="88" x2="46" y2="94"></line>
      <path class="ln" d="M 46 94 C 48 112, 50 124, 50 134"></path>
      <line class="ln" x1="30" y1="90" x2="24" y2="96"></line>
      <path class="ln" d="M 24 96 C 22 112, 22 124, 22 134"></path>
      <!-- feet -->
      <path class="ln" d="M 16 134 Q 22 131, 28 134"></path>
      <path class="ln" d="M 44 134 Q 50 131, 56 134"></path>
      <!-- drawbar strip on top of console -->
      <line class="ln" x1="60" y1="32" x2="98" y2="32"></line>
      <line class="ln" x1="64" y1="26" x2="64" y2="34"></line>
      <line class="ln" x1="70" y1="26" x2="70" y2="34"></line>
      <line class="ln" x1="76" y1="26" x2="76" y2="34"></line>
      <line class="ln" x1="82" y1="26" x2="82" y2="34"></line>
      <line class="ln" x1="88" y1="26" x2="88" y2="34"></line>
      <line class="ln" x1="94" y1="26" x2="94" y2="34"></line>
      <!-- upper manual -->
      <line class="ln" x1="56" y1="40" x2="100" y2="40"></line>
      <line class="ln" x1="56" y1="52" x2="100" y2="52"></line>
      <rect class="keyfill" x="62" y="40" width="3" height="8"></rect>
      <rect class="keyfill" x="72" y="40" width="3" height="8"></rect>
      <rect class="keyfill" x="84" y="40" width="3" height="8"></rect>
      <rect class="keyfill" x="93" y="40" width="3" height="8"></rect>
      <!-- lower manual -->
      <line class="ln" x1="56" y1="58" x2="100" y2="58"></line>
      <line class="ln" x1="56" y1="70" x2="100" y2="70"></line>
      <rect class="keyfill" x="62" y="58" width="3" height="8"></rect>
      <rect class="keyfill" x="72" y="58" width="3" height="8"></rect>
      <rect class="keyfill" x="84" y="58" width="3" height="8"></rect>
      <rect class="keyfill" x="93" y="58" width="3" height="8"></rect>
    `,
  voice: `
      <!-- B.voice · Open · vocalist, mic raised to face -->
      <ellipse class="ln" cx="44" cy="22" rx="6" ry="7" transform="rotate(-8 44 22)"></ellipse>
      <path class="ln" d="M 44 30 C 44 56, 44 76, 44 96"></path>
      <path class="ln" d="M 38 34 Q 44 32, 52 34"></path>
      <!-- raised arm to mic -->
      <path class="ln" d="M 52 34 C 60 28, 66 22, 70 18"></path>
      <!-- mic capsule -->
      <ellipse class="ln" cx="75" cy="13" rx="4" ry="5.5" transform="rotate(32 75 13)"></ellipse>
      <!-- mic grille line -->
      <line class="ln" x1="71" y1="14" x2="79" y2="11" opacity="0.55"></line>
      <!-- other arm relaxed at side -->
      <path class="ln" d="M 40 36 C 38 52, 36 66, 40 78"></path>
      <!-- hip + legs -->
      <path class="ln" d="M 38 96 Q 44 100, 50 96"></path>
      <path class="ln" d="M 40 96 C 36 114, 32 124, 30 134"></path>
      <path class="ln" d="M 50 96 C 54 114, 58 124, 60 134"></path>
      <line class="ln" x1="24" y1="134" x2="36" y2="134"></line>
      <line class="ln" x1="54" y1="134" x2="66" y2="134"></line>
    `,
  rest: `
      <!-- B.rest · Open · figure at ease, arms folded, ? above the head -->
      <ellipse class="ln" cx="50" cy="24" rx="6" ry="7" transform="rotate(6 50 24)"></ellipse>
      <!-- question-mark glyph (single curve + a dot) -->
      <path class="ln" d="M 48 10 Q 48 5, 52 5 Q 56 5, 56 9 Q 56 12, 53 13"></path>
      <circle class="dot" cx="53" cy="15.5" r="0.9"></circle>
      <path class="ln" d="M 50 32 C 50 56, 50 76, 50 96"></path>
      <path class="ln" d="M 42 36 Q 50 34, 58 36"></path>
      <!-- crossed forearms across the torso -->
      <path class="ln" d="M 42 36 C 48 46, 56 50, 60 46"></path>
      <path class="ln" d="M 58 36 C 52 46, 44 50, 40 46"></path>
      <!-- hands at the elbows -->
      <circle class="dot" cx="60" cy="46" r="1"></circle>
      <circle class="dot" cx="40" cy="46" r="1"></circle>
      <!-- hip + legs -->
      <path class="ln" d="M 44 96 Q 50 100, 56 96"></path>
      <path class="ln" d="M 44 96 C 40 114, 36 124, 34 134"></path>
      <path class="ln" d="M 56 96 C 60 114, 64 124, 66 134"></path>
      <line class="ln" x1="28" y1="134" x2="40" y2="134"></line>
      <line class="ln" x1="60" y1="134" x2="72" y2="134"></line>
    `,
}

/** Map a free-form instrument string to a figure key. Substring match,
 * case-insensitive, specific keys checked first. Unknown / empty / em-dash
 * / null / undefined → `'rest'` (the discreet question-mark figure). Order
 * matters: "bass clarinet" must hit the clarinet branch before the bass
 * branch, "trombone" before "trumpet" etc. */
export function figKey(inst?: string | null): FigKey {
  if (inst === undefined || inst === null) return 'rest'
  const i = inst.toLowerCase().trim()
  if (i === '' || i === '—') return 'rest'
  // Brass — specific shapes before the catch-alls
  if (i.includes('trombone')) return 'trombone'
  if (i.includes('trumpet') || i.includes('cornet') || i.includes('flugel'))
    return 'trumpet'
  // `horn` stays ahead of the `sax` branch below so "saxhorn" (a conical
  // brass) resolves to brass, not saxophone — pinned in the test suite.
  if (i.includes('tuba') || i.includes('horn')) return 'trumpet'
  // Woodwinds — clarinet matches "bass clarinet" before bass.
  if (i.includes('clarinet') || i.includes('oboe') || i.includes('bassoon'))
    return 'clarinet'
  if (i.includes('flute') || i.includes('piccolo')) return 'flute'
  if (i.includes('sax')) return 'sax'
  // Strings
  if (i.includes('violin') || i.includes('fiddle') || i.includes('viola'))
    return 'violin'
  if (i.includes('cello') || i.includes('contrabass') || i.includes('bass'))
    return 'bass'
  if (
    i.includes('guitar') ||
    i.includes('banjo') ||
    i.includes('mandolin') ||
    i.includes('ukulele')
  )
    return 'guitar'
  if (i.includes('harp')) return 'violin'
  // Keys — organ specifically before piano (Hammond).
  if (i.includes('organ') || i.includes('hammond')) return 'organ'
  if (
    i.includes('piano') ||
    i.includes('keys') ||
    i.includes('keyboard') ||
    i.includes('rhodes') ||
    i.includes('wurlitzer')
  )
    return 'piano'
  // Percussion — vibes (vibraphone/marimba/xylo) before generic drums.
  if (i.includes('vib') || i.includes('marimba') || i.includes('xylo'))
    return 'vibes'
  if (i.includes('drum') || i.includes('percussion') || i.includes('cymbal'))
    return 'drums'
  // Voice
  if (
    i.includes('voc') ||
    i.includes('voice') ||
    i.includes('sing') ||
    i.includes('scat')
  )
    return 'voice'
  return 'rest'
}

type NoPhotoMarkProps = {
  /** Free-form instrument string from the data layer; figure resolves via
   * `figKey`. Omit / pass `undefined` → renders the `rest` figure. */
  inst?: string | null
  /** When provided, a 1–2 letter mono monogram renders in the corner. The
   * monogram is intentionally hidden at dense sizes (`.conn`, `.ident`,
   * `.suggest-row`) by CSS; the name lives alongside the tile there. */
  name?: string
  /** Forwarded to the wrapper `<div>` so per-context overrides keep working
   * when callers compose extra class names. */
  className?: string
}

/** Editorial single-line figure overlaid on a `<Duo3>` field when no
 * portrait exists. Rendered absolutely-positioned (`pointer-events: none`)
 * inside the duotone tile; carries `aria-hidden="true"` because the parent
 * already exposes the musician's name. */
export function NoPhotoMark({
  inst,
  name,
  className = '',
}: NoPhotoMarkProps) {
  const key = figKey(inst)
  const inner = FIG_LIB[key]
  const monogram = name ? initialsOf(name) : ''
  const wrapperClass = className
    ? `duo3-mark ${className}`
    : 'duo3-mark'
  return (
    <div
      className={wrapperClass}
      aria-hidden="true"
      data-no-photo-key={key}
    >
      <svg
        viewBox="0 0 100 140"
        preserveAspectRatio="xMidYMax meet"
        dangerouslySetInnerHTML={{ __html: inner }}
      />
      {monogram && <span className="duo3-mark-ini">{monogram}</span>}
    </div>
  )
}
