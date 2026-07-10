import { config } from '../config/env.js';

/**
 * The refresh token lives only in an HttpOnly cookie - never in a JSON body - so that
 * JavaScript on the page (and therefore a successful XSS payload) cannot read it.
 * `secure` is forced on in production so it's never sent over plain HTTP.
 *
 * This cookie carries the first-party USER session refresh token (register/login/logout/
 * refresh). It is intentionally scoped to `/api/v1/auth` only, not `/api/v1/oauth/*`:
 * OAuth clients are separate applications (not the browser), so their refresh tokens are
 * exchanged explicitly in the token request/response body per RFC 6749, never via cookie.
 */
export function getRefreshTokenCookieOptions() {
  return {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.refreshToken.cookieSameSite,
    domain: config.refreshToken.cookieDomain,
    path: '/api/v1/auth',
    maxAge: config.refreshToken.ttlDays * 24 * 60 * 60 * 1000,
  };
}

export function getClearCookieOptions() {
  const { maxAge: _maxAge, ...rest } = getRefreshTokenCookieOptions();
  return rest;
}

/**
 * The Identity Server browser session cookie (`sid`). Unlike the refresh cookie, this is
 * scoped to `path=/` because it must be readable by `/api/v1/oauth/authorize` - the OAuth
 * consent flow needs to see the login session, not just the /auth endpoints.
 */
export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.session.cookieSameSite,
    domain: config.session.cookieDomain,
    path: '/',
    maxAge: config.session.ttlDays * 24 * 60 * 60 * 1000,
  };
}

export function getClearSessionCookieOptions() {
  const { maxAge: _maxAge, ...rest } = getSessionCookieOptions();
  return rest;
}
