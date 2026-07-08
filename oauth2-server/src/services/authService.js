import * as userService from './userService.js';
import * as tokenService from './tokenService.js';
import { AppError } from '../errors/AppError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export async function register({ name, email, password }) {
  const user = await userService.createUser({ name, email, password });
  const { accessToken, accessTokenExpiresIn, refreshToken } = await tokenService.issueTokenPair({
    userId: user._id,
  });
  return { user, accessToken, accessTokenExpiresIn, refreshToken };
}

export async function login({ email, password }) {
  const user = await userService.verifyCredentials(email, password);
  const { accessToken, accessTokenExpiresIn, refreshToken } = await tokenService.issueTokenPair({
    userId: user._id,
  });
  return { user, accessToken, accessTokenExpiresIn, refreshToken };
}

export async function logout(refreshToken) {
  if (refreshToken) {
    await tokenService.revokeRefreshTokenByValue(refreshToken);
  }
}

/** Refreshes a first-party session. Rejects tokens that belong to an OAuth client instead. */
export async function refreshSession(refreshToken) {
  if (!refreshToken) {
    throw new AppError('Missing refresh token', HTTP_STATUS.UNAUTHORIZED, 'MISSING_REFRESH_TOKEN');
  }

  const result = await tokenService.rotateRefreshToken(refreshToken, { clientId: null });
  return {
    accessToken: result.accessToken,
    accessTokenExpiresIn: result.accessTokenExpiresIn,
    refreshToken: result.refreshToken,
  };
}
