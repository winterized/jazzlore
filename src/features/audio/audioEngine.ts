import * as Tone from 'tone'

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

export async function ensureEngine(): Promise<EngineKind> {
  if (engine) return kind
  if (loadPromise) return loadPromise

  loadPromise = new Promise<EngineKind>((resolve) => {
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

  return loadPromise
}

/** Must be called inside a user-gesture handler on iOS Safari. */
export async function unlockAudio(): Promise<void> {
  await Tone.start()
}

/** Plays a list of notes ascending at 120 BPM, quarter notes. Stops any in-flight playback first. */
export async function playScale(noteNames: string[]): Promise<void> {
  stopAll()
  await ensureEngine()
  if (!engine) return
  const now = Tone.now()
  const active = engine
  noteNames.forEach((note, i) => {
    active.triggerAttackRelease(note, NOTE_DURATION, now + i * BEAT_S)
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
}
