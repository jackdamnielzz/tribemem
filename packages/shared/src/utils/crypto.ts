import { randomBytes, createHash } from 'node:crypto';

/** Prefix for live API keys */
const API_KEY_PREFIX = 'tm_live_';

/** Prefix for test/sandbox API keys */
const API_KEY_TEST_PREFIX = 'tm_test_';

/** Number of random bytes to generate for a key */
const KEY_BYTE_LENGTH = 32;

/** Number of characters from the key to store as the prefix for identification */
const STORED_PREFIX_LENGTH = 12;

/**
 * Generates a new API key with the `tm_live_` prefix.
 *
 * @returns An object containing the full key (shown once to the user),
 *          the key prefix (for display/identification), and the SHA-256 hash (for storage).
 *
 * @example
 * ```ts
 * const { fullKey, keyPrefix, keyHash } = generateApiKey();
 * // fullKey:  'tm_live_a3f8...64 chars of base64url...'
 * // keyPrefix: 'tm_live_a3f8'
 * // keyHash:   'sha256 hex digest'
 * ```
 */
export function generateApiKey(test = false): {
  fullKey: string;
  keyPrefix: string;
  keyHash: string;
} {
  const prefix = test ? API_KEY_TEST_PREFIX : API_KEY_PREFIX;
  const randomPart = randomBytes(KEY_BYTE_LENGTH)
    .toString('base64url')
    .replace(/[=]/g, '');
  const fullKey = `${prefix}${randomPart}`;
  const keyPrefix = fullKey.substring(0, prefix.length + STORED_PREFIX_LENGTH);
  const keyHash = hashApiKey(fullKey);

  return { fullKey, keyPrefix, keyHash };
}

/**
 * Computes the SHA-256 hash of an API key for secure storage.
 *
 * @param key - The full API key string.
 * @returns Hex-encoded SHA-256 hash.
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key, 'utf8').digest('hex');
}

/**
 * Extracts the prefix portion of an API key for identification purposes.
 *
 * @param key - The full API key string.
 * @returns The key prefix (e.g., "tm_live_a3f8b2c1d4e5").
 */
export function extractKeyPrefix(key: string): string {
  const prefix = key.startsWith(API_KEY_TEST_PREFIX)
    ? API_KEY_TEST_PREFIX
    : API_KEY_PREFIX;
  return key.substring(0, prefix.length + STORED_PREFIX_LENGTH);
}

/**
 * Validates the format of an API key.
 *
 * @param key - The string to validate.
 * @returns True if the key has a valid format.
 */
export function isValidApiKeyFormat(key: string): boolean {
  if (!key.startsWith(API_KEY_PREFIX) && !key.startsWith(API_KEY_TEST_PREFIX)) {
    return false;
  }
  const prefix = key.startsWith(API_KEY_TEST_PREFIX)
    ? API_KEY_TEST_PREFIX
    : API_KEY_PREFIX;
  const randomPart = key.substring(prefix.length);
  // base64url characters only, reasonable length
  return /^[A-Za-z0-9_-]{32,64}$/.test(randomPart);
}

/**
 * Generates a secure random token (e.g., for invitation links).
 *
 * @param byteLength - Number of random bytes (default: 32).
 * @returns A base64url-encoded random token.
 */
export function generateSecureToken(byteLength = 32): string {
  return randomBytes(byteLength).toString('base64url').replace(/[=]/g, '');
}

/**
 * Computes a SHA-256 hash of arbitrary data.
 *
 * @param data - The data to hash.
 * @returns Hex-encoded SHA-256 hash.
 */
export function sha256(data: string): string {
  return createHash('sha256').update(data, 'utf8').digest('hex');
}
