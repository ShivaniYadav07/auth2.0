import { RefreshToken } from '../models/RefreshToken.js';
import { signAccessToken, getAccessTokenTtlSeconds } from '../auth/jwt.js';
import { generateRandomToken, hashToken } from '../utils/crypto.js';
import { config } from '../config/env.js';
import { AppError } from '../errors/AppError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

function refreshTokenExpiry() {
  return new Date(Date.now() + config.refreshToken.ttlDays * 24 * 60 * 60 * 1000);
}

/**
 * Issues a fresh access/refresh token pair and persists the refresh token (hashed).
 * `clientId` is the OAuthClient's Mongo _id, or null for a first-party user session.
 */
export async function issueTokenPair({ userId, clientId = null, scope = '' }) {
  const accessToken = signAccessToken({ userId, clientId, scope });
  const refreshTokenPlaintext = generateRandomToken();

  const refreshTokenDoc = await RefreshToken.create({
    tokenHash: hashToken(refreshTokenPlaintext),
    user: userId,
    client: clientId,
    scope,
    expiresAt: refreshTokenExpiry(),
  });

  return {
    accessToken,
    accessTokenExpiresIn: getAccessTokenTtlSeconds(accessToken),
    refreshToken: refreshTokenPlaintext,
    refreshTokenDoc,
  };
}

/**
 * Validates and rotates a refresh token: the presented token is revoked and a new one is
 * issued in the same chain. If a token that was already rotated (or revoked) is presented
 * again, that's a strong signal it was stolen - the entire chain for that user/client pair
 * is revoked as a compromise response (RFC 6749 section 10.4).
 */
export async function rotateRefreshToken(presentedToken, { clientId = null } = {}) {
  const tokenHash = hashToken(presentedToken);
  const record = await RefreshToken.findOne({ tokenHash });

  const invalidGrant = (message = 'Refresh token is invalid or expired') =>
    new AppError(message, HTTP_STATUS.UNAUTHORIZED, 'INVALID_REFRESH_TOKEN');

  if (!record) throw invalidGrant();

  const recordClientId = record.client ? record.client.toString() : null;
  const requestedClientId = clientId ? clientId.toString() : null;
  if (recordClientId !== requestedClientId) throw invalidGrant();

  if (record.revokedAt) {
    await RefreshToken.updateMany(
      { user: record.user, client: record.client, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
    throw invalidGrant(
      'Refresh token reuse detected; all sessions for this client have been revoked',
    );
  }

  if (record.expiresAt.getTime() < Date.now()) throw invalidGrant('Refresh token has expired');

  const { accessToken, accessTokenExpiresIn, refreshToken, refreshTokenDoc } = await issueTokenPair(
    {
      userId: record.user,
      clientId: record.client,
      scope: record.scope,
    },
  );

  record.revokedAt = new Date();
  record.replacedByTokenHash = refreshTokenDoc.tokenHash;
  await record.save();

  return {
    accessToken,
    accessTokenExpiresIn,
    refreshToken,
    userId: record.user,
    clientId: record.client,
    scope: record.scope,
  };
}

/** Idempotent by design (RFC 7009): revoking an unknown or already-revoked token still succeeds. */
export async function revokeRefreshTokenByValue(presentedToken) {
  const tokenHash = hashToken(presentedToken);
  await RefreshToken.updateOne({ tokenHash, revokedAt: null }, { $set: { revokedAt: new Date() } });
}
