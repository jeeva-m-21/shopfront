import { describe, it, expect } from 'vitest';
import { resolveLocality, normalizeLocalityString, CHENNAI_LOCALITIES } from '@/domain/localities';

describe('Localities Domain Module (Pure Unit Tests)', () => {
  it('contains exactly 32 Chennai localities', () => {
    expect(CHENNAI_LOCALITIES.length).toBe(32);
  });

  describe('normalizeLocalityString', () => {
    it('lowercases and removes non-alphanumeric characters', () => {
      expect(normalizeLocalityString('T. Nagar')).toBe('tnagar');
      expect(normalizeLocalityString('t nagar')).toBe('tnagar');
      expect(normalizeLocalityString('T.Nagar')).toBe('tnagar');
      expect(normalizeLocalityString('K.K. Nagar')).toBe('kknagar');
    });
  });

  describe('resolveLocality', () => {
    it('resolves exact match on canonical names', () => {
      const res = resolveLocality('Adyar');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.locality.name).toBe('Adyar');
        expect(res.locality.lat).toBeCloseTo(13.0012, 3);
        expect(res.locality.lng).toBeCloseTo(80.2565, 3);
      }
    });

    it('resolves case-insensitive and punctuation variants', () => {
      const res1 = resolveLocality('t nagar');
      expect(res1.success).toBe(true);
      if (res1.success) expect(res1.locality.name).toBe('T. Nagar');

      const res2 = resolveLocality('T.Nagar');
      expect(res2.success).toBe(true);
      if (res2.success) expect(res2.locality.name).toBe('T. Nagar');
    });

    it('resolves aliases accurately', () => {
      const resOmr = resolveLocality('OMR');
      expect(resOmr.success).toBe(true);
      if (resOmr.success) expect(resOmr.locality.name).toBe('Sholinganallur');

      const resKk = resolveLocality('KK Nagar');
      expect(resKk.success).toBe(true);
      if (resKk.success) expect(resKk.locality.name).toBe('K.K. Nagar');

      const resTiru = resolveLocality('Tiruvanmiyur');
      expect(resTiru.success).toBe(true);
      if (resTiru.success) expect(resTiru.locality.name).toBe('Thiruvanmiyur');
    });

    it('resolves fuzzy matches with minor typos (score >= 0.6 and separation >= 0.1)', () => {
      const res = resolveLocality('Velacherry');
      expect(res.success).toBe(true);
      if (res.success) expect(res.locality.name).toBe('Velachery');
    });

    it('rejects ambiguous inputs with separation < 0.1 and returns 3 suggestions', () => {
      const res = resolveLocality('Nagar');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toBe('locality_not_found');
        expect(res.suggestions.length).toBe(3);
      }
    });

    it('returns 3 suggestions for unknown localities', () => {
      const res = resolveLocality('Coimbatore');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toBe('locality_not_found');
        expect(res.suggestions.length).toBe(3);
      }
    });
  });
});
