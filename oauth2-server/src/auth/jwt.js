import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

/**
 * Access tokens are stateless JWTs: no DB lookup is needed to validate one, which keeps
 * every protected-resource request fast. The tradeoff (documented in ARCHITECTURE.md) is
 * that an access token can't be revoked before it expires - which is why the TTL is short
 * (default 15m) and long-lived sessions rely on refresh token rotation instead.
 */
export function signAccessToken({ userId, clientId = null, scope = '' }) {
  const payload = { sub: String(userId), scope };
  if (clientId) payload.client_id = clientId;

  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessTokenTtl,
  });
}

/** Throws jsonwebtoken's TokenExpiredError/JsonWebTokenError on invalid or expired tokens. */
export function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.accessSecret);
}

/** Seconds until the given access token expires - used for the OAuth `expires_in` field. */
export function getAccessTokenTtlSeconds(token) {
  const { exp } = jwt.decode(token);
  return Math.max(0, exp - Math.floor(Date.now() / 1000));
}
