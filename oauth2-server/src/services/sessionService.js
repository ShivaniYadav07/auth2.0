import { Session } from '../models/Session.js';
import { generateRandomToken, hashToken } from '../utils/crypto.js';
import { config } from '../config/env.js';

/**
 * Creates a browser login session and returns the opaque session id to put in the `sid`
 * cookie. Only the hash is persisted, so a leaked database dump cannot be used to hijack
 * sessions.
 */
export async function createSession({ userId, userAgent = null }) {
  const sessionId = generateRandomToken(32);
  const expiresAt = new Date(Date.now() + config.session.ttlDays * 24 * 60 * 60 * 1000);

  await Session.create({
    sessionTokenHash: hashToken(sessionId),
    user: userId,
    userAgent,
    expiresAt,
  });

  return sessionId;
}

/**
 * Resolves the logged-in user id from a `sid` cookie value, or null if there is no valid,
 * unexpired session. The expiry check is defensive: MongoDB's TTL sweep is periodic, so a
 * just-expired session could still be present between sweeps.
 */
export async function getUserIdFromSession(sessionId) {
  if (!sessionId) return null;

  const session = await Session.findOne({ sessionTokenHash: hashToken(sessionId) });
  if (!session || session.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  return session.user;
}

/** Ends a browser session (logout). No-op if the cookie is missing or already gone. */
export async function destroySession(sessionId) {
  if (!sessionId) return;
  await Session.deleteOne({ sessionTokenHash: hashToken(sessionId) });
}
