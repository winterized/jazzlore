// No-photo figure library — editorial single-line instrument figures used
// inside `<Duo3>` when a musician has no portrait. Ported from the
// 2026-05-23 design handoff (`apps/musicians/docs/design_handoff_no_photo/`)
// — see that bundle's README for figure inventory, viewBox conventions,
// per-context sizing, and the corner-monogram rationale.
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
 * `NoPhotoMark`). Lifted verbatim from the design handoff. Stroke width is
 * set via CSS (`.duo3-mark svg .ln`) so each `.mu3` context can tune line
 * weight independently. */
export const FIG_LIB: Record<FigKey, string> = {
  piano: `
      <line class="ln" x1="22" y1="98" x2="22" y2="108"></line>
      <line class="ln" x1="50" y1="98" x2="50" y2="108"></line>
      <line class="ln" x1="18" y1="98" x2="54" y2="98"></line>
      <path  class="ln" d="M 34 100 C 31 114, 28 124, 26 134"></path>
      <path  class="ln" d="M 44 100 C 47 114, 52 126, 56 136"></path>
      <line  class="ln" x1="20" y1="134" x2="30" y2="134"></line>
      <line  class="ln" x1="52" y1="136" x2="62" y2="136"></line>
      <path  class="ln" d="M 36 28 C 32 42, 32 64, 36 98"></path>
      <path  class="ln" d="M 46 28 C 47 42, 48 60, 46 78"></path>
      <ellipse class="ln" cx="41" cy="20" rx="6.5" ry="7.5"></ellipse>
      <path  class="ln" d="M 47 19 L 49 21 L 48 23"></path>
      <path  class="ln" d="M 36 14 Q 42 10, 47 14"></path>
      <path  class="ln" d="M 44 32 C 56 36, 68 42, 78 50"></path>
      <path  class="ln" d="M 78 50 L 86 54"></path>
      <path  class="ln" d="M 45 40 C 56 44, 68 50, 78 56"></path>
      <path  class="ln" d="M 78 56 L 86 60"></path>
      <line  class="ln" x1="58" y1="54" x2="100" y2="54"></line>
      <line  class="ln" x1="58" y1="62" x2="100" y2="62"></line>
      <rect class="keyfill" x="64" y="54" width="3.5" height="5"></rect>
      <rect class="keyfill" x="71" y="54" width="3.5" height="5"></rect>
      <rect class="keyfill" x="80" y="54" width="3.5" height="5"></rect>
      <rect class="keyfill" x="87" y="54" width="3.5" height="5"></rect>
      <rect class="keyfill" x="94" y="54" width="3.5" height="5"></rect>
      <line  class="ln" x1="58" y1="62" x2="58" y2="74"></line>
      <line  class="ln" x1="100" y1="62" x2="100" y2="74"></line>
      <line  class="ln" x1="58" y1="74" x2="100" y2="74"></line>
    `,
  trumpet: `
      <ellipse class="ln" cx="46" cy="22" rx="6.5" ry="7.5" transform="rotate(-8 46 22)"></ellipse>
      <path class="ln" d="M 42 16 Q 47 12, 51 17"></path>
      <path class="ln" d="M 40 32 C 38 50, 38 70, 40 88"></path>
      <path class="ln" d="M 54 32 C 56 50, 56 70, 54 88"></path>
      <path class="ln" d="M 40 78 Q 47 80, 54 78" opacity="0.8"></path>
      <path class="ln" d="M 41 36 C 46 32, 54 28, 60 22"></path>
      <path class="ln" d="M 53 36 C 60 30, 70 24, 78 18"></path>
      <line class="ln" x1="55" y1="18" x2="92" y2="10"></line>
      <line class="ln" x1="56" y1="22" x2="92" y2="14"></line>
      <path class="ln" d="M 92 8 L 99 4 L 99 18 L 92 16 Z"></path>
      <line class="ln" x1="68" y1="16" x2="68" y2="12"></line>
      <line class="ln" x1="73" y1="15" x2="73" y2="11"></line>
      <line class="ln" x1="78" y1="14" x2="78" y2="10"></line>
      <circle class="dot" cx="68" cy="11" r="1.2"></circle>
      <circle class="dot" cx="73" cy="10" r="1.2"></circle>
      <circle class="dot" cx="78" cy="9" r="1.2"></circle>
      <path class="ln" d="M 40 88 C 38 104, 38 120, 40 134"></path>
      <path class="ln" d="M 54 88 C 56 104, 56 120, 54 134"></path>
      <line class="ln" x1="34" y1="134" x2="42" y2="134"></line>
      <line class="ln" x1="50" y1="134" x2="58" y2="134"></line>
    `,
  trombone: `
      <ellipse class="ln" cx="40" cy="22" rx="6.5" ry="7.5"></ellipse>
      <path class="ln" d="M 36 16 Q 41 12, 46 16"></path>
      <path class="ln" d="M 34 32 C 32 50, 32 70, 34 88"></path>
      <path class="ln" d="M 48 32 C 50 50, 50 70, 48 88"></path>
      <path class="ln" d="M 36 36 C 39 30, 42 26, 46 24"></path>
      <path class="ln" d="M 48 38 C 60 34, 74 28, 88 22"></path>
      <line class="ln" x1="46" y1="22" x2="92" y2="14"></line>
      <line class="ln" x1="47" y1="26" x2="92" y2="18"></line>
      <path class="ln" d="M 92 14 Q 98 13, 98 17 Q 98 21, 92 22"></path>
      <line class="ln" x1="92" y1="22" x2="58" y2="30"></line>
      <line class="ln" x1="92" y1="18" x2="56" y2="26" opacity="0.5"></line>
      <path class="ln" d="M 30 22 L 18 17 L 18 31 L 30 27 Z"></path>
      <circle class="dot" cx="88" cy="18" r="1.4"></circle>
      <path class="ln" d="M 34 88 C 32 104, 32 120, 34 134"></path>
      <path class="ln" d="M 48 88 C 50 104, 50 120, 48 134"></path>
      <line class="ln" x1="28" y1="134" x2="36" y2="134"></line>
      <line class="ln" x1="44" y1="134" x2="52" y2="134"></line>
    `,
  sax: `
      <ellipse class="ln" cx="42" cy="22" rx="6.5" ry="7.5"></ellipse>
      <path class="ln" d="M 38 16 Q 42 12, 47 16"></path>
      <path class="ln" d="M 36 32 C 34 50, 34 70, 36 88"></path>
      <path class="ln" d="M 50 32 C 52 50, 52 70, 50 88"></path>
      <line class="ln" x1="46" y1="28" x2="52" y2="36"></line>
      <path class="ln" d="M 52 36 C 56 46, 60 58, 62 70 C 64 84, 62 96, 68 98 C 76 98, 76 90, 76 80 L 76 70"></path>
      <path class="ln" d="M 74 64 L 90 60 L 90 82 L 74 78 Z"></path>
      <circle class="dot" cx="60" cy="56" r="0.9"></circle>
      <circle class="dot" cx="61" cy="64" r="0.9"></circle>
      <circle class="dot" cx="62" cy="72" r="0.9"></circle>
      <circle class="dot" cx="63" cy="80" r="0.9"></circle>
      <path class="ln" d="M 38 36 C 42 32, 46 30, 48 28"></path>
      <path class="ln" d="M 50 38 C 54 42, 58 50, 60 56"></path>
      <path class="ln" d="M 50 56 C 54 60, 58 64, 60 70"></path>
      <path class="ln" d="M 36 88 C 34 104, 34 120, 36 134"></path>
      <path class="ln" d="M 50 88 C 52 104, 52 120, 50 134"></path>
      <line class="ln" x1="30" y1="134" x2="38" y2="134"></line>
      <line class="ln" x1="46" y1="134" x2="54" y2="134"></line>
    `,
  clarinet: `
      <ellipse class="ln" cx="50" cy="22" rx="6.5" ry="7.5"></ellipse>
      <path class="ln" d="M 46 16 Q 50 12, 55 16"></path>
      <path class="ln" d="M 44 32 C 42 50, 42 70, 44 88"></path>
      <path class="ln" d="M 56 32 C 58 50, 58 70, 56 88"></path>
      <line class="ln" x1="51" y1="28" x2="53" y2="78"></line>
      <line class="ln" x1="55" y1="28" x2="57" y2="78"></line>
      <path class="ln" d="M 49 78 L 60 78 L 62 86 L 47 86 Z"></path>
      <path class="ln" d="M 44 42 C 48 42, 51 44, 52 48"></path>
      <path class="ln" d="M 58 44 C 58 44, 56 46, 56 48"></path>
      <path class="ln" d="M 44 58 C 48 58, 51 60, 52 64"></path>
      <path class="ln" d="M 58 60 C 58 60, 56 62, 56 64"></path>
      <circle class="dot" cx="54" cy="40" r="0.8"></circle>
      <circle class="dot" cx="54" cy="48" r="0.8"></circle>
      <circle class="dot" cx="54" cy="56" r="0.8"></circle>
      <circle class="dot" cx="54" cy="64" r="0.8"></circle>
      <circle class="dot" cx="54" cy="72" r="0.8"></circle>
      <path class="ln" d="M 44 88 C 42 104, 42 120, 44 134"></path>
      <path class="ln" d="M 56 88 C 58 104, 58 120, 56 134"></path>
      <line class="ln" x1="40" y1="134" x2="48" y2="134"></line>
      <line class="ln" x1="52" y1="134" x2="60" y2="134"></line>
    `,
  flute: `
      <ellipse class="ln" cx="48" cy="22" rx="6.5" ry="7.5"></ellipse>
      <path class="ln" d="M 44 16 Q 48 12, 53 16"></path>
      <path class="ln" d="M 42 32 C 40 50, 40 70, 42 88"></path>
      <path class="ln" d="M 54 32 C 56 50, 56 70, 54 88"></path>
      <line class="ln" x1="54" y1="21" x2="94" y2="21"></line>
      <line class="ln" x1="54" y1="25" x2="94" y2="25"></line>
      <circle class="ln" cx="55" cy="23" r="1.4"></circle>
      <circle class="dot" cx="64" cy="23" r="0.8"></circle>
      <circle class="dot" cx="72" cy="23" r="0.8"></circle>
      <circle class="dot" cx="80" cy="23" r="0.8"></circle>
      <circle class="dot" cx="88" cy="23" r="0.8"></circle>
      <path class="ln" d="M 51 36 C 56 30, 60 26, 66 22"></path>
      <path class="ln" d="M 52 38 C 62 32, 74 26, 84 22"></path>
      <path class="ln" d="M 42 88 C 40 104, 40 120, 42 134"></path>
      <path class="ln" d="M 54 88 C 56 104, 56 120, 54 134"></path>
      <line class="ln" x1="38" y1="134" x2="46" y2="134"></line>
      <line class="ln" x1="50" y1="134" x2="58" y2="134"></line>
    `,
  bass: `
      <ellipse class="ln" cx="22" cy="24" rx="6.5" ry="7.5"></ellipse>
      <path class="ln" d="M 18 18 Q 22 14, 27 18"></path>
      <path class="ln" d="M 16 34 C 14 50, 14 70, 16 88"></path>
      <path class="ln" d="M 28 34 C 30 50, 30 70, 28 88"></path>
      <path class="ln" d="M 16 88 C 14 104, 14 120, 16 134"></path>
      <path class="ln" d="M 28 88 C 30 104, 30 120, 28 134"></path>
      <line class="ln" x1="10" y1="134" x2="18" y2="134"></line>
      <line class="ln" x1="24" y1="134" x2="32" y2="134"></line>
      <path class="ln" d="M 52 14 Q 46 14, 46 19 Q 46 24, 52 24"></path>
      <path class="ln" d="M 52 16 Q 50 16, 50 19 Q 50 22, 52 22"></path>
      <line class="ln" x1="48" y1="20" x2="46" y2="22"></line>
      <line class="ln" x1="56" y1="20" x2="58" y2="22"></line>
      <line class="ln" x1="52" y1="24" x2="58" y2="62"></line>
      <line class="ln" x1="56" y1="24" x2="62" y2="62"></line>
      <line class="ln" x1="54" y1="24" x2="60" y2="62" opacity="0.5"></line>
      <path class="ln" d="M 60 62 Q 80 62, 82 80 Q 86 102, 78 116 Q 64 126, 56 116 Q 46 102, 50 80 Q 54 62, 60 62 Z"></path>
      <path class="ln" d="M 58 86 Q 56 92, 58 100"></path>
      <path class="ln" d="M 76 86 Q 78 92, 76 100"></path>
      <line class="ln" x1="62" y1="98" x2="72" y2="98"></line>
      <line class="ln" x1="64" y1="62" x2="65" y2="116" opacity="0.5"></line>
      <line class="ln" x1="68" y1="62" x2="69" y2="116" opacity="0.5"></line>
      <line class="ln" x1="71" y1="62" x2="72" y2="116" opacity="0.5"></line>
      <path class="ln" d="M 28 38 C 38 32, 46 26, 50 22"></path>
      <path class="ln" d="M 28 56 C 38 60, 50 72, 62 92"></path>
    `,
  violin: `
      <ellipse class="ln" cx="48" cy="22" rx="6.5" ry="7.5" transform="rotate(-15 48 22)"></ellipse>
      <path class="ln" d="M 44 14 Q 48 10, 53 14"></path>
      <path class="ln" d="M 42 32 C 40 50, 40 70, 42 88"></path>
      <path class="ln" d="M 54 32 C 56 50, 56 70, 54 88"></path>
      <ellipse class="ln" cx="64" cy="30" rx="10" ry="6" transform="rotate(15 64 30)"></ellipse>
      <line class="ln" x1="72" y1="26" x2="86" y2="20"></line>
      <line class="ln" x1="73" y1="32" x2="87" y2="26"></line>
      <path class="ln" d="M 86 20 Q 91 18, 91 22 Q 91 27, 86 26"></path>
      <line class="ln" x1="62" y1="26" x2="61" y2="34" opacity="0.6" transform="rotate(15 62 30)"></line>
      <line class="ln" x1="40" y1="40" x2="80" y2="34"></line>
      <line class="ln" x1="40" y1="42" x2="80" y2="36"></line>
      <path class="ln" d="M 42 38 C 38 40, 36 42, 38 44"></path>
      <circle class="dot" cx="78" cy="24" r="1.4"></circle>
      <path class="ln" d="M 54 36 C 62 34, 70 30, 78 24"></path>
      <path class="ln" d="M 42 88 C 40 104, 40 120, 42 134"></path>
      <path class="ln" d="M 54 88 C 56 104, 56 120, 54 134"></path>
      <line class="ln" x1="38" y1="134" x2="46" y2="134"></line>
      <line class="ln" x1="50" y1="134" x2="58" y2="134"></line>
    `,
  guitar: `
      <ellipse class="ln" cx="28" cy="22" rx="6.5" ry="7.5"></ellipse>
      <path class="ln" d="M 24 16 Q 28 12, 33 16"></path>
      <path class="ln" d="M 22 32 C 20 50, 22 64, 26 78"></path>
      <path class="ln" d="M 34 32 C 38 48, 42 60, 42 70"></path>
      <path class="ln" d="M 26 78 C 24 92, 22 108, 22 122"></path>
      <line class="ln" x1="16" y1="122" x2="28" y2="122"></line>
      <path class="ln" d="M 42 70 C 50 76, 56 88, 60 102"></path>
      <line class="ln" x1="55" y1="102" x2="66" y2="102"></line>
      <ellipse class="ln" cx="56" cy="70" rx="17" ry="13" transform="rotate(-22 56 70)"></ellipse>
      <circle class="ln" cx="54" cy="72" r="3.5"></circle>
      <line class="ln" x1="47" y1="78" x2="55" y2="84"></line>
      <line class="ln" x1="68" y1="60" x2="92" y2="34"></line>
      <line class="ln" x1="72" y1="64" x2="96" y2="38"></line>
      <line class="ln" x1="69" y1="62" x2="93" y2="36" opacity="0.4"></line>
      <line class="ln" x1="70.5" y1="63" x2="94.5" y2="37" opacity="0.4"></line>
      <path class="ln" d="M 92 34 L 100 26 L 102 28 L 94 36 Z"></path>
      <circle class="dot" cx="96" cy="30" r="0.8"></circle>
      <circle class="dot" cx="100" cy="28" r="0.8"></circle>
      <line class="ln" x1="76" y1="58" x2="80" y2="62" opacity="0.5"></line>
      <line class="ln" x1="82" y1="52" x2="86" y2="56" opacity="0.5"></line>
      <circle class="dot" cx="84" cy="48" r="2"></circle>
      <path class="ln" d="M 34 34 C 50 36, 70 42, 84 48"></path>
      <path class="ln" d="M 38 42 C 46 50, 50 58, 52 68"></path>
      <circle class="dot" cx="52" cy="70" r="1.8"></circle>
    `,
  drums: `
      <ellipse class="ln" cx="50" cy="20" rx="6.5" ry="7.5"></ellipse>
      <path class="ln" d="M 46 14 Q 50 10, 55 14"></path>
      <path class="ln" d="M 44 30 C 42 46, 42 64, 44 76"></path>
      <path class="ln" d="M 56 30 C 58 46, 58 64, 56 76"></path>
      <path class="ln" d="M 43 34 C 32 28, 22 20, 14 12"></path>
      <line class="ln" x1="14" y1="12" x2="6" y2="4"></line>
      <circle class="dot" cx="6" cy="4" r="1.6"></circle>
      <path class="ln" d="M 57 34 C 68 28, 78 20, 86 12"></path>
      <line class="ln" x1="86" y1="12" x2="94" y2="4"></line>
      <circle class="dot" cx="94" cy="4" r="1.6"></circle>
      <ellipse class="ln" cx="50" cy="92" rx="22" ry="6"></ellipse>
      <line class="ln" x1="28" y1="92" x2="28" y2="108"></line>
      <line class="ln" x1="72" y1="92" x2="72" y2="108"></line>
      <line class="ln" x1="28" y1="108" x2="72" y2="108"></line>
      <line class="ln" x1="34" y1="92" x2="34" y2="108" opacity="0.45"></line>
      <line class="ln" x1="50" y1="92" x2="50" y2="108" opacity="0.45"></line>
      <line class="ln" x1="66" y1="92" x2="66" y2="108" opacity="0.45"></line>
      <ellipse class="ln" cx="86" cy="38" rx="9" ry="2.5"></ellipse>
      <line class="ln" x1="86" y1="40.5" x2="86" y2="62"></line>
      <line class="ln" x1="82" y1="62" x2="90" y2="62"></line>
      <ellipse class="ln" cx="16" cy="62" rx="7" ry="2"></ellipse>
      <line class="ln" x1="16" y1="64" x2="16" y2="80"></line>
      <path class="ln" d="M 44 76 C 32 90, 24 110, 22 134"></path>
      <path class="ln" d="M 56 76 C 68 90, 76 110, 78 134"></path>
      <line class="ln" x1="18" y1="134" x2="26" y2="134"></line>
      <line class="ln" x1="74" y1="134" x2="82" y2="134"></line>
    `,
  vibes: `
      <ellipse class="ln" cx="50" cy="20" rx="6.5" ry="7.5"></ellipse>
      <path class="ln" d="M 46 14 Q 50 10, 55 14"></path>
      <path class="ln" d="M 44 30 C 42 50, 42 70, 44 86"></path>
      <path class="ln" d="M 56 30 C 58 50, 58 70, 56 86"></path>
      <path class="ln" d="M 43 36 C 36 44, 32 56, 30 64"></path>
      <path class="ln" d="M 57 36 C 64 44, 68 56, 70 64"></path>
      <line class="ln" x1="30" y1="64" x2="28" y2="76"></line>
      <line class="ln" x1="70" y1="64" x2="72" y2="76"></line>
      <circle class="dot" cx="28" cy="78" r="2.6"></circle>
      <circle class="dot" cx="72" cy="78" r="2.6"></circle>
      <line class="ln" x1="14" y1="86" x2="86" y2="86"></line>
      <line class="ln" x1="14" y1="90" x2="86" y2="90"></line>
      <line class="ln" x1="22" y1="86" x2="22" y2="90"></line>
      <line class="ln" x1="30" y1="86" x2="30" y2="90"></line>
      <line class="ln" x1="38" y1="86" x2="38" y2="90"></line>
      <line class="ln" x1="46" y1="86" x2="46" y2="90"></line>
      <line class="ln" x1="54" y1="86" x2="54" y2="90"></line>
      <line class="ln" x1="62" y1="86" x2="62" y2="90"></line>
      <line class="ln" x1="70" y1="86" x2="70" y2="90"></line>
      <line class="ln" x1="78" y1="86" x2="78" y2="90"></line>
      <line class="ln" x1="16" y1="90" x2="14" y2="118"></line>
      <line class="ln" x1="84" y1="90" x2="86" y2="118"></line>
      <line class="ln" x1="14" y1="118" x2="86" y2="118"></line>
      <path class="ln" d="M 44 86 C 42 100, 42 120, 44 134"></path>
      <path class="ln" d="M 56 86 C 58 100, 58 120, 56 134"></path>
      <line class="ln" x1="40" y1="134" x2="48" y2="134"></line>
      <line class="ln" x1="52" y1="134" x2="60" y2="134"></line>
    `,
  organ: `
      <line class="ln" x1="22" y1="98" x2="22" y2="108"></line>
      <line class="ln" x1="50" y1="98" x2="50" y2="108"></line>
      <line class="ln" x1="18" y1="98" x2="54" y2="98"></line>
      <path class="ln" d="M 34 100 C 31 114, 28 124, 26 134"></path>
      <path class="ln" d="M 44 100 C 47 114, 52 126, 56 136"></path>
      <line class="ln" x1="20" y1="134" x2="30" y2="134"></line>
      <line class="ln" x1="52" y1="136" x2="62" y2="136"></line>
      <path class="ln" d="M 36 28 C 32 42, 32 64, 36 98"></path>
      <path class="ln" d="M 46 28 C 47 42, 48 60, 46 78"></path>
      <ellipse class="ln" cx="41" cy="20" rx="6.5" ry="7.5"></ellipse>
      <path class="ln" d="M 47 19 L 49 21 L 48 23"></path>
      <path class="ln" d="M 36 14 Q 42 10, 47 14"></path>
      <path class="ln" d="M 44 30 C 56 34, 68 40, 78 46"></path>
      <line class="ln" x1="78" y1="46" x2="86" y2="50"></line>
      <path class="ln" d="M 45 42 C 56 46, 68 52, 78 56"></path>
      <line class="ln" x1="78" y1="56" x2="86" y2="60"></line>
      <line class="ln" x1="58" y1="34" x2="100" y2="34"></line>
      <line class="ln" x1="58" y1="40" x2="100" y2="40"></line>
      <line class="ln" x1="58" y1="46" x2="100" y2="46"></line>
      <rect class="keyfill" x="64" y="40" width="3" height="4"></rect>
      <rect class="keyfill" x="71" y="40" width="3" height="4"></rect>
      <rect class="keyfill" x="80" y="40" width="3" height="4"></rect>
      <rect class="keyfill" x="87" y="40" width="3" height="4"></rect>
      <rect class="keyfill" x="94" y="40" width="3" height="4"></rect>
      <line class="ln" x1="58" y1="52" x2="100" y2="52"></line>
      <line class="ln" x1="58" y1="58" x2="100" y2="58"></line>
      <rect class="keyfill" x="64" y="52" width="3" height="4"></rect>
      <rect class="keyfill" x="71" y="52" width="3" height="4"></rect>
      <rect class="keyfill" x="80" y="52" width="3" height="4"></rect>
      <rect class="keyfill" x="87" y="52" width="3" height="4"></rect>
      <rect class="keyfill" x="94" y="52" width="3" height="4"></rect>
      <line class="ln" x1="60" y1="28" x2="98" y2="28"></line>
      <line class="ln" x1="64" y1="22" x2="64" y2="30"></line>
      <line class="ln" x1="70" y1="22" x2="70" y2="30"></line>
      <line class="ln" x1="76" y1="22" x2="76" y2="30"></line>
      <line class="ln" x1="82" y1="22" x2="82" y2="30"></line>
      <line class="ln" x1="88" y1="22" x2="88" y2="30"></line>
      <line class="ln" x1="58" y1="58" x2="58" y2="78"></line>
      <line class="ln" x1="100" y1="58" x2="100" y2="78"></line>
      <line class="ln" x1="58" y1="78" x2="100" y2="78"></line>
    `,
  voice: `
      <ellipse class="ln" cx="46" cy="22" rx="6.5" ry="7.5" transform="rotate(-6 46 22)"></ellipse>
      <path class="ln" d="M 42 16 Q 46 12, 51 16"></path>
      <path class="ln" d="M 40 32 C 38 50, 38 70, 40 88"></path>
      <path class="ln" d="M 54 32 C 56 50, 56 70, 54 88"></path>
      <path class="ln" d="M 53 34 C 60 30, 66 26, 70 22"></path>
      <line class="ln" x1="70" y1="22" x2="76" y2="14"></line>
      <ellipse class="ln" cx="79" cy="11" rx="4.5" ry="6" transform="rotate(30 79 11)"></ellipse>
      <line class="ln" x1="75" y1="12" x2="83" y2="9" opacity="0.6"></line>
      <line class="ln" x1="76" y1="14" x2="84" y2="11" opacity="0.6"></line>
      <path class="ln" d="M 41 38 C 38 50, 36 62, 38 72"></path>
      <path class="ln" d="M 40 88 C 38 104, 38 120, 40 134"></path>
      <path class="ln" d="M 54 88 C 56 104, 56 120, 54 134"></path>
      <line class="ln" x1="34" y1="134" x2="42" y2="134"></line>
      <line class="ln" x1="50" y1="134" x2="58" y2="134"></line>
    `,
  rest: `
      <ellipse class="ln" cx="50" cy="24" rx="6.5" ry="7.5" transform="rotate(6 50 24)"></ellipse>
      <path class="ln" d="M 46 18 Q 50 14, 55 18"></path>
      <path class="ln" d="M 44 34 C 42 52, 42 72, 44 88"></path>
      <path class="ln" d="M 56 34 C 58 52, 58 72, 56 88"></path>
      <path class="ln" d="M 44 44 C 50 50, 56 50, 60 46"></path>
      <path class="ln" d="M 56 50 C 50 54, 46 54, 40 50"></path>
      <circle class="dot" cx="60" cy="46" r="1"></circle>
      <circle class="dot" cx="40" cy="50" r="1"></circle>
      <path class="ln" d="M 44 88 C 42 104, 42 120, 44 134"></path>
      <path class="ln" d="M 56 88 C 58 104, 58 120, 56 134"></path>
      <line class="ln" x1="40" y1="134" x2="48" y2="134"></line>
      <line class="ln" x1="52" y1="134" x2="60" y2="134"></line>
      <path class="ln" d="M 48 8 Q 48 4, 52 4 Q 56 4, 56 7 Q 56 10, 53 11"></path>
      <circle class="dot" cx="53" cy="13.5" r="0.8"></circle>
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
