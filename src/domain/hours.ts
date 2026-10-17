/**
 * Pure domain opening hours and open_now calculation engine per PRD Section 7.3 and Architecture Section 4.3.
 * Evaluates strictly in Asia/Kolkata timezone with zero external dependencies.
 */

export interface ShopHourInterval {
  weekday: number; // 0 = Monday ... 6 = Sunday
  open_time: string; // HH:MM
  close_time: string; // HH:MM
}

export interface ShopClosure {
  closed_on: string; // YYYY-MM-DD in Asia/Kolkata
  reason?: string | null;
}

export type HoursStatus = 'unknown' | 'set';

interface IstDateParts {
  dateStr: string; // YYYY-MM-DD
  weekday: number; // 0 = Monday ... 6 = Sunday
  timeStr: string; // HH:MM
}

const WEEKDAY_MAP: Record<string, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};

/**
 * Extracts Asia/Kolkata date, weekday (0-6), and time string from any Date object.
 */
export function getIstParts(date: Date = new Date()): IstDateParts {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  let year = '';
  let month = '';
  let day = '';
  let weekdayStr = '';
  let hour = '';
  let minute = '';

  for (const p of parts) {
    if (p.type === 'year') year = p.value;
    else if (p.type === 'month') month = p.value;
    else if (p.type === 'day') day = p.value;
    else if (p.type === 'weekday') weekdayStr = p.value;
    else if (p.type === 'hour') hour = p.value === '24' ? '00' : p.value;
    else if (p.type === 'minute') minute = p.value;
  }

  const weekday = WEEKDAY_MAP[weekdayStr] ?? 0;
  return {
    dateStr: `${year}-${month}-${day}`,
    weekday,
    timeStr: `${hour}:${minute}`,
  };
}

/**
 * Determines whether a shop is open right now in Asia/Kolkata.
 * Returns true, false, or null (if hours_status is 'unknown').
 */
export function evaluateOpenNow(
  hoursStatus: HoursStatus,
  intervals: ShopHourInterval[],
  closures: ShopClosure[] = [],
  now: Date = new Date()
): boolean | null {
  if (hoursStatus === 'unknown') {
    return null;
  }

  const today = getIstParts(now);
  // Asia/Kolkata has fixed UTC+5:30 offset with no DST, so subtracting 24h is exact
  const yesterday = getIstParts(new Date(now.getTime() - 24 * 60 * 60 * 1000));

  const closedSet = new Set(closures.map((c) => c.closed_on));

  // 1. Check intervals starting on today
  if (!closedSet.has(today.dateStr)) {
    for (const interval of intervals) {
      if (interval.weekday !== today.weekday) continue;

      const { open_time, close_time } = interval;
      if (close_time > open_time) {
        // Same-day interval
        if (open_time <= today.timeStr && today.timeStr < close_time) {
          return true;
        }
      } else if (close_time < open_time) {
        // Overnight interval starting today
        if (today.timeStr >= open_time) {
          return true;
        }
      }
    }
  }

  // 2. Check intervals starting yesterday that extend into today
  if (!closedSet.has(yesterday.dateStr)) {
    for (const interval of intervals) {
      if (interval.weekday !== yesterday.weekday) continue;

      const { open_time, close_time } = interval;
      if (close_time < open_time) {
        // Overnight interval starting yesterday morning/night
        if (today.timeStr < close_time) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Formats today's hours as a human-readable string (e.g. "09:00–18:00").
 */
export function formatTodayHours(
  hoursStatus: HoursStatus,
  intervals: ShopHourInterval[],
  closures: ShopClosure[] = [],
  now: Date = new Date()
): string {
  if (hoursStatus === 'unknown') {
    return 'Hours not provided';
  }

  const today = getIstParts(now);
  const closedSet = new Set(closures.map((c) => c.closed_on));
  if (closedSet.has(today.dateStr)) {
    return 'Closed today';
  }

  const todayIntervals = intervals
    .filter((i) => i.weekday === today.weekday)
    .sort((a, b) => a.open_time.localeCompare(b.open_time));

  if (todayIntervals.length === 0) {
    return 'Closed today';
  }

  return todayIntervals
    .map((i) => `${i.open_time}–${i.close_time}`)
    .join(', ');
}

/**
 * Formats weekly hours array (7 elements, Monday to Sunday).
 */
export function formatWeeklyHours(
  hoursStatus: HoursStatus,
  intervals: ShopHourInterval[]
): string[][] | null {
  if (hoursStatus === 'unknown') {
    return null;
  }

  const result: string[][] = [];
  for (let weekday = 0; weekday < 7; weekday++) {
    const dayIntervals = intervals
      .filter((i) => i.weekday === weekday)
      .sort((a, b) => a.open_time.localeCompare(b.open_time))
      .map((i) => `${i.open_time}–${i.close_time}`);
    result.push(dayIntervals);
  }

  return result;
}

/**
 * Validates intervals to ensure no equal times and no overlaps on the same weekday.
 */
export function validateIntervals(
  intervals: ShopHourInterval[]
): { valid: boolean; error?: string } {
  for (const interval of intervals) {
    if (interval.open_time === interval.close_time) {
      return {
        valid: false,
        error: `Opening and closing time cannot be identical: ${interval.open_time}`,
      };
    }
  }

  // Check overlap per weekday
  for (let day = 0; day < 7; day++) {
    const dayIntervals = intervals
      .filter((i) => i.weekday === day)
      .sort((a, b) => a.open_time.localeCompare(b.open_time));

    for (let i = 0; i < dayIntervals.length - 1; i++) {
      const current = dayIntervals[i];
      const next = dayIntervals[i + 1];
      if (!current || !next) continue;

      // If current is overnight, it extends through midnight (overlaps with any later start on same day)
      if (current.close_time < current.open_time) {
        return {
          valid: false,
          error: `Overnight interval ${current.open_time}–${current.close_time} conflicts with ${next.open_time}–${next.close_time}`,
        };
      }

      // If same-day, current close time must be <= next open time
      if (current.close_time > next.open_time) {
        return {
          valid: false,
          error: `Intervals overlap: ${current.open_time}–${current.close_time} and ${next.open_time}–${next.close_time}`,
        };
      }
    }
  }

  return { valid: true };
}
