import { describe, it, expect } from 'vitest';
import {
  verifyCsrfOrigin,
  assertCsrfOrigin,
  CsrfValidationError,
} from '../../../src/auth/guards.js';

describe('Auth Guards CSRF Verification (Unit Tests)', () => {
  it('allows matching origin against APP_BASE_URL', () => {
    const headers = new Headers();
    headers.set('origin', 'http://localhost:3000');
    expect(verifyCsrfOrigin(headers, 'http://localhost:3000')).toBe(true);
    expect(() => assertCsrfOrigin(headers, 'http://localhost:3000')).not.toThrow();
  });

  it('rejects origin mismatch', () => {
    const headers = new Headers();
    headers.set('origin', 'http://malicious-site.com');
    expect(verifyCsrfOrigin(headers, 'http://localhost:3000')).toBe(false);
    expect(() => assertCsrfOrigin(headers, 'http://localhost:3000')).toThrow(CsrfValidationError);
  });

  it('rejects missing origin header on mutating requests', () => {
    const headers = new Headers();
    expect(verifyCsrfOrigin(headers, 'http://localhost:3000')).toBe(false);
    expect(() => assertCsrfOrigin(headers, 'http://localhost:3000')).toThrow(CsrfValidationError);
  });
});

