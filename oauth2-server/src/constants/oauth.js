/** Scopes supported by this server. Keep this list authoritative - clients and
 * authorization requests are validated against it. */
export const SUPPORTED_SCOPES = ['profile', 'email', 'offline_access'];

export const DEFAULT_SCOPE = 'profile';

export const GRANT_TYPES = {
  AUTHORIZATION_CODE: 'authorization_code',
  REFRESH_TOKEN: 'refresh_token',
};

export const RESPONSE_TYPES = {
  CODE: 'code',
};

export const TOKEN_TYPE = 'Bearer';

/**
 * Standard OAuth 2.0 error codes (RFC 6749 section 5.2 / 4.1.2.1).
 * Returning these exact strings lets any spec-compliant OAuth client understand failures.
 */
export const OAUTH_ERROR_CODES = {
  INVALID_REQUEST: 'invalid_request',
  INVALID_CLIENT: 'invalid_client',
  INVALID_GRANT: 'invalid_grant',
  INVALID_SCOPE: 'invalid_scope',
  UNAUTHORIZED_CLIENT: 'unauthorized_client',
  UNSUPPORTED_GRANT_TYPE: 'unsupported_grant_type',
  UNSUPPORTED_RESPONSE_TYPE: 'unsupported_response_type',
  ACCESS_DENIED: 'access_denied',
  SERVER_ERROR: 'server_error',
};
