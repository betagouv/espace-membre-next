/**
 * Minimal in-memory fixed-window rate limiter.
 *
 * This is correct as long as the app runs as a single process — currently
 * `scalingo.json` has `web.quantity: 1`. If this ever scales to more than one
 * web dyno, move the counters to a shared store (Postgres, already used
 * everywhere else in this app, or Redis) instead: an in-memory Map is not
 * shared across processes and each dyno would enforce its own limit.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Bound memory usage: periodically drop buckets whose window has already
// expired, so an attacker cycling through many distinct keys (e.g. many made
// up email addresses) can't grow this map forever.
const SWEEP_INTERVAL_MS = 10 * 60_000;
let sweepTimer: ReturnType<typeof setInterval> | undefined;

function startSweeping() {
  if (sweepTimer || typeof setInterval !== "function") {
    return;
  }
  sweepTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) {
        buckets.delete(key);
      }
    }
  }, SWEEP_INTERVAL_MS);
  sweepTimer.unref?.();
}

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the caller can retry. 0 when `allowed` is true. */
  retryAfterSeconds: number;
}

/**
 * Checks whether the action identified by `key` is still allowed within its
 * current fixed window, and counts this call toward the limit if so.
 *
 * @param key unique identifier for the thing being limited (e.g. an email
 *   address or an IP address, prefixed with the action name so different
 *   limiters never share a bucket by accident)
 * @param max maximum number of allowed calls per window
 * @param windowMs window length in milliseconds
 */
export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
): RateLimitResult {
  startSweeping();
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= max) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Test-only escape hatch to avoid cross-test pollution via the module-level Map. */
export function __resetRateLimitForTests() {
  buckets.clear();
  if (sweepTimer) {
    clearInterval(sweepTimer);
    sweepTimer = undefined;
  }
}
