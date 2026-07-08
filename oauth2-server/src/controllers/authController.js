import * as authService from '../services/authService.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { getRefreshTokenCookieOptions, getClearCookieOptions } from '../utils/cookies.js';
import { config } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

function setRefreshTokenCookie(res, refreshToken) {
  res.cookie(config.refreshToken.cookieName, refreshToken, getRefreshTokenCookieOptions());
}

export const register = asyncHandler(async (req, res) => {
  const { user, accessToken, accessTokenExpiresIn, refreshToken } = await authService.register(
    req.body,
  );
  setRefreshTokenCookie(res, refreshToken);

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

  return sendSuccess(res, {
    message: 'Logged in successfully',
    data: { user, accessToken, expiresIn: accessTokenExpiresIn },
  });
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[config.refreshToken.cookieName];
  await authService.logout(refreshToken);
  res.clearCookie(config.refreshToken.cookieName, getClearCookieOptions());

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
