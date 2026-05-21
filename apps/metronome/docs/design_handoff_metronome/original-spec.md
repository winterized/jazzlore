# Jazzlore Metronome — Spec Note

A web-based metronome built into jazzlore, primarily so users practicing with an electronic piano (iPhone → USB-C → RCA → piano aux input) actually hear every beat. Many native iOS metronome apps fail in this exact setup; the POC validates a Web Audio approach that works.

---

## Why this exists

When an iPhone outputs audio over USB-C to a piano, iOS lets the USB audio stream idle between sounds. Apps that emit short isolated clicks (most native metronomes — Time Guru, HeteroBeats, etc.) lose the leading edge of every click because the DAC hasn't woken up. Apps with continuous audio (iRealPro, jam-track apps) work fine because their stream never goes silent.

A browser-based metronome can sidestep this by keeping a sub-audible audio stream running the entire time the metronome is on. The POC confirms this works on iPhone (Chrome iOS / Safari) into a Kawai over USB-C → RCA.

## Hard technical constraints (validated)

These are non-negotiable for the setup to work — any future implementation must preserve them:

1. **Keep-alive stream** — a continuous oscillator at sub-audible frequency (~30 Hz) and near-zero gain (~0.0008) runs from Start to Stop. Without it, clicks drop on USB output.
2. **Warmup delay** — first beat must fire ~400ms after Start, not immediately, so the DAC is fully streaming before the first click. Otherwise beat 1 is swallowed.
3. **Web Audio scheduler with lookahead** — clicks are scheduled via `AudioContext.currentTime` with a ~25ms scheduler tick and ~100ms lookahead. Plain `setInterval` triggering clicks directly is not tight enough.
4. **User gesture to start** — `AudioContext.resume()` must be called inside a user tap handler (iOS requirement).
5. **Screen Wake Lock — dual strategy.** Wake Lock API is requested on Start (works on iOS 16.4+ / modern desktops). In parallel, NoSleep.js (a silent looped video) is also engaged as a fallback, since Safari iOS has historically been inconsistent about honoring Wake Lock. Both are released on Stop. A `visibilitychange` listener re-acquires when the page becomes visible (iOS auto-releases on background). Critically, the wake-lock request must happen **before any `await`** in the Start handler — NoSleep's `video.play()` requires the user gesture to still be active.

