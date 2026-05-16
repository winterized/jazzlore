export type EngineKind = 'sampler' | 'synth' | null

const SAMPLE_BASE = '/audio/piano/'
const SAMPLE_PITCHES = ['C2', 'A2', 'C3', 'A3', 'C4', 'A4', 'C5', 'A5', 'C6', 'A6'] as const

/**
 * Prefer OGG (better compression, comparable quality) where supported.
 * Safari (desktop + iOS) falls back to MP3. Detection runs once at module load.
 */
function preferredSampleExtension(): 'ogg' | 'mp3' {
  if (typeof document === 'undefined') return 'mp3'
  const audio = document.createElement('audio')
  return audio.canPlayType('audio/ogg') !== '' ? 'ogg' : 'mp3'
}

const SAMPLER_LOAD_TIMEOUT_MS = 5000
const BPM = 120
const BEAT_S = 60 / BPM // 0.5s — quarter note duration
const NOTE_DURATION = BEAT_S * 0.9 // small detach between notes

interface EngineInstance {
  triggerAttackRelease: (note: string, duration: number, time?: number) => void
  releaseAll?: () => void
  dispose?: () => void
}

let engine: EngineInstance | null = null
let kind: EngineKind = null
let loadPromise: Promise<EngineKind> | null = null

// iOS (Safari AND Chrome iOS — every iOS browser is WebKit) only lets an
// AudioContext leave the 'suspended' state if resume() runs synchronously
// inside the user-gesture task. Our Tone.js import is intentionally lazy
// (a ~75 KB network fetch), and `await import('tone')` crosses a macrotask
// boundary, so by the time Tone.start() ran the gesture was gone and the
// context stayed muted — every scheduled note silent. Fix: create + resume a
// raw AudioContext *synchronously* in the click handler (primeAudio, no
// await), then bind Tone to that already-running context once it loads.
let primedCtx: AudioContext | null = null
let toneBoundToPrimed = false

// ── Temporary on-device audio diagnostics ──────────────────────────────────
// iOS has no easy devtools; this lets the play buttons alert() a one-line
// state snapshot when the URL has ?audiodebug=1. Bump AUDIO_BUILD on each
// diagnostic deploy so a stale iOS cache is immediately obvious.
const AUDIO_BUILD = 'audiodbg-2'
let lastAudioError = ''
let toneCtxState = 'n/a'
let toneRawState = 'n/a'
let audioSessionInfo = 'n/a'
function recordAudioError(stage: string, e: unknown): void {
  lastAudioError = `${stage}:${e instanceof Error ? `${e.name} ${e.message}` : String(e)}`
}
export function audioDebugSummary(): string {
  const w =
    typeof window !== 'undefined'
      ? (window as unknown as { AudioContext?: unknown; webkitAudioContext?: unknown })
      : {}
  return [
    `build=${AUDIO_BUILD}`,
    `AC=${typeof w.AudioContext !== 'undefined'}/wk=${typeof w.webkitAudioContext !== 'undefined'}`,
    `primed=${primedCtx ? primedCtx.state : 'none'}`,
    `bound=${toneBoundToPrimed}`,
    `toneCtx=${toneCtxState}`,
    `rawCtx=${toneRawState}`,
    `engine=${kind ?? 'none'}`,
    `as=${audioSessionInfo}`,
    `err=${lastAudioError || 'none'}`,
  ].join(' ')
}

/**
 * Call this **synchronously as the first statement** of a play button's click
 * handler, before any `await`. It creates and resumes the AudioContext within
 * the user gesture so iOS actually unmutes it. Safe no-op where Web Audio is
 * unavailable (SSR / jsdom). Idempotent: later calls just re-resume (handles
 * iOS re-suspending the context after an interruption such as a phone call).
 */
