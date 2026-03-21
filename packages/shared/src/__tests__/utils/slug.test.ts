import { describe, it, expect } from 'vitest';
import { generateSlug, generateUniqueSlug, isValidSlug } from '../../utils/slug';

describe('generateSlug', () => {
  it('converts text to a lowercase hyphenated slug', () => {
    expect(generateSlug('My Organization Name')).toBe('my-organization-name');
  });

  it('strips special characters', () => {
    expect(generateSlug('Über Cool!')).toBe('uber-cool');
  });

  it('trims whitespace', () => {
    expect(generateSlug('  hello world  ')).toBe('hello-world');
  });

  it('handles single word input', () => {
    expect(generateSlug('Hello')).toBe('hello');
  });

  it('returns empty string for empty input', () => {
    expect(generateSlug('')).toBe('');
  });

  it('handles numeric input', () => {
    expect(generateSlug('123 456')).toBe('123-456');
  });
});

describe('generateUniqueSlug', () => {
  it('generates a slug with a random suffix', () => {
    const slug = generateUniqueSlug('My Org');
    expect(slug).toMatch(/^my-org-[a-z0-9]{6}$/);
  });

  it('uses the specified suffix length', () => {
    const slug = generateUniqueSlug('Test', 10);
    expect(slug).toMatch(/^test-[a-z0-9]{10}$/);
  });

  it('produces different slugs on successive calls', () => {
    const a = generateUniqueSlug('Same Input');
    const b = generateUniqueSlug('Same Input');
    // Extremely unlikely to collide with 36^6 possibilities
    expect(a).not.toBe(b);
  });

  it('handles suffix length of 1', () => {
    const slug = generateUniqueSlug('Short', 1);
    expect(slug).toMatch(/^short-[a-z0-9]{1}$/);
  });
});

describe('isValidSlug', () => {
  it('returns true for a valid slug', () => {
    expect(isValidSlug('my-organization')).toBe(true);
  });

  it('returns true for a single word slug', () => {
    expect(isValidSlug('hello')).toBe(true);
  });

  it('returns true for a slug with numbers', () => {
    expect(isValidSlug('team-42')).toBe(true);
  });

  it('returns false for uppercase characters', () => {
    expect(isValidSlug('My-Org')).toBe(false);
  });

  it('returns false for leading hyphen', () => {
    expect(isValidSlug('-invalid')).toBe(false);
  });

  it('returns false for trailing hyphen', () => {
    expect(isValidSlug('invalid-')).toBe(false);
  });

  it('returns false for consecutive hyphens', () => {
    expect(isValidSlug('double--hyphen')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isValidSlug('')).toBe(false);
  });

  it('returns false for spaces', () => {
    expect(isValidSlug('has space')).toBe(false);
  });

  it('returns false for special characters', () => {
    expect(isValidSlug('hello!')).toBe(false);
  });
});
