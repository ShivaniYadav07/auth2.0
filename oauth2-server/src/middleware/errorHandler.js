import mongoose from 'mongoose';
import { AppError } from '../errors/AppError.js';
import { OAuthError } from '../errors/OAuthError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';

/** Normalizes well-known third-party error types (Mongoose, JWT) into our AppError shape. */
function normalizeError(err) {
  if (err instanceof AppError) return err;

  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return new AppError(
      'Validation failed',
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      'VALIDATION_ERROR',
      details,
    );
  }

  if (err instanceof mongoose.Error.CastError) {
    return new AppError('Malformed identifier', HTTP_STATUS.BAD_REQUEST, 'INVALID_ID');
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern ?? {})[0] ?? 'field';
    return new AppError(
      `A record with this ${field} already exists`,
      HTTP_STATUS.CONFLICT,
      'DUPLICATE_RESOURCE',
    );
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return new AppError('Invalid or expired token', HTTP_STATUS.UNAUTHORIZED, 'INVALID_TOKEN');
  }

  // Unrecognized error: treat as a bug, not an operational failure. Message is never
  // forwarded to the client - only the generic fallback below is.
  return new AppError('Something went wrong', HTTP_STATUS.INTERNAL_SERVER_ERROR, 'INTERNAL_ERROR');
}

export function errorHandler(err, req, res, _next) {
  const normalized = normalizeError(err);
  const isUnexpected = normalized.code === 'INTERNAL_ERROR';

  if (isUnexpected) {
    logger.error({ err, path: req.originalUrl, method: req.method }, 'Unhandled error');
  } else {
    logger.warn(
      { code: normalized.code, path: req.originalUrl, method: req.method },
      normalized.message,
    );
  }

  if (normalized instanceof OAuthError) {
    return res.status(normalized.statusCode).json({
      error: normalized.oauthErrorCode,
      error_description: normalized.message,
    });
  }

  const body = {
    success: false,
    message: normalized.message,
    data: null,
  };

  if (normalized.details) body.errors = normalized.details;
  if (!config.isProduction) body.code = normalized.code;

  res.status(normalized.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json(body);
}
