// In-memory-only access token storage. The refresh token never touches JS - it lives in
// the HttpOnly cookie the backend sets, so this module intentionally has no persistence.
let accessToken = null;
let unauthorizedHandler = null;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token) {
  accessToken = token;
}

export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}

export function notifyUnauthorized() {
  unauthorizedHandler?.();
}
