import {
  format,
  formatDistanceToNow,
  parseISO,
  isValid,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  addDays,
  startOfMonth,
  endOfMonth,
  isBefore,
  isAfter,
} from 'date-fns';

/**
 * Formats an ISO date string into a human-readable date.
 *
 * @param isoString - ISO 8601 date string.
 * @param formatStr - date-fns format string (default: 'dd MMM yyyy').
 * @returns Formatted date string.
 */
export function formatDate(isoString: string, formatStr = 'dd MMM yyyy'): string {
  return format(parseISO(isoString), formatStr);
}

/**
 * Formats an ISO date string into a human-readable date and time.
 *
 * @param isoString - ISO 8601 date string.
 * @returns Formatted date-time string.
 */
export function formatDateTime(isoString: string): string {
  return format(parseISO(isoString), 'dd MMM yyyy HH:mm');
}

/**
 * Returns a relative time string (e.g., "3 hours ago", "2 days ago").
 *
 * @param isoString - ISO 8601 date string.
 * @returns Relative time string.
 */
export function timeAgo(isoString: string): string {
  return formatDistanceToNow(parseISO(isoString), { addSuffix: true });
}

/**
 * Validates whether a string is a valid ISO 8601 date.
 *
 * @param isoString - The string to validate.
 * @returns True if the string can be parsed as a valid date.
 */
export function isValidISODate(isoString: string): boolean {
  try {
    return isValid(parseISO(isoString));
  } catch {
    return false;
  }
}

/**
 * Returns the number of days between two ISO date strings.
 *
 * @param from - Start date (ISO 8601).
 * @param to - End date (ISO 8601).
 * @returns Number of days between the dates.
 */
export function daysBetween(from: string, to: string): number {
  return differenceInDays(parseISO(to), parseISO(from));
}

/**
 * Returns the number of hours between two ISO date strings.
 */
export function hoursBetween(from: string, to: string): number {
  return differenceInHours(parseISO(to), parseISO(from));
}

/**
 * Returns the number of minutes between two ISO date strings.
 */
export function minutesBetween(from: string, to: string): number {
  return differenceInMinutes(parseISO(to), parseISO(from));
}

/**
 * Checks if an ISO date string is stale (older than the given number of days).
 *
 * @param isoString - ISO 8601 date string to check.
 * @param maxAgeDays - Maximum age in days.
 * @returns True if the date is older than maxAgeDays.
 */
export function isStale(isoString: string, maxAgeDays: number): boolean {
  const date = parseISO(isoString);
  const threshold = addDays(new Date(), -maxAgeDays);
  return isBefore(date, threshold);
}

/**
 * Returns the start and end of the current billing period (calendar month).
 */
export function getCurrentBillingPeriod(): { start: string; end: string } {
  const now = new Date();
  return {
    start: startOfMonth(now).toISOString(),
    end: endOfMonth(now).toISOString(),
  };
}

/**
 * Checks if a date is within a given range.
 */
export function isWithinRange(
  isoString: string,
  rangeStart: string,
  rangeEnd: string,
): boolean {
  const date = parseISO(isoString);
  const start = parseISO(rangeStart);
  const end = parseISO(rangeEnd);
  return (isAfter(date, start) || date.getTime() === start.getTime()) &&
    (isBefore(date, end) || date.getTime() === end.getTime());
}

/**
 * Returns the current time as an ISO 8601 string.
 */
export function nowISO(): string {
  return new Date().toISOString();
}
