import { describe, it, expect } from 'vitest';
import {
  evaluateOpenNow,
  formatTodayHours,
  formatWeeklyHours,
  validateIntervals,
  type ShopHourInterval,
  type ShopClosure,
} from '@/domain/hours';

describe('Hours & open_now Domain Module (Pure Unit Tests)', () => {
  // Helper to create fixed IST Date
  // Note: 2026-10-19 is a Monday
  function makeIstDate(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number
  ): Date {
    // Construct ISO with +05:30 offset
    const pad = (n: number) => String(n).padStart(2, '0');
    return new Date(
      `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00+05:30`
    );
  }

  describe('evaluateOpenNow', () => {
    it('returns null when hours_status is unknown', () => {
      const now = makeIstDate(2026, 10, 19, 12, 0); // Monday noon
      expect(evaluateOpenNow('unknown', [], [], now)).toBe(null);
    });

    it('returns false for day with no intervals when hours_status is set', () => {
      const now = makeIstDate(2026, 10, 19, 12, 0);
      expect(evaluateOpenNow('set', [], [], now)).toBe(false);
    });

    it('evaluates daytime same-day interval correctly', () => {
      // Monday 09:00 - 18:00
      const intervals: ShopHourInterval[] = [
        { weekday: 0, open_time: '09:00', close_time: '18:00' },
      ];

      expect(evaluateOpenNow('set', intervals, [], makeIstDate(2026, 10, 19, 8, 59))).toBe(false);
      expect(evaluateOpenNow('set', intervals, [], makeIstDate(2026, 10, 19, 9, 0))).toBe(true);
      expect(evaluateOpenNow('set', intervals, [], makeIstDate(2026, 10, 19, 12, 30))).toBe(true);
      expect(evaluateOpenNow('set', intervals, [], makeIstDate(2026, 10, 19, 17, 59))).toBe(true);
      expect(evaluateOpenNow('set', intervals, [], makeIstDate(2026, 10, 19, 18, 0))).toBe(false);
    });

    it('evaluates split shifts correctly', () => {
      // Monday 09:00 - 13:00 and 16:00 - 21:00
      const intervals: ShopHourInterval[] = [
        { weekday: 0, open_time: '09:00', close_time: '13:00' },
        { weekday: 0, open_time: '16:00', close_time: '21:00' },
      ];

      expect(evaluateOpenNow('set', intervals, [], makeIstDate(2026, 10, 19, 11, 0))).toBe(true);
      expect(evaluateOpenNow('set', intervals, [], makeIstDate(2026, 10, 19, 14, 0))).toBe(false);
      expect(evaluateOpenNow('set', intervals, [], makeIstDate(2026, 10, 19, 17, 30))).toBe(true);
      expect(evaluateOpenNow('set', intervals, [], makeIstDate(2026, 10, 19, 21, 30))).toBe(false);
    });

    it('evaluates overnight interval across midnight into next calendar day', () => {
      // Monday (weekday 0) 20:00 - 02:00 (Tuesday morning)
      const intervals: ShopHourInterval[] = [
        { weekday: 0, open_time: '20:00', close_time: '02:00' },
      ];

      // Monday night
      expect(evaluateOpenNow('set', intervals, [], makeIstDate(2026, 10, 19, 19, 59))).toBe(false);
      expect(evaluateOpenNow('set', intervals, [], makeIstDate(2026, 10, 19, 20, 0))).toBe(true);
      expect(evaluateOpenNow('set', intervals, [], makeIstDate(2026, 10, 19, 23, 59))).toBe(true);

      // Tuesday morning (belonging to Monday night shift)
      expect(evaluateOpenNow('set', intervals, [], makeIstDate(2026, 10, 20, 0, 0))).toBe(true);
      expect(evaluateOpenNow('set', intervals, [], makeIstDate(2026, 10, 20, 1, 59))).toBe(true);
      expect(evaluateOpenNow('set', intervals, [], makeIstDate(2026, 10, 20, 2, 0))).toBe(false);
    });

    it('evaluates Sunday to Monday overnight wrap', () => {
      // Sunday (weekday 6) 22:00 - 04:00 (Monday morning)
      // 2026-10-18 is Sunday, 2026-10-19 is Monday
      const intervals: ShopHourInterval[] = [
        { weekday: 6, open_time: '22:00', close_time: '04:00' },
      ];

      expect(evaluateOpenNow('set', intervals, [], makeIstDate(2026, 10, 18, 23, 0))).toBe(true);
      expect(evaluateOpenNow('set', intervals, [], makeIstDate(2026, 10, 19, 2, 30))).toBe(true);
      expect(evaluateOpenNow('set', intervals, [], makeIstDate(2026, 10, 19, 4, 0))).toBe(false);
    });

    it('handles 24 hours (00:00 - 23:59)', () => {
      const intervals: ShopHourInterval[] = [
        { weekday: 0, open_time: '00:00', close_time: '23:59' },
      ];

      expect(evaluateOpenNow('set', intervals, [], makeIstDate(2026, 10, 19, 0, 0))).toBe(true);
      expect(evaluateOpenNow('set', intervals, [], makeIstDate(2026, 10, 19, 15, 30))).toBe(true);
      expect(evaluateOpenNow('set', intervals, [], makeIstDate(2026, 10, 19, 23, 58))).toBe(true);
    });

    it('cancels entire overnight interval if start date is in shop_closures', () => {
      // Monday 20:00 - 02:00 (Tuesday)
      const intervals: ShopHourInterval[] = [
        { weekday: 0, open_time: '20:00', close_time: '02:00' },
      ];
      const closures: ShopClosure[] = [
        { closed_on: '2026-10-19', reason: 'Holiday' },
      ];

      // Monday night is closed
      expect(evaluateOpenNow('set', intervals, closures, makeIstDate(2026, 10, 19, 21, 0))).toBe(false);
      // Tuesday morning tail is also cancelled per rule 7.3.3
      expect(evaluateOpenNow('set', intervals, closures, makeIstDate(2026, 10, 20, 1, 0))).toBe(false);
    });
  });

  describe('formatTodayHours', () => {
    it('returns "Hours not provided" for unknown status', () => {
      expect(formatTodayHours('unknown', [], [], makeIstDate(2026, 10, 19, 12, 0))).toBe(
        'Hours not provided'
      );
    });

    it('returns "Closed today" for closure or no intervals', () => {
      expect(formatTodayHours('set', [], [], makeIstDate(2026, 10, 19, 12, 0))).toBe(
        'Closed today'
      );
      const closures = [{ closed_on: '2026-10-19' }];
      const intervals = [{ weekday: 0, open_time: '09:00', close_time: '18:00' }];
      expect(formatTodayHours('set', intervals, closures, makeIstDate(2026, 10, 19, 12, 0))).toBe(
        'Closed today'
      );
    });

    it('formats active intervals with en-dash', () => {
      const intervals = [
        { weekday: 0, open_time: '09:00', close_time: '13:00' },
        { weekday: 0, open_time: '16:00', close_time: '21:00' },
      ];
      expect(formatTodayHours('set', intervals, [], makeIstDate(2026, 10, 19, 12, 0))).toBe(
        '09:00–13:00, 16:00–21:00'
      );
    });
  });

  describe('formatWeeklyHours', () => {
    it('returns null when unknown', () => {
      expect(formatWeeklyHours('unknown', [])).toBe(null);
    });

    it('returns 7 days array with formatted hours or empty array', () => {
      const intervals: ShopHourInterval[] = [
        { weekday: 0, open_time: '09:00', close_time: '18:00' },
        { weekday: 1, open_time: '10:00', close_time: '19:00' },
      ];
      const weekly = formatWeeklyHours('set', intervals);
      expect(weekly).not.toBeNull();
      expect(weekly?.length).toBe(7);
      expect(weekly?.[0]).toEqual(['09:00–18:00']);
      expect(weekly?.[1]).toEqual(['10:00–19:00']);
      expect(weekly?.[2]).toEqual([]); // Wednesday closed
    });
  });

  describe('validateIntervals', () => {
    it('accepts valid non-overlapping intervals', () => {
      const intervals = [
        { weekday: 0, open_time: '09:00', close_time: '13:00' },
        { weekday: 0, open_time: '14:00', close_time: '18:00' },
      ];
      expect(validateIntervals(intervals).valid).toBe(true);
    });

    it('rejects equal open and close time', () => {
      const intervals = [{ weekday: 0, open_time: '09:00', close_time: '09:00' }];
      expect(validateIntervals(intervals).valid).toBe(false);
    });

    it('rejects overlapping intervals on same weekday', () => {
      const intervals = [
        { weekday: 0, open_time: '09:00', close_time: '14:00' },
        { weekday: 0, open_time: '13:00', close_time: '18:00' },
      ];
      expect(validateIntervals(intervals).valid).toBe(false);
    });
  });
});