export function primeAudio(): void {
  if (typeof window === 'undefined') return
  try {
    // iOS >=16.4: WebAudio defaults to an "ambient" audio session that the
    // hardware mute switch silences and that follows RINGER (not media)
    // volume — so sound is inaudible even when NOT in silent mode if the
    // ringer volume is low. Promote to a "playback" session: audible
    // regardless of the silent switch, on the media volume channel. Must run
    // in the gesture; no-op where unsupported (older iOS / other browsers).
    const navAS = (navigator as unknown as { audioSession?: { type: string } }).audioSession
    if (navAS) {
      navAS.type = 'playback'
      audioSessionInfo = `set/${navAS.type}`
    } else {
      audioSessionInfo = 'unsupported'
    }

    const w = window as unknown as {
      AudioContext?: typeof AudioContext
      webkitAudioContext?: typeof AudioContext
    }
    const Ctx = w.AudioContext ?? w.webkitAudioContext
    if (!Ctx) return
    if (!primedCtx) {
      primedCtx = new Ctx()
      // Legacy iOS kick: playing a 1-sample silent buffer flips the context to
      // 'running' on older iOS where resume() alone is insufficient.
      try {
        const src = primedCtx.createBufferSource()
        src.buffer = primedCtx.createBuffer(1, 1, 22050)
        src.connect(primedCtx.destination)
        src.start(0)
      } catch {
        // Some engines throw on createBuffer here; the resume() below still runs.
      }
    }
    if (primedCtx.state !== 'running') void primedCtx.resume()
  } catch (e) {
    recordAudioError('prime', e)
  }
}

// Lazy-load Tone.js: ~75 KB gz that we only need after a user gesture.
// Caching the in-flight promise ensures concurrent callers share one fetch.
let tonePromise: Promise<typeof import('tone')> | null = null
function loadTone(): Promise<typeof import('tone')> {
  if (!tonePromise) tonePromise = import('tone')
  return tonePromise
}

export async function ensureEngine(): Promise<EngineKind> {
  if (engine) return kind
  if (loadPromise) return loadPromise

  loadPromise = (async (): Promise<EngineKind> => {
    const Tone = await loadTone()
    return new Promise<EngineKind>((resolve) => {
      let resolved = false
      const finish = (k: EngineKind, instance: EngineInstance): void => {
        if (resolved) return
        resolved = true
        engine = instance
        kind = k
        resolve(k)
      }
      const fallbackToSynth = (): void => {
        const synth = new Tone.PolySynth().toDestination()
        finish('synth', synth as unknown as EngineInstance)
      }
      const timeout = setTimeout(fallbackToSynth, SAMPLER_LOAD_TIMEOUT_MS)

      const ext = preferredSampleExtension()
      const urls = Object.fromEntries(SAMPLE_PITCHES.map((p) => [p, `${p}.${ext}`]))
      const sampler = new Tone.Sampler({
        urls,
        baseUrl: SAMPLE_BASE,
        onload: () => {
          clearTimeout(timeout)
          finish('sampler', sampler as unknown as EngineInstance)
        },
        onerror: () => {
          clearTimeout(timeout)
          fallbackToSynth()
        },
      }).toDestination()
    })
  })()

  return loadPromise
}

/**
 * Must be called inside a user-gesture handler on iOS, paired with an earlier
 * synchronous {@link primeAudio} call in the same handler.
 */
export async function unlockAudio(): Promise<void> {
  try {
    const Tone = await loadTone()
    // Bind Tone to the gesture-unlocked context BEFORE any Tone node exists
    // (the Sampler is created later, in ensureEngine). One-shot: rebinding
    // after nodes are created would orphan the Sampler from the audible ctx.
    if (primedCtx && !toneBoundToPrimed) {
      Tone.setContext(primedCtx)
      toneBoundToPrimed = true
    }
    await Tone.start()
    // Diagnostics only — guarded so the unit-test 'tone' mock (no getContext)
    // is unaffected.
    const getCtx = (Tone as unknown as { getContext?: () => unknown }).getContext
    if (typeof getCtx === 'function') {
      const ctx = getCtx() as { state?: string; rawContext?: { state?: string } }
      toneCtxState = ctx.state ?? 'n/a'
      toneRawState = ctx.rawContext?.state ?? 'n/a'
    }
  } catch (e) {
    recordAudioError('unlock', e)
    throw e
  }
}

