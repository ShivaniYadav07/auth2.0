import * as authService from '../services/authService.js';
import * as sessionService from '../services/sessionService.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import {
  getRefreshTokenCookieOptions,
  getClearCookieOptions,
  getSessionCookieOptions,
  getClearSessionCookieOptions,
} from '../utils/cookies.js';
import { config } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

function setRefreshTokenCookie(res, refreshToken) {
  res.cookie(config.refreshToken.cookieName, refreshToken, getRefreshTokenCookieOptions());
}

// Establishes the durable Identity Server browser session that /oauth/authorize relies on.
async function startBrowserSession(req, res, userId) {
  const sessionId = await sessionService.createSession({
    userId,
    userAgent: req.headers['user-agent'] ?? null,
  });
  res.cookie(config.session.cookieName, sessionId, getSessionCookieOptions());
}

export const register = asyncHandler(async (req, res) => {
  const { user, accessToken, accessTokenExpiresIn, refreshToken } = await authService.register(
    req.body,
  );
  setRefreshTokenCookie(res, refreshToken);
  await startBrowserSession(req, res, user._id);

  return sendSuccess(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'Account created successfully',
    data: { user, accessToken, expiresIn: accessTokenExpiresIn },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { user, accessToken, accessTokenExpiresIn, refreshToken } = await authService.login(
    req.body,
  );
  setRefreshTokenCookie(res, refreshToken);
  await startBrowserSession(req, res, user._id);

  return sendSuccess(res, {
    message: 'Logged in successfully',
    data: { user, accessToken, expiresIn: accessTokenExpiresIn },
  });
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[config.refreshToken.cookieName];
  await authService.logout(refreshToken);
  res.clearCookie(config.refreshToken.cookieName, getClearCookieOptions());

  // End the browser session too, so logging out here truly signs the user out of the
  // Identity Server (the next /oauth/authorize will require a fresh login).
  await sessionService.destroySession(req.cookies?.[config.session.cookieName]);
  res.clearCookie(config.session.cookieName, getClearSessionCookieOptions());

  return sendSuccess(res, { message: 'Logged out successfully' });
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[config.refreshToken.cookieName];
  const result = await authService.refreshSession(refreshToken);
  setRefreshTokenCookie(res, result.refreshToken);

  return sendSuccess(res, {
    message: 'Session refreshed',
    data: { accessToken: result.accessToken, expiresIn: result.accessTokenExpiresIn },
  });
});
