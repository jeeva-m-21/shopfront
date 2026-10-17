import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  verifyDummyPassword,
  generateTemporaryPassword,
  validatePasswordComplexity,
  ALLOWED_TEMP_PASSWORD_CHARS,
} from '@/auth/passwords';

describe('Passwords Auth Module (Unit Tests)', () => {
  describe('hashPassword & verifyPassword', () => {
    it('hashes using argon2id and verifies correct password', async () => {
      const password = 'CorrectHorseBattery123';
      const hash = await hashPassword(password);

      expect(hash).toMatch(/^\$argon2id\$/);
      expect(await verifyPassword(hash, password)).toBe(true);
      expect(await verifyPassword(hash, 'WrongPassword123')).toBe(false);
    });

    it('timing-equalization dummy verify returns false', async () => {
      const result = await verifyDummyPassword('arbitraryPassword123');
      expect(result).toBe(false);
    });
  });

  describe('generateTemporaryPassword', () => {
    it('generates a 12-character password using only unambiguous characters', () => {
      const pwd = generateTemporaryPassword();
      expect(pwd.length).toBe(12);

      const allowedSet = new Set(ALLOWED_TEMP_PASSWORD_CHARS);
      for (const char of pwd) {
        expect(allowedSet.has(char)).toBe(true);
      }

      // Check strictly excluded ambiguous characters: 0, O, I, l, 1
      expect(pwd).not.toMatch(/[0OIl1]/);
    });

    it('generates diverse random passwords across runs', () => {
      const passwords = new Set<string>();
      for (let i = 0; i < 50; i++) {
        passwords.add(generateTemporaryPassword());
      }
      expect(passwords.size).toBe(50);
    });
  });

  describe('validatePasswordComplexity', () => {
    it('accepts strong valid password', () => {
      const res = validatePasswordComplexity('SafeP@ssw0rd', 'johndoe');
      expect(res.valid).toBe(true);
    });

    it('rejects password shorter than 8 characters', () => {
      const res = validatePasswordComplexity('Short1', 'johndoe');
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/at least 8 characters/i);
    });

    it('rejects password longer than 128 characters', () => {
      const longPwd = 'A'.repeat(128) + '1';
      const res = validatePasswordComplexity(longPwd, 'johndoe');
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/at most 128 characters/i);
    });

    it('rejects password without digits', () => {
      const res = validatePasswordComplexity('NoDigitsHere', 'johndoe');
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/at least one digit/i);
    });

    it('rejects password without letters', () => {
      const res = validatePasswordComplexity('1234567890', 'johndoe');
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/at least one letter/i);
    });

    it('rejects password matching username', () => {
      const res = validatePasswordComplexity('johndoe123', 'johndoe123');
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/cannot be identical to username/i);
    });

    it('rejects password matching previous password', () => {
      const res = validatePasswordComplexity('OldPassword1', 'user', 'OldPassword1');
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/cannot be identical to the previous password/i);
    });
  });
});
