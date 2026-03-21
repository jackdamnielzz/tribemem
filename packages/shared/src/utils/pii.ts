/**
 * PII (Personally Identifiable Information) detection patterns and utilities.
 *
 * Used to scan knowledge unit content before storage to prevent
 * accidental leakage of sensitive information.
 */

export interface PIIMatch {
  type: PIIType;
  match: string;
  index: number;
  /** A masked version of the matched value for logging */
  masked: string;
}

export type PIIType = 'email' | 'phone' | 'card_number' | 'credential' | 'ip_address';

interface PIIPattern {
  type: PIIType;
  label: string;
  pattern: RegExp;
  mask: (match: string) => string;
}

const PII_PATTERNS: PIIPattern[] = [
  {
    type: 'email',
    label: 'Email address',
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    mask: (m) => {
      const [local, domain] = m.split('@');
      return `${local[0]}***@${domain}`;
    },
  },
  {
    type: 'phone',
    label: 'Phone number',
    // Matches international and common formats: +31612345678, (555) 123-4567, 06-12345678
    pattern: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/g,
    mask: (m) => {
      const digits = m.replace(/\D/g, '');
      if (digits.length < 7) return m; // Too short to be a phone number
      return `${m.substring(0, 3)}***${m.substring(m.length - 2)}`;
    },
  },
  {
    type: 'card_number',
    label: 'Credit/debit card number',
    // Matches 13-19 digit sequences that may contain spaces or hyphens (common card formats)
    pattern: /\b(?:\d[\s-]?){13,19}\b/g,
    mask: (m) => {
      const digits = m.replace(/\D/g, '');
      return `****-****-****-${digits.slice(-4)}`;
    },
  },
  {
    type: 'credential',
    label: 'Credential or secret',
    // Matches common secret patterns: API keys, tokens, passwords in config-like strings
    pattern:
      /(?:password|passwd|secret|token|api[_-]?key|access[_-]?key|private[_-]?key|bearer)\s*[:=]\s*['"]?[^\s'"]{8,}['"]?/gi,
    mask: (m) => {
      const separatorIdx = m.search(/[:=]/);
      if (separatorIdx === -1) return '***REDACTED***';
      return `${m.substring(0, separatorIdx + 1)} ***REDACTED***`;
    },
  },
  {
    type: 'ip_address',
    label: 'IP address',
    // Matches IPv4 addresses
    pattern: /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g,
    mask: (m) => {
      const parts = m.split('.');
      return `${parts[0]}.${parts[1]}.***.***`;
    },
  },
];

/**
 * Detects PII in the given text.
 *
 * @param text - The text to scan for PII.
 * @param types - Optional array of PII types to check. Defaults to all types.
 * @returns An array of PII matches found in the text.
 */
export function detectPII(text: string, types?: PIIType[]): PIIMatch[] {
  const matches: PIIMatch[] = [];
  const patterns = types
    ? PII_PATTERNS.filter((p) => types.includes(p.type))
    : PII_PATTERNS;

  for (const { type, pattern, mask } of patterns) {
    // Reset regex state for global patterns
    pattern.lastIndex = 0;
    let regexMatch: RegExpExecArray | null;
    while ((regexMatch = pattern.exec(text)) !== null) {
      // Filter out phone false positives (too few digits)
      if (type === 'phone') {
        const digits = regexMatch[0].replace(/\D/g, '');
        if (digits.length < 7 || digits.length > 15) continue;
      }
      // Filter out card number false positives
      if (type === 'card_number') {
        const digits = regexMatch[0].replace(/\D/g, '');
        if (digits.length < 13 || digits.length > 19) continue;
        if (!passesLuhnCheck(digits)) continue;
      }

      matches.push({
        type,
        match: regexMatch[0],
        index: regexMatch.index,
        masked: mask(regexMatch[0]),
      });
    }
  }

  return matches;
}

/**
 * Validates that a text does not contain PII.
 *
 * @param text - The text to validate.
 * @param types - Optional array of PII types to check.
 * @returns An object with `valid` (true if no PII found) and any `matches`.
 */
export function validateNoPII(
  text: string,
  types?: PIIType[],
): { valid: boolean; matches: PIIMatch[] } {
  const matches = detectPII(text, types);
  return { valid: matches.length === 0, matches };
}

/**
 * Redacts PII from text by replacing matches with masked versions.
 *
 * @param text - The text to redact.
 * @param types - Optional array of PII types to redact.
 * @returns The text with PII replaced by masked values.
 */
export function redactPII(text: string, types?: PIIType[]): string {
  const matches = detectPII(text, types);
  if (matches.length === 0) return text;

  // Sort matches by index descending so replacements don't shift indices
  const sorted = [...matches].sort((a, b) => b.index - a.index);
  let result = text;
  for (const m of sorted) {
    result = result.substring(0, m.index) + m.masked + result.substring(m.index + m.match.length);
  }
  return result;
}

/**
 * Performs Luhn check on a digit string to validate credit card numbers.
 */
function passesLuhnCheck(digits: string): boolean {
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}
