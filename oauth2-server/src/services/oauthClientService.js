import { OAuthClient } from '../models/OAuthClient.js';
import { generateRandomToken } from '../utils/crypto.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { OAuthError } from '../errors/OAuthError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { OAUTH_ERROR_CODES } from '../constants/oauth.js';

/**
 * Registers a new OAuth client ("app"). The client secret is a bearer credential with the
 * same trust level as a user password, so it's hashed with bcrypt and returned in plaintext
 * exactly once - the caller (the developer registering the app) is responsible for storing it.
 */
export async function registerClient({ name, redirectUris, scopes, ownerId }) {
  const clientId = `client_${generateRandomToken(12)}`;
  const clientSecret = generateRandomToken(32);
  const clientSecretHash = await hashPassword(clientSecret);

  const client = await OAuthClient.create({
    name,
    clientId,
    clientSecretHash,
    redirectUris,
    scopes,
    owner: ownerId,
  });

  return { client, clientSecret };
}

export async function findActiveClientByClientId(clientId) {
  const client = await OAuthClient.findOne({ clientId, isActive: true });
  if (!client) {
    throw new OAuthError(
      OAUTH_ERROR_CODES.INVALID_CLIENT,
      'Unknown or inactive client',
      HTTP_STATUS.UNAUTHORIZED,
    );
  }
  return client;
}

/** Confidential-client authentication (RFC 6749 section 2.3.1). */
export async function verifyClientCredentials(clientId, clientSecret) {
  const client = await OAuthClient.findOne({ clientId, isActive: true }).select(
    '+clientSecretHash',
  );
  const invalidClient = () =>
    new OAuthError(
      OAUTH_ERROR_CODES.INVALID_CLIENT,
      'Client authentication failed',
      HTTP_STATUS.UNAUTHORIZED,
    );

  if (!client) throw invalidClient();

  const isMatch = await comparePassword(clientSecret, client.clientSecretHash);
  if (!isMatch) throw invalidClient();

  return client;
}

/** Exact-match check, per RFC 6749 section 3.1.2.3 - prefix/substring matches are not permitted. */
export function assertRedirectUriIsRegistered(client, redirectUri) {
  if (!client.redirectUris.includes(redirectUri)) {
    throw new OAuthError(
      OAUTH_ERROR_CODES.INVALID_REQUEST,
      'redirect_uri is not registered for this client',
    );
  }
}

export async function listClientsForOwner(ownerId) {
  return OAuthClient.find({ owner: ownerId }).sort({ createdAt: -1 });
}
