/**
 * In-memory per-IP sliding window rate limiter per PRD Section 11.1 & D16.
 * Zero external dependencies.
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

export class RateLimiter {
  private requests = new Map<string, number[]>();

  /**
   * Checks whether an action from a given key (e.g. client IP) is permitted.
   */
  check(key: string, limit = 60, windowMs = 60000): RateLimitResult {
    const now = Date.now();
    const windowStart = now - windowMs;

    let timestamps = this.requests.get(key);
    if (!timestamps) {
      timestamps = [];
    } else {
      // Filter out timestamps outside sliding window
      timestamps = timestamps.filter((t) => t > windowStart);
    }

    if (timestamps.length >= limit) {
      const oldest = timestamps[0] ?? now;
      const resetMs = Math.max(0, oldest + windowMs - now);
      this.requests.set(key, timestamps);
      return { allowed: false, remaining: 0, resetMs };
    }

    timestamps.push(now);
    this.requests.set(key, timestamps);
    return {
      allowed: true,
      remaining: Math.max(0, limit - timestamps.length),
      resetMs: windowMs,
    };
  }

  /**
   * Clears state for a key or all keys (useful for testing or cache purges).
   */
  reset(key?: string): void {
    if (key) {
      this.requests.delete(key);
    } else {
      this.requests.clear();
    }
  }
}

export const publicRateLimiter = new RateLimiter();
