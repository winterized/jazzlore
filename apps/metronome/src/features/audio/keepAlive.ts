// Sub-audible keep-alive oscillator. Per the original spec:
//
//   When an iPhone outputs audio over USB-C to a piano, iOS lets the USB
//   audio stream idle between sounds. Apps that emit short isolated clicks
//   lose the leading edge of every click because the DAC hasn't woken up.
//
// A continuous 30 Hz oscillator at ~0.0008 gain runs from engine.start() to
// engine.stop() so the DAC never sleeps. The frequency is below the audible
// floor of typical speakers; the gain is well under the noise floor of
// human hearing. The combined output is inaudible but it keeps the audio
// pipeline "hot" so subsequent clicks fire on the first sample.

const KEEP_ALIVE_FREQ_HZ = 30
const KEEP_ALIVE_GAIN = 0.0008
/** Ramp-down on stop — avoids a click at end-of-life. */
const STOP_RAMP_SEC = 0.03

export interface KeepAliveHandle {
  /** Ramp gain to 0 and stop the oscillator. Idempotent. */
  stop(): void
}

export function startKeepAlive(ctx: BaseAudioContext): KeepAliveHandle {
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(KEEP_ALIVE_FREQ_HZ, ctx.currentTime)

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(KEEP_ALIVE_GAIN, ctx.currentTime)

  osc.connect(gain).connect(ctx.destination)
  osc.start()

  let stopped = false
  return {
    stop(): void {
      if (stopped) return
      stopped = true
      const now = ctx.currentTime
      // Linear ramp to 0 over 30 ms then stop the source.
      gain.gain.cancelScheduledValues(now)
      gain.gain.setValueAtTime(KEEP_ALIVE_GAIN, now)
      gain.gain.linearRampToValueAtTime(0, now + STOP_RAMP_SEC)
      try {
        osc.stop(now + STOP_RAMP_SEC + 0.01)
      } catch {
        // osc.stop() throws if already stopped — safe to swallow.
      }
    },
  }
}
