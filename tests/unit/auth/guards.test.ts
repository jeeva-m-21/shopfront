import { describe, it, expect } from 'vitest';
import { verifyCsrfOrigin } from '../../../src/auth/guards.js';

describe('Auth Guards CSRF Verification (Unit Tests)', () => {
  it('allows matching origin against APP_BASE_URL', () => {
    const headers = new Headers();
    headers.set('origin', 'http://localhost:3000');
    expect(verifyCsrfOrigin(headers, 'http://localhost:3000')).toBe(true);
  });

  it('rejects origin mismatch', () => {
    const headers = new Headers();
    headers.set('origin', 'http://malicious-site.com');
    expect(verifyCsrfOrigin(headers, 'http://localhost:3000')).toBe(false);
  });

  it('rejects missing origin header on mutating requests', () => {
    const headers = new Headers();
    expect(verifyCsrfOrigin(headers, 'http://localhost:3000')).toBe(false);
  });
});
