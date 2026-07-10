import * as oauthClientService from '../services/oauthClientService.js';
import * as oauthService from '../services/oauthService.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { GRANT_TYPES, OAUTH_ERROR_CODES } from '../constants/oauth.js';
import { OAuthError } from '../errors/OAuthError.js';

export const registerClient = asyncHandler(async (req, res) => {
  const { client, clientSecret } = await oauthClientService.registerClient({
    ...req.body,
    ownerId: req.auth.userId,
  });

  return sendSuccess(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'OAuth client registered. Store the client secret now - it will not be shown again.',
    data: { client, clientSecret },
  });
});

export const listClients = asyncHandler(async (req, res) => {
  const clients = await oauthClientService.listClientsForOwner(req.auth.userId);
  return sendSuccess(res, { message: 'OAuth clients retrieved', data: { clients } });
});

/**
 * Returns the details a consent screen needs to render (client name, requested scopes).
 * Requires the caller to already hold a valid access token for this server - i.e. the
 * user must be logged in to *this* server before they can be asked to authorize a
 * third-party client, exactly as on Google/Auth0's hosted consent pages.
 */
export const getAuthorizationRequest = asyncHandler(async (req, res) => {
  const { client_id: clientId, redirect_uri: redirectUri, scope, state } = req.query;
  const { client, scope: normalizedScope } = await oauthService.validateAuthorizationRequest({
    clientId,
    redirectUri,
    scope,
  });

  return sendSuccess(res, {
    message: 'Authorization request is valid',
    data: {
      client: { name: client.name, clientId: client.clientId },
      scope: normalizedScope,
      redirectUri,
      state,
    },
  });
});

/**
 * The user's allow/deny decision. On success this returns the redirect URL rather than
 * issuing an HTTP redirect itself, because the caller is a consent-page frontend making an
 * XHR/fetch request (which cannot follow a cross-origin redirect on the user's behalf) -
 * the frontend performs `window.location = redirectUrl` itself.
 */
export const submitAuthorizationDecision = asyncHandler(async (req, res) => {
  const {
    response_type: _responseType,
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    state,
    decision,
  } = req.body;

  const { client, scope: normalizedScope } = await oauthService.validateAuthorizationRequest({
    clientId,
    redirectUri,
    scope,
  });

  const redirectUrl = new URL(redirectUri);

  if (decision === 'deny') {
    redirectUrl.searchParams.set('error', OAUTH_ERROR_CODES.ACCESS_DENIED);
    if (state) redirectUrl.searchParams.set('state', state);
    return sendSuccess(res, {
      message: 'Authorization denied',
      data: { redirectUrl: redirectUrl.toString() },
    });
  }

  const code = await oauthService.issueAuthorizationCode({
    client,
    userId: req.identityUser.id,
    redirectUri,
    scope: normalizedScope,
  });

  redirectUrl.searchParams.set('code', code);
  if (state) redirectUrl.searchParams.set('state', state);

  return sendSuccess(res, {
    message: 'Authorization granted',
    data: { redirectUrl: redirectUrl.toString() },
  });
});

function buildTokenResponse(res, { accessToken, accessTokenExpiresIn, refreshToken, scope }) {
  return res.status(HTTP_STATUS.OK).json({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: accessTokenExpiresIn,
    refresh_token: refreshToken,
    scope,
  });
}

/** Token endpoint (RFC 6749 section 3.2) - responds in the standard OAuth token shape, not our API envelope. */
export const issueToken = asyncHandler(async (req, res) => {
  const { grant_type: grantType } = req.body;

  if (grantType === GRANT_TYPES.AUTHORIZATION_CODE) {
    const {
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    } = req.body;
    const result = await oauthService.exchangeAuthorizationCode({
      code,
      redirectUri,
      clientId,
      clientSecret,
    });
    return buildTokenResponse(res, result);
  }

  if (grantType === GRANT_TYPES.REFRESH_TOKEN) {
    const {
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    } = req.body;
    const result = await oauthService.exchangeRefreshToken({
      refreshToken,
      clientId,
      clientSecret,
    });
    return buildTokenResponse(res, result);
  }

  // Unreachable: the discriminated-union validator already rejects unknown grant types.
  throw new OAuthError(
    OAUTH_ERROR_CODES.UNSUPPORTED_GRANT_TYPE,
    `Unsupported grant_type: ${grantType}`,
  );
});

/** Revocation endpoint (RFC 7009). */
export const revokeToken = asyncHandler(async (req, res) => {
  await oauthService.revokeToken({
    token: req.body.token,
    clientId: req.body.client_id,
    clientSecret: req.body.client_secret,
  });

  return sendSuccess(res, { message: 'Token revoked' });
});
