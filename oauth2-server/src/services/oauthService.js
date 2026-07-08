import * as oauthClientService from './oauthClientService.js';
import * as authorizationCodeService from './authorizationCodeService.js';
import * as tokenService from './tokenService.js';
import { parseScope, formatScope, isScopeAllowedForClient } from '../auth/scope.js';
import { DEFAULT_SCOPE, OAUTH_ERROR_CODES } from '../constants/oauth.js';
import { OAuthError } from '../errors/OAuthError.js';
import { AppError } from '../errors/AppError.js';

/**
 * Shared by the authorize GET (render consent) and POST (submit decision) handlers.
 * Validates client_id and redirect_uri together *before* anything else - if either is
 * wrong we must show a JSON/UI error instead of redirecting, since redirecting on an
 * unverified redirect_uri is exactly the open-redirect risk this check prevents.
 */
export async function validateAuthorizationRequest({ clientId, redirectUri, scope }) {
  const client = await oauthClientService.findActiveClientByClientId(clientId);
  oauthClientService.assertRedirectUriIsRegistered(client, redirectUri);

  const requestedScopes = scope ? parseScope(scope) : [DEFAULT_SCOPE];
  if (!isScopeAllowedForClient(requestedScopes, client)) {
    throw new OAuthError(
      OAUTH_ERROR_CODES.INVALID_SCOPE,
      'One or more requested scopes are not permitted',
    );
  }

  return { client, scope: formatScope(requestedScopes) };
}

export async function issueAuthorizationCode({ client, userId, redirectUri, scope }) {
  return authorizationCodeService.issueAuthorizationCode({
    clientMongoId: client._id,
    userId,
    redirectUri,
    scope,
  });
}

export async function exchangeAuthorizationCode({ code, redirectUri, clientId, clientSecret }) {
  const client = await oauthClientService.verifyClientCredentials(clientId, clientSecret);
  const { userId, scope } = await authorizationCodeService.consumeAuthorizationCode({
    code,
    clientMongoId: client._id,
    redirectUri,
  });

  const { accessToken, accessTokenExpiresIn, refreshToken } = await tokenService.issueTokenPair({
    userId,
    clientId: client._id,
    scope,
  });

  return { accessToken, accessTokenExpiresIn, refreshToken, scope };
}

export async function exchangeRefreshToken({ refreshToken, clientId, clientSecret }) {
  const client = await oauthClientService.verifyClientCredentials(clientId, clientSecret);

  try {
    const result = await tokenService.rotateRefreshToken(refreshToken, { clientId: client._id });
    return {
      accessToken: result.accessToken,
      accessTokenExpiresIn: result.accessTokenExpiresIn,
      refreshToken: result.refreshToken,
      scope: result.scope,
    };
  } catch (err) {
    // Re-thrown using OAuth vocabulary: the token endpoint always speaks RFC 6749 errors,
    // regardless of the internal reason (not found, expired, reused, client mismatch).
    // Anything else (e.g. a DB error) is an unexpected bug and must propagate as-is.
    if (err instanceof AppError && err.code === 'INVALID_REFRESH_TOKEN') {
      throw new OAuthError(
        OAUTH_ERROR_CODES.INVALID_GRANT,
        'The refresh token is invalid, expired, or revoked',
      );
    }
    throw err;
  }
}

export async function revokeToken({ token, clientId, clientSecret }) {
  await oauthClientService.verifyClientCredentials(clientId, clientSecret);
  // RFC 7009: revocation of an unknown/already-invalid token still returns success -
  // this keeps the endpoint from being usable to probe which tokens exist.
  await tokenService.revokeRefreshTokenByValue(token);
}
