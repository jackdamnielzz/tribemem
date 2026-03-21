import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  formatDate,
  formatDateTime,
  timeAgo,
  isValidISODate,
  daysBetween,
  hoursBetween,
  minutesBetween,
  isStale,
  getCurrentBillingPeriod,
  isWithinRange,
  nowISO,
} from '../../utils/date';

describe('formatDate', () => {
  it('formats an ISO string with the default format', () => {
    expect(formatDate('2024-03-15T10:30:00.000Z')).toBe('15 Mar 2024');
  });

  it('accepts a custom format string', () => {
    expect(formatDate('2024-01-01T00:00:00.000Z', 'yyyy-MM-dd')).toBe('2024-01-01');
  });
});

describe('formatDateTime', () => {
  it('formats an ISO string as date and time', () => {
    const result = formatDateTime('2024-03-15T10:30:00.000Z');
    // The exact output depends on timezone, but it should contain the date portion
    expect(result).toMatch(/15 Mar 2024/);
  });
});

describe('timeAgo', () => {
  it('returns a string with "ago" suffix', () => {
    const recent = new Date(Date.now() - 60_000).toISOString(); // 1 minute ago
    expect(timeAgo(recent)).toMatch(/ago$/);
  });
});

describe('isValidISODate', () => {
  it('returns true for a valid ISO date string', () => {
    expect(isValidISODate('2024-01-15T10:00:00.000Z')).toBe(true);
  });

  it('returns true for a date-only ISO string', () => {
    expect(isValidISODate('2024-01-15')).toBe(true);
  });

  it('returns false for an invalid date string', () => {
    expect(isValidISODate('not-a-date')).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isValidISODate('')).toBe(false);
  });
});

describe('daysBetween', () => {
  it('calculates the number of days between two dates', () => {
    expect(daysBetween('2024-01-01T00:00:00Z', '2024-01-11T00:00:00Z')).toBe(10);
  });

  it('returns 0 for the same date', () => {
    expect(daysBetween('2024-03-15T00:00:00Z', '2024-03-15T00:00:00Z')).toBe(0);
  });

  it('returns negative for reversed dates', () => {
    expect(daysBetween('2024-01-11T00:00:00Z', '2024-01-01T00:00:00Z')).toBe(-10);
  });
});

describe('hoursBetween', () => {
  it('calculates hours between two dates', () => {
    expect(hoursBetween('2024-01-01T00:00:00Z', '2024-01-01T05:00:00Z')).toBe(5);
  });
});

describe('minutesBetween', () => {
  it('calculates minutes between two dates', () => {
    expect(minutesBetween('2024-01-01T00:00:00Z', '2024-01-01T01:30:00Z')).toBe(90);
  });
});

describe('isStale', () => {
  it('returns true for a date older than maxAgeDays', () => {
    const old = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    expect(isStale(old, 7)).toBe(true);
  });

  it('returns false for a recent date', () => {
    const recent = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
    expect(isStale(recent, 7)).toBe(false);
  });
});

describe('getCurrentBillingPeriod', () => {
  it('returns start and end as ISO strings', () => {
    const { start, end } = getCurrentBillingPeriod();
    expect(isValidISODate(start)).toBe(true);
    expect(isValidISODate(end)).toBe(true);
  });

  it('start is before end', () => {
    const { start, end } = getCurrentBillingPeriod();
    expect(new Date(start).getTime()).toBeLessThan(new Date(end).getTime());
  });
});

describe('isWithinRange', () => {
  it('returns true when date is within range', () => {
    expect(
      isWithinRange('2024-06-15T00:00:00Z', '2024-06-01T00:00:00Z', '2024-06-30T00:00:00Z'),
    ).toBe(true);
  });

  it('returns true when date equals range start', () => {
    expect(
      isWithinRange('2024-06-01T00:00:00Z', '2024-06-01T00:00:00Z', '2024-06-30T00:00:00Z'),
    ).toBe(true);
  });

  it('returns true when date equals range end', () => {
    expect(
      isWithinRange('2024-06-30T00:00:00Z', '2024-06-01T00:00:00Z', '2024-06-30T00:00:00Z'),
    ).toBe(true);
  });

  it('returns false when date is before range', () => {
    expect(
      isWithinRange('2024-05-31T00:00:00Z', '2024-06-01T00:00:00Z', '2024-06-30T00:00:00Z'),
    ).toBe(false);
  });

  it('returns false when date is after range', () => {
    expect(
      isWithinRange('2024-07-01T00:00:00Z', '2024-06-01T00:00:00Z', '2024-06-30T00:00:00Z'),
    ).toBe(false);
  });
});

describe('nowISO', () => {
  it('returns a valid ISO string', () => {
    const result = nowISO();
    expect(isValidISODate(result)).toBe(true);
  });

  it('returns a time close to the current time', () => {
    const before = Date.now();
    const result = new Date(nowISO()).getTime();
    const after = Date.now();
    expect(result).toBeGreaterThanOrEqual(before);
    expect(result).toBeLessThanOrEqual(after);
  });
});
