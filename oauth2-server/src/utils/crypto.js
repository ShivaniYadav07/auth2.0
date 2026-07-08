import crypto from 'node:crypto';

/** URL-safe random string, used for authorization codes, refresh tokens, and client credentials. */
export function generateRandomToken(byteLength = 32) {
  return crypto.randomBytes(byteLength).toString('base64url');
}

/**
 * Authorization codes and refresh tokens are bearer secrets: whoever holds the string can
 * redeem it. We never store them in plaintext - only their SHA-256 hash - so a leaked
 * database dump doesn't hand out usable credentials. Hashing (vs. bcrypt) is appropriate
 * here because these are high-entropy random tokens, not low-entropy user passwords.
 */
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
