import { describe, it, expect } from 'vitest';
import {
  formatPriceDisplay,
  formatInrAmount,
  computePriceRange,
  satisfiesPriceCeiling,
  type PriceItem,
} from '@/domain/pricing';

describe('Pricing Domain Module (Pure Unit Tests)', () => {
  describe('formatInrAmount', () => {
    it('formats numbers with Indian digit grouping', () => {
      expect(formatInrAmount(499)).toBe('499');
      expect(formatInrAmount(1000)).toBe('1,000');
      expect(formatInrAmount(8500)).toBe('8,500');
      expect(formatInrAmount(100000)).toBe('1,00,000');
      expect(formatInrAmount(1000000)).toBe('10,00,000');
    });
  });

  describe('formatPriceDisplay', () => {
    it('formats fixed prices correctly', () => {
      expect(formatPriceDisplay('fixed', 8500)).toBe('₹8,500');
      expect(formatPriceDisplay('fixed', 499)).toBe('₹499');
    });

    it('formats starting_from prices correctly', () => {
      expect(formatPriceDisplay('starting_from', 499)).toBe('From ₹499');
      expect(formatPriceDisplay('starting_from', 1500)).toBe('From ₹1,500');
    });

    it('formats range prices with en-dash', () => {
      expect(formatPriceDisplay('range', 8500, 14500)).toBe('₹8,500 – ₹14,500');
    });

    it('formats on_request as "Price on request"', () => {
      expect(formatPriceDisplay('on_request')).toBe('Price on request');
      expect(formatPriceDisplay('on_request', null, null)).toBe('Price on request');
    });
  });

  describe('computePriceRange', () => {
    it('returns null when no items or only on_request items', () => {
      expect(computePriceRange([])).toBe(null);
      const onRequestItems: PriceItem[] = [
        { price_type: 'on_request', price_inr: null, price_max_inr: null },
      ];
      expect(computePriceRange(onRequestItems)).toBe(null);
    });

    it('computes [min, max] over fixed, starting_from, and range items', () => {
      const items: PriceItem[] = [
        { price_type: 'fixed', price_inr: 200, price_max_inr: null },
        { price_type: 'starting_from', price_inr: 500, price_max_inr: null },
        { price_type: 'range', price_inr: 800, price_max_inr: 1500 },
        { price_type: 'on_request', price_inr: null, price_max_inr: null },
      ];
      expect(computePriceRange(items)).toEqual([200, 1500]);
    });
  });

  describe('satisfiesPriceCeiling', () => {
    it('returns false for on_request items', () => {
      const item: PriceItem = { price_type: 'on_request', price_inr: null, price_max_inr: null };
      expect(satisfiesPriceCeiling(item, 100000)).toBe(false);
    });

    it('checks price_inr against ceiling for fixed, starting_from, and range', () => {
      const cheapItem: PriceItem = { price_type: 'fixed', price_inr: 500, price_max_inr: null };
      const expensiveItem: PriceItem = { price_type: 'fixed', price_inr: 1500, price_max_inr: null };

      expect(satisfiesPriceCeiling(cheapItem, 1000)).toBe(true);
      expect(satisfiesPriceCeiling(expensiveItem, 1000)).toBe(false);
    });
  });
});
