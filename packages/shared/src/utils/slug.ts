import slugify from 'slugify';

const SLUG_OPTIONS: Parameters<typeof slugify>[1] & object = {
  lower: true,
  strict: true,
  trim: true,
};

/**
 * Generates a URL-safe slug from the given text.
 *
 * @param text - The text to slugify.
 * @returns A lowercase, hyphenated slug.
 *
 * @example
 * ```ts
 * generateSlug('My Organization Name'); // => 'my-organization-name'
 * generateSlug('Über Cool!'); // => 'uber-cool'
 * ```
 */
export function generateSlug(text: string): string {
  return slugify(text, SLUG_OPTIONS);
}

/**
 * Generates a unique slug by appending a short random suffix.
 *
 * @param text - The text to slugify.
 * @param suffixLength - Length of the random suffix (default: 6).
 * @returns A slug with a random suffix appended.
 *
 * @example
 * ```ts
 * generateUniqueSlug('My Org'); // => 'my-org-a1b2c3'
 * ```
 */
export function generateUniqueSlug(text: string, suffixLength = 6): string {
  const base = generateSlug(text);
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let suffix = '';
  for (let i = 0; i < suffixLength; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${base}-${suffix}`;
}

/**
 * Validates whether a string is a valid slug.
 *
 * @param slug - The slug to validate.
 * @returns True if the slug contains only lowercase letters, numbers, and hyphens.
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}
