import { describe, it, expect } from 'vitest';
import {
  generateApiKey,
  hashApiKey,
  extractKeyPrefix,
  isValidApiKeyFormat,
  generateSecureToken,
  sha256,
} from '../../utils/crypto';

describe('generateApiKey', () => {
  it('generates a live API key with tm_live_ prefix', () => {
    const { fullKey, keyPrefix, keyHash } = generateApiKey();
    expect(fullKey).toMatch(/^tm_live_/);
    expect(keyPrefix).toMatch(/^tm_live_/);
    expect(keyHash).toHaveLength(64); // SHA-256 hex digest
  });

  it('generates a test API key with tm_test_ prefix', () => {
    const { fullKey, keyPrefix, keyHash } = generateApiKey(true);
    expect(fullKey).toMatch(/^tm_test_/);
    expect(keyPrefix).toMatch(/^tm_test_/);
    expect(keyHash).toHaveLength(64);
  });

  it('keyPrefix is a prefix of fullKey', () => {
    const { fullKey, keyPrefix } = generateApiKey();
    expect(fullKey.startsWith(keyPrefix)).toBe(true);
  });

  it('keyPrefix has the expected length (prefix + 12 chars)', () => {
    const { keyPrefix } = generateApiKey();
    // tm_live_ = 8 chars + 12 = 20
    expect(keyPrefix).toHaveLength(20);
  });

  it('keyPrefix for test key has the expected length', () => {
    const { keyPrefix } = generateApiKey(true);
    // tm_test_ = 8 chars + 12 = 20
    expect(keyPrefix).toHaveLength(20);
  });

  it('keyHash matches the hash of fullKey', () => {
    const { fullKey, keyHash } = generateApiKey();
    expect(hashApiKey(fullKey)).toBe(keyHash);
  });

  it('generates unique keys on successive calls', () => {
    const a = generateApiKey();
    const b = generateApiKey();
    expect(a.fullKey).not.toBe(b.fullKey);
    expect(a.keyHash).not.toBe(b.keyHash);
  });
});

describe('hashApiKey', () => {
  it('returns a 64-character hex string', () => {
    const hash = hashApiKey('tm_live_testkey123');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('produces consistent hashes for the same input', () => {
    const key = 'tm_live_somekey';
    expect(hashApiKey(key)).toBe(hashApiKey(key));
  });

  it('produces different hashes for different inputs', () => {
    expect(hashApiKey('key_a')).not.toBe(hashApiKey('key_b'));
  });
});

describe('extractKeyPrefix', () => {
  it('extracts prefix from a live key', () => {
    const { fullKey, keyPrefix } = generateApiKey();
    expect(extractKeyPrefix(fullKey)).toBe(keyPrefix);
  });

  it('extracts prefix from a test key', () => {
    const { fullKey, keyPrefix } = generateApiKey(true);
    expect(extractKeyPrefix(fullKey)).toBe(keyPrefix);
  });
});

describe('isValidApiKeyFormat', () => {
  it('returns true for a valid live key', () => {
    const { fullKey } = generateApiKey();
    expect(isValidApiKeyFormat(fullKey)).toBe(true);
  });

  it('returns true for a valid test key', () => {
    const { fullKey } = generateApiKey(true);
    expect(isValidApiKeyFormat(fullKey)).toBe(true);
  });

  it('returns false for a key without proper prefix', () => {
    expect(isValidApiKeyFormat('invalid_prefix_key')).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isValidApiKeyFormat('')).toBe(false);
  });

  it('returns false for a key with too short random part', () => {
    expect(isValidApiKeyFormat('tm_live_short')).toBe(false);
  });
});

describe('generateSecureToken', () => {
  it('generates a non-empty string', () => {
    const token = generateSecureToken();
    expect(token.length).toBeGreaterThan(0);
  });

  it('generates unique tokens', () => {
    const a = generateSecureToken();
    const b = generateSecureToken();
    expect(a).not.toBe(b);
  });

  it('respects custom byte length', () => {
    const short = generateSecureToken(8);
    const long = generateSecureToken(64);
    expect(long.length).toBeGreaterThan(short.length);
  });

  it('produces base64url-safe characters only', () => {
    const token = generateSecureToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe('sha256', () => {
  it('returns a 64-character hex string', () => {
    const hash = sha256('hello world');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('produces consistent hashes', () => {
    expect(sha256('test')).toBe(sha256('test'));
  });

  it('produces the known SHA-256 of an empty string', () => {
    expect(sha256('')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
  });
});
