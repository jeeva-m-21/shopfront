import { describe, it, expect } from 'vitest';
import { cleanInputText, normalizeSearchQuery } from '@/domain/text';

describe('Text Domain Module (Pure Unit Tests)', () => {
  describe('cleanInputText', () => {
    it('strips ASCII control characters', () => {
      const input = 'Hello\x00\x07\x1B World\x7F!';
      expect(cleanInputText(input, 50)).toBe('Hello World!');
    });

    it('replaces newlines and tabs with spaces and collapses whitespace runs', () => {
      const input = '   Shop \n\n Name \t with \r\n multiple   spaces   ';
      expect(cleanInputText(input, 50)).toBe('Shop Name with multiple spaces');
    });

    it('enforces maximum length truncation without breaking', () => {
      const input = 'A very long description that exceeds the maximum length limit allowed';
      expect(cleanInputText(input, 20)).toBe('A very long descript');
    });

    it('handles empty or whitespace-only inputs', () => {
      expect(cleanInputText('', 50)).toBe('');
      expect(cleanInputText('   \t\n   ', 50)).toBe('');
    });
  });

  describe('normalizeSearchQuery', () => {
    it('lowercases and collapses whitespace', () => {
      expect(normalizeSearchQuery('  LAPTOP   REPAIR  ')).toBe('laptop repair');
    });

    it('strips "near me" case-insensitively with varying spaces', () => {
      expect(normalizeSearchQuery('laptop repair near me')).toBe('laptop repair');
      expect(normalizeSearchQuery('Near Me salon for women')).toBe('salon for women');
      expect(normalizeSearchQuery('cafe NEAR   ME open now')).toBe('cafe open now');
      expect(normalizeSearchQuery('near me')).toBe('');
    });

    it('preserves words that are not the phrase "near me"', () => {
      expect(normalizeSearchQuery('shops near metro station')).toBe('shops near metro station');
      expect(normalizeSearchQuery('call me bakery')).toBe('call me bakery');
    });

    it('handles undefined or null query returning empty string', () => {
      expect(normalizeSearchQuery(undefined)).toBe('');
      expect(normalizeSearchQuery('')).toBe('');
    });
  });
});
