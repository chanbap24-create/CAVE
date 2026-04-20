// Client-side action throttle. Not a security boundary — a determined
// attacker will bypass it — but it kills the casual "tap like 500 times"
// and double-tap double-fire bugs, and it reduces load on the server
// rate limiter enough that the legitimate UX stays snappy.
//
// Usage:
//   if (tooFast('like:' + collectionId)) return;
//
// Keyed per action+target so one noisy like doesn't throttle unrelated
// actions. Window is a rolling 60s; max 15 actions per window. These
// numbers are tuned for human interaction, not bot cadence.

const WINDOW_MS = 60_000;
const MAX_ACTIONS = 15;

const log = new Map<string, number[]>();

/**
 * Returns true if the caller should be blocked from performing the action.
 * Also cleans the bucket so it doesn't grow unboundedly.
 */
export function tooFast(key: string, now = Date.now()): boolean {
  const cutoff = now - WINDOW_MS;
  const bucket = (log.get(key) ?? []).filter(t => t > cutoff);
  if (bucket.length >= MAX_ACTIONS) {
    log.set(key, bucket);
    return true;
  }
  bucket.push(now);
  log.set(key, bucket);
  return false;
}
