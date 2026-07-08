import { AuthorizationCode } from '../models/AuthorizationCode.js';
import { generateRandomToken, hashToken } from '../utils/crypto.js';
import { config } from '../config/env.js';
import { OAuthError } from '../errors/OAuthError.js';
import { OAUTH_ERROR_CODES } from '../constants/oauth.js';
import { logger } from '../config/logger.js';

export async function issueAuthorizationCode({ clientMongoId, userId, redirectUri, scope }) {
  const code = generateRandomToken(32);

  await AuthorizationCode.create({
    codeHash: hashToken(code),
    client: clientMongoId,
    user: userId,
    redirectUri,
    scope,
    expiresAt: new Date(Date.now() + config.authCode.ttlSeconds * 1000),
  });

  return code;
}

/**
 * Redeems a code for its associated user/scope. Codes are single-use and bound to the
 * exact client and redirect_uri they were issued for (RFC 6749 section 4.1.3) - this is
 * what stops a stolen authorization code from being redeemed by anyone but the original
 * client, against the original callback URL.
 */
export async function consumeAuthorizationCode({ code, clientMongoId, redirectUri }) {
  const codeHash = hashToken(code);
  const record = await AuthorizationCode.findOne({ codeHash });

  const invalidGrant = (reason) => {
    logger.warn({ reason }, 'Authorization code redemption rejected');
    return new OAuthError(
      OAUTH_ERROR_CODES.INVALID_GRANT,
      'The authorization code is invalid or has expired',
    );
  };

  if (!record) throw invalidGrant('code_not_found');
  if (record.used) throw invalidGrant('code_already_used');
  if (record.expiresAt.getTime() < Date.now()) throw invalidGrant('code_expired');
  if (record.client.toString() !== clientMongoId.toString()) throw invalidGrant('client_mismatch');
  if (record.redirectUri !== redirectUri) throw invalidGrant('redirect_uri_mismatch');

  record.used = true;
  await record.save();

  return { userId: record.user, scope: record.scope };
}
