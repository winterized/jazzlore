// Wood-block click synthesis — two voices (accented + unaccented). Pure
// Web Audio node-graph construction. The osc + filter + gain nodes are
// "one-shot" — they self-disconnect when the source ends (Web Audio's
// garbage-collection cleans them up automatically).
//
// Voice shape (from the spec):
//   accented:  1.1 kHz sine, swept down to 800 Hz over 25 ms, + filtered noise
//   normal:     880 Hz sine, swept down to 660 Hz over 18 ms, + filtered noise
// Master gain ≈ 0.4 (fixed; v1 has no volume control).

const MASTER_GAIN = 0.4

interface VoiceParams {
  startHz: number
  endHz: number
  sweepSec: number
  /** Per-voice gain multiplier relative to MASTER_GAIN. Accent is brighter. */
  voiceGain: number
  /** Filtered-noise burst frequency band (lowpass cutoff). */
  noiseCutoffHz: number
  /** Filtered-noise burst length. */
  noiseSec: number
}

const ACCENT: VoiceParams = {
  startHz: 1100,
  endHz: 800,
  sweepSec: 0.025,
  voiceGain: 1.0,
  noiseCutoffHz: 6000,
  noiseSec: 0.018,
}

const NORMAL: VoiceParams = {
  startHz: 880,
  endHz: 660,
  sweepSec: 0.018,
  voiceGain: 0.75,
  noiseCutoffHz: 4500,
  noiseSec: 0.012,
}

/** Schedule a single wood-block hit at `time` (seconds, AudioContext time).
 *  Returns nothing — the source nodes auto-stop and disconnect. */
export function playWoodBlock(
  ctx: BaseAudioContext,
  time: number,
  accented: boolean,
): void {
  const p = accented ? ACCENT : NORMAL

  // ── pitched sine sweep ────────────────────────────────────────────────
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(p.startHz, time)
  osc.frequency.exponentialRampToValueAtTime(p.endHz, time + p.sweepSec)

  const oscGain = ctx.createGain()
  // Quick attack (0 → peak) then exponential decay to silence.
  oscGain.gain.setValueAtTime(0, time)
  oscGain.gain.linearRampToValueAtTime(MASTER_GAIN * p.voiceGain, time + 0.001)
  // exponentialRampToValueAtTime cannot reach 0 — ramp to a tiny epsilon.
  oscGain.gain.exponentialRampToValueAtTime(0.0001, time + p.sweepSec)

  osc.connect(oscGain).connect(ctx.destination)
  osc.start(time)
  osc.stop(time + p.sweepSec + 0.01)

  // ── filtered noise transient ─────────────────────────────────────────
  // A short white-noise burst routed through a lowpass — gives the click
  // its "wood" snap. Buffer length matches noiseSec.
  const noiseLen = Math.ceil(ctx.sampleRate * p.noiseSec)
  const buf = ctx.createBuffer(1, noiseLen, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < noiseLen; i++) data[i] = Math.random() * 2 - 1

  const noise = ctx.createBufferSource()
  noise.buffer = buf

  const noiseFilter = ctx.createBiquadFilter()
  noiseFilter.type = 'lowpass'
  noiseFilter.frequency.setValueAtTime(p.noiseCutoffHz, time)

  const noiseGain = ctx.createGain()
  noiseGain.gain.setValueAtTime(0, time)
  noiseGain.gain.linearRampToValueAtTime(MASTER_GAIN * p.voiceGain * 0.5, time + 0.001)
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + p.noiseSec)

  noise.connect(noiseFilter).connect(noiseGain).connect(ctx.destination)
  noise.start(time)
  noise.stop(time + p.noiseSec + 0.01)
}
