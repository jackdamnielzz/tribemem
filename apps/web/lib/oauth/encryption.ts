import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  // Expect a 64-character hex string (32 bytes)
  if (key.length !== 64) {
    throw new Error(
      'ENCRYPTION_KEY must be a 64-character hex string (256 bits)',
    );
  }
  return Buffer.from(key, 'hex');
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns a string in the format: iv:authTag:ciphertext (all hex-encoded).
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a string that was encrypted with the encrypt() function.
 * Expects input in the format: iv:authTag:ciphertext (all hex-encoded).
 */
export function decrypt(encryptedText: string): string {
  const key = getEncryptionKey();
  const parts = encryptedText.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format');
  }

  const iv = Buffer.from(parts[0]!, 'hex');
  const authTag = Buffer.from(parts[1]!, 'hex');
  const ciphertext = parts[2]!;

  if (iv.length !== IV_LENGTH) {
    throw new Error('Invalid IV length');
  }

  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error('Invalid auth tag length');
  }

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Encrypt a credentials object to a string for database storage.
 */
export function encryptCredentials(
  credentials: Record<string, unknown>,
): string {
  return encrypt(JSON.stringify(credentials));
}

/**
 * Decrypt a stored credentials string back to an object.
 */
export function decryptCredentials(
  encryptedCredentials: string,
): Record<string, unknown> {
  const json = decrypt(encryptedCredentials);
  return JSON.parse(json) as Record<string, unknown>;
}
