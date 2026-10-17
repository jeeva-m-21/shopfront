import { describe, it, expect, beforeEach } from 'vitest';
import { RateLimiter } from '@/rate-limit';

describe('In-Memory Sliding Window Rate Limiter (Unit Tests)', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter();
  });

  it('allows requests within the limit', () => {
    const ip = '192.168.1.1';
    for (let i = 0; i < 5; i++) {
      const res = limiter.check(ip, 5, 1000);
      expect(res.allowed).toBe(true);
      expect(res.remaining).toBe(4 - i);
    }
  });

  it('blocks requests once limit is exceeded', () => {
    const ip = '192.168.1.2';
    // Exhaust 3 tokens
    limiter.check(ip, 3, 1000);
    limiter.check(ip, 3, 1000);
    limiter.check(ip, 3, 1000);

    // 4th request must be blocked
    const res = limiter.check(ip, 3, 1000);
    expect(res.allowed).toBe(false);
    expect(res.remaining).toBe(0);
  });

  it('isolates different client IPs', () => {
    limiter.check('10.0.0.1', 1, 1000);
    const blockedForFirst = limiter.check('10.0.0.1', 1, 1000);
    expect(blockedForFirst.allowed).toBe(false);

    // Second client should be allowed
    const allowedForSecond = limiter.check('10.0.0.2', 1, 1000);
    expect(allowedForSecond.allowed).toBe(true);
  });

  it('resets allowance after sliding window expires', async () => {
    const ip = '10.0.0.3';
    limiter.check(ip, 1, 50); // 50ms window
    expect(limiter.check(ip, 1, 50).allowed).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 60));

    expect(limiter.check(ip, 1, 50).allowed).toBe(true);
  });
});