/** Plays a list of notes ascending at 120 BPM, quarter notes. Stops any in-flight playback first. */
export async function playScale(noteNames: string[]): Promise<void> {
  stopAll()
  await ensureEngine()
  if (!engine) return
  const Tone = await loadTone()
  const now = Tone.now()
  const active = engine
  noteNames.forEach((note, i) => {
    active.triggerAttackRelease(note, NOTE_DURATION, now + i * BEAT_S)
  })
}

const CHORD_STAGGER_S = 0.2 // 200 ms — arpeggio note length / inter-onset
// The final arpeggio note is held longer than the rest for a slight
// broadening before the block. User feedback 2026-05-16.
const CHORD_LAST_NOTE_S = 0.5
// 1.2 s — the closing block chord rings out. User feedback 2026-05-16.
const CHORD_BLOCK_S = 1.2

/**
 * Plays a chord with an arp-then-block envelope.
 *
 * @param notes - Octaved, ASCII-encoded note names (e.g. `['C4', 'E4', 'Gb4', 'Bb4']`).
 *   Unicode accidentals such as `'B♭4'` are NOT accepted — the caller must pass
 *   ASCII sharps (`#`) or flats (`b`). Same convention as `playScale`.
 * @param mode - Only `'arp-then-block'` exists in v1. Reserved for future extension.
 *
 * @returns A Promise that resolves once all notes have been **scheduled** on the
 *   Tone.js timeline. It does **not** wait for playback to finish. Callers that
 *   want to react when the audio actually ends must set their own timer for
 *   `(n - 1) * 200 + 1700 ms`.
 *
 * Timing for n notes:
 *   - Arpeggio: note i attacks at `now + i * 0.2 s`. Notes 0..n-2 ring for one
 *     step (0.2 s); the FINAL note is held 0.5 s for a slight broadening
 *     before the block.
 *   - Block: once the (lengthened) final arpeggio note finishes, ALL notes are
 *     re-struck together (a fresh simultaneous attack) at
 *     `now + (n - 1) * 0.2 + 0.5 s` for 1.2 s. A decayed sustain tail is
 *     inaudible on a piano sampler, so the block must be a real re-attack.
 *   - Total wall time ≈ `(n - 1) * 200 + 1700 ms` (≈2.9 s for a 7-note chord)
 *
 * Re-entrancy: stops any in-flight playback first (matching `playScale`
 * semantics) — UNLESS `notes` is empty. An empty array is a true no-op: it
 * does not stop a chord currently sounding. Callers wanting an explicit
 * "silence everything" should call {@link stopAll} directly.
 */
export async function playChord(
  notes: string[],
  mode: 'arp-then-block' = 'arp-then-block',
): Promise<void> {
  void mode // single mode in v1; parameter reserved for future extension
  if (notes.length === 0) return
  stopAll()
  await ensureEngine()
  if (!engine) return
  const Tone = await loadTone()
  const now = Tone.now()
  const active = engine
  const n = notes.length
  // Arpeggio: each note rings for one step (CHORD_STAGGER_S); the FINAL note
  // is held longer (CHORD_LAST_NOTE_S) for a slight broadening before the block.
  notes.forEach((note, i) => {
    const startTime = now + i * CHORD_STAGGER_S
    const duration = i === n - 1 ? CHORD_LAST_NOTE_S : CHORD_STAGGER_S
    active.triggerAttackRelease(note, duration, startTime)
  })
  // Block: re-strike all notes together once the lengthened final arpeggio
  // note finishes, so the chord lands as a distinct simultaneous hit (the
  // arpeggio tail has decayed by now on a piano sampler and is inaudible).
  const blockStart = now + (n - 1) * CHORD_STAGGER_S + CHORD_LAST_NOTE_S
  notes.forEach((note) => {
    active.triggerAttackRelease(note, CHORD_BLOCK_S, blockStart)
  })
}

export function stopAll(): void {
  engine?.releaseAll?.()
}

/** Test-only: reset module state between tests. Do not call from production code. */
export function __resetForTests(): void {
  engine?.dispose?.()
  engine = null
  kind = null
  loadPromise = null
  tonePromise = null
  primedCtx = null
  toneBoundToPrimed = false
  lastAudioError = ''
  toneCtxState = 'n/a'
  toneRawState = 'n/a'
  audioSessionInfo = 'n/a'
}
