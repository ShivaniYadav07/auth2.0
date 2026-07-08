import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

function jsonRateLimitHandler(req, res) {
  res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
    success: false,
    message: 'Too many requests. Please try again later.',
    data: null,
  });
}

/** Applied globally in app.js. */
export const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

/**
 * Tighter limit for credential-guessing surfaces (login, token exchange, client secret
 * checks) than the general API limit - these are exactly the endpoints brute-force and
 * credential-stuffing attacks target.
 */
export const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: Math.max(10, Math.floor(config.rateLimit.max / 5)),
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});
