// Manual-retry backoff for the hard-error screen.
//
// The "Try again" button on the calm error screen (WakingState `error`
// variant) re-fires the BFF call. With no throttle a frustrated reader could
// hammer a struggling backend. So after each manual retry we briefly disable
// the button on an escalating cooldown: the FIRST retry is free (you can try
// again right now), then 1s, then 2s, then 4s, and capped at 5s thereafter.
// The count resets to zero the moment a load succeeds (the page owns that
// reset, since the error screen unmounts between retries).
//
// Pure + framework-free so the schedule is unit-tested in isolation.

/**
 * Cooldown in whole seconds to enforce on the Try-again button given `retries`
 * already fired in the current error episode (0 = none yet → retry immediately).
 *   0 → 0   1 → 1   2 → 2   3 → 4   4 → 5   5+ → 5
 */
export function retryCooldownSeconds(retries: number): number {
  if (retries <= 0) return 0
  return Math.min(2 ** (retries - 1), 5)
}
