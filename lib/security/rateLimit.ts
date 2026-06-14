/**
 * In-memory sliding-window rate limiter.
 *
 * MVP implementation — safe for single-process deployments (Vercel serverless
 * with a single worker, local dev). For multi-instance production, replace the
 * Map store with Redis / Upstash.
 *
 * IMPORTANT: Next.js serverless functions are stateless between invocations.
 * The Map resets on cold starts. This provides best-effort limiting, not a
 * hard guarantee. For hard limits, use Vercel's built-in rate limiting or
 * Upstash Redis with atomic counters.
 */

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

// Clean up expired entries periodically to prevent memory growth.
// setInterval is available in Node.js runtimes; guarded for Edge runtime.
if (typeof setInterval !== "undefined") {
  setInterval(
    () => {
      const now = Date.now();
      for (const [key, entry] of Array.from(store)) {
        if (now > entry.resetAt) store.delete(key);
      }
    },
    5 * 60 * 1000 // every 5 minutes
  );
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check (and increment) the request count for a given key.
 * Returns whether the request is allowed and the remaining quota.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

// ── Pre-configured limit helpers ──────────────────────────────────────────────

/** CSV export: max 20 per user per 5 minutes */
export function csvExportLimit(userId: string): RateLimitResult {
  return checkRateLimit(`csv:${userId}`, 20, 5 * 60_000);
}

/** Heavy mutations (file upload URL generation): max 30 per user per minute */
export function uploadUrlLimit(userId: string): RateLimitResult {
  return checkRateLimit(`upload:${userId}`, 30, 60_000);
}

/** General mutations (create incident, leave request, etc.): 60 per minute */
export function mutationLimit(userId: string, action: string): RateLimitResult {
  return checkRateLimit(`mut:${userId}:${action}`, 60, 60_000);
}
