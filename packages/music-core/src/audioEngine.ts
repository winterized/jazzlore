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

/** Must be called inside a user-gesture handler on iOS Safari. */
export async function unlockAudio(): Promise<void> {
  const Tone = await loadTone()
  await Tone.start()
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
}
