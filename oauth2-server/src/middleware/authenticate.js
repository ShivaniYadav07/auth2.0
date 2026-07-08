import { verifyAccessToken } from '../auth/jwt.js';
import { AppError } from '../errors/AppError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/** Populates req.auth = { userId, clientId, scope } from a valid Bearer access token. */
export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    throw new AppError(
      'Missing or malformed Authorization header',
      HTTP_STATUS.UNAUTHORIZED,
      'UNAUTHENTICATED',
    );
  }

  const token = header.slice('Bearer '.length).trim();

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    // Deliberately generic: don't tell the caller whether the token was expired,
    // malformed, or tampered with - that distinction isn't actionable and only helps an attacker.
    throw new AppError(
      'Invalid or expired access token',
      HTTP_STATUS.UNAUTHORIZED,
      'INVALID_TOKEN',
    );
  }

  req.auth = {
    userId: payload.sub,
    clientId: payload.client_id ?? null,
    scope: payload.scope ?? '',
  };

  next();
});
