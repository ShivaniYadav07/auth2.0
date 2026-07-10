import * as sessionService from '../services/sessionService.js';
import { AppError } from '../errors/AppError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { config } from '../config/env.js';

/**
 * Gates endpoints on the Identity Server browser session (the `sid` cookie), NOT on a Bearer
 * access token. This is the distinction that makes /oauth/authorize behave like a real
 * authorization server: the consent screen is shown only when the user is already logged in
 * to *this* server, and that login state lives in a durable cookie session - it does not
 * depend on the caller holding a short-lived access token.
 *
 * Populates req.identityUser = { id } on success.
 */
export const requireSession = asyncHandler(async (req, _res, next) => {
  const sessionId = req.cookies?.[config.session.cookieName];
  const userId = await sessionService.getUserIdFromSession(sessionId);

  if (!userId) {
    throw new AppError(
      'You must be signed in to authorize an application',
      HTTP_STATUS.UNAUTHORIZED,
      'UNAUTHENTICATED',
    );
  }

  req.identityUser = { id: userId };
  next();
});