## Design constraints
- This app will be metronome.jazzlore.com, it inherits the design system of jazzlore: Geist Mono for the BPM number (it's a numerical display), Geist for body text, Newsreader for any editorial flourish if needed (probably not for this app). Stone palette + amber accent (#c87f1a light, #f5b15c dark per the musicians app tokens). Existing ThemeToggle and header pattern from packages/ui.
- This app is obviously mobile-first. It should be usable on desktop, with a single responsive layout, nothing more fancy than that for the desktop.
- Persistence — persist last BPM/meter/mode/pattern to localStorage
- Keyboard shortcuts on desktop — Spacebar = start/stop, T = tap, ←/→ = ±1, Shift+←/→ = ±10, [/] = ±classic tempo step


## Feature set (v1)

Confirmed in the POC, ready to productionize:

- **Tempo**: 30–240 BPM via slider + nudge buttons (±1, ±10, go to next/previous classic tempo in the Italian sequence (40, 60, 66, 76, 108, 120, 144, 168...)). The big tempo text (like '168' for instance) is another way to change the tempo (by editing with the digit keyboard)
- **Tap tempo**: averages last 6 taps, resets after 2s of inactivity. The tap edits the tempo.
- **Meter**: 2 to 7 beats per bar
- **Pattern**: Each beat is an editable dot that can be empty (silent), normal (regular click), or accented (accented click) and cycles from one state to the other at each tap on it.
- **Pattern quick access modes**:
  - *All beats, accent on 1* — default click pattern. Updates the pattern if needed when you click on it. For this mode, as soon as the user modifies the pattern, the mode button untoggles.
  - *2 & 4 (backbeat)* — clicks only on odd-indexed beats; off-beats remain visible but silent. Designed for jazz/swing feel. Updates the pattern if needed. For this mode, as soon as the user modifies the pattern, the mode button untoggles (flip back to custom if you prefer, but custom is when no button is toggled)
  - *One measure on, one measure off* - Does not change the pattern (because only one measure is shown with the dots). But when playing, no dot flashing for the measure off.
- **Wood block sound** — pitched sine sweep + filtered noise transient. Two voices: accented (higher, brighter) and unaccented.
- **Visual beat indicator** — Important for accessibility for deaf people. Dots (whatever shape) flash on each beat; in backbeat mode, silent beats render as dashed/dim dots so the meter is still legible. Accented beats pulse more visibly than normal beats (larger scale, longer flash).
- **Status indicator** — surfaces stream state (idle / priming / running), useful for diagnosing audio routing issues. But small and not very visible.
- **Screen stays awake while running** — Wake Lock API holds the display on during practice; releases on Stop so the phone sleeps normally afterward.

## Known limitations

- **Backgrounding the browser stops audio.** Wake Lock prevents screen sleep but not iOS suspending JS/audio when the user switches to another app or the home screen. For the validated use case (phone on the music stand, browser foregrounded), this is fine. A "keeps playing in background" feature would require a fundamentally different approach and isn't practical for a web app on iOS.
- **Wake Lock API + NoSleep.js fallback.** Wake Lock alone is unreliable on Safari iOS — sometimes granted, sometimes silently ignored. Shipping NoSleep.js alongside it (≈3KB gzipped, loaded from CDN or bundled) makes screen-awake behavior robust across iOS versions. The current implementation engages both on Start.
- **In-app browsers (WKWebView) break wake lock.** When the metronome is opened inside an embedded web view — Claude iOS app, Slack, Discord, Messages, Instagram, X, etc. — both Wake Lock API and NoSleep.js are often blocked or silently fail. The phone will sleep mid-practice. Mitigation: detect WKWebView via user-agent and show a one-line banner prompting users to open in Safari or add to Home Screen. The "Add to Home Screen" PWA mode runs in a proper standalone context where both wake-lock layers work.
- **Sandboxed iframes block Wake Lock.** If the metronome is ever embedded as an iframe (e.g. in a third-party site or a preview environment), the parent must include `allow="screen-wake-lock"` on the iframe tag. Same-origin pages on jazzlore are fine. NoSleep.js works in iframes regardless.

## Out of scope for v1

Don't build these yet. Add only if/when a real user need surfaces:

- Subdivisions (eighths, triplets, sixteenths)
- Multiple sound packs / sound selection
- Setlists, presets, save/recall
- Programmed tempo changes or practice timers
- Random beat dropping ("gap click" mode)
- Volume control. Only fixed master gain.

What you can keep in mind is at some point I will want to add an optional second pattern line for another metronom, to have 3 for 2, 3 for 4, 4 for 5 etc. rhythms. But not for v1. So the beat selection + pattern edition rows should be designed as a single component that could be vertically stacked in v2. Don't bake assumptions about there being only one row into the component API. But never more than 2.


## Reference implementation

POC lives in the audio-engine prototype (separate session). Key files / patterns to port:

- Web Audio scheduler (Chris Wilson lookahead pattern)
- `playWoodBlock(time, accented)` — two-component synthesis
- `startKeepAlive()` / `stopKeepAlive()` — the critical bit
- `requestWakeLock()` / `releaseWakeLock()` + `visibilitychange` listener to re-acquire
- 400ms warmup gate before first scheduled note
- Mode logic: `mode === 'backbeat'` → `shouldPlay = (beatIndex % 2 === 1)`

## Success criteria

- Every click is audible on the validated hardware path (iPhone USB-C → RCA → Kawai). No first-beat drop, no random missed beats over a 5-minute session.
- Timing jitter under ~5ms at 120 BPM (Web Audio scheduler handles this).
- Works in Chrome iOS and Safari iOS. Desktop Chrome / Safari / Firefox as bonus.
- Loads fast — under 100kb total, no audio sample files (all synthesized).

## What I need from you:

Icon proposals for each interactive control listed below. For each control, propose 2-3 icon options with brief reasoning for why each fits the semantic role. I'll pick one per control.
The visual language (while keeping inside Jazzlore design system): typography choice (display font for the BPM number, body font for everything else), color palette (one accent, neutral palette, dark/light variants), button/control shapes.
The layout polish: I've described the layout in prose. Show me the rendered version at mobile (pass 1) + desktop (only pass 2) sizes.

## What I don't need:

Multi-direction exploration of "what is a metronome"
Multiple competing design philosophies
Iterations beyond pass 2 or 3 (pass 1 + one polish pass should land it)

## The controls needing icons:

Start/stop (the big primary button) — what's the visual? Play/pause triangle/square?
 
Tap tempo — what icon? Hand-tap? Finger? The word "TAP" (probably best)?

Nudge stepper - semantic role: +1

Regular stepper - semantic role: +10

Classic tempo stepper — semantic role: jump to next/previous classic tempo (60, 76, 108, 120, 144, 168...).

Quick access modes - Text ? Symbols like a rest and a note glyph for the backbeat mode ? What about the measure on-and-off mode ?

Number of beats selector - multiple buttons with a number on them

Accent pattern editor — Row of dots with the accented ones filled? Something else?

Theme toggle — sun/moon (Jazzlore convention) — keep it consistent.

##Output: 
one rendered mock at mobile (390px wide) + one at desktop (1280px) for pass 2, light theme + dark theme. Plus the icon-decision matrix with your reasoning. That's the whole deliverable.
