// Mirrors src/constants/oauth.js on the backend - kept in sync manually since scopes are
// part of the API contract, not something the frontend can discover dynamically.
export const SUPPORTED_SCOPES = ['profile', 'email', 'offline_access'];
export const DEFAULT_SCOPE = 'profile';
