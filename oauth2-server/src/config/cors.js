import { config } from './env.js';
import { AppError } from '../errors/AppError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

/**
 * Reflects only origins present in CORS_ALLOWED_ORIGINS. In development, when no
 * origins are configured, we allow any origin so local frontend work isn't blocked -
 * but this must never be the case in production, so we guard against it explicitly.
 */
export const corsOptions = {
  origin(origin, callback) {
    const { allowedOrigins } = config.cors;

    // Requests with no Origin header (curl, server-to-server, same-origin) are allowed through.
    if (!origin) return callback(null, true);

    if (allowedOrigins.length === 0) {
      if (config.isProduction) {
        return callback(
          new AppError('CORS is not configured', HTTP_STATUS.FORBIDDEN, 'CORS_NOT_CONFIGURED'),
        );
      }
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new AppError('Not allowed by CORS', HTTP_STATUS.FORBIDDEN, 'CORS_NOT_ALLOWED'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
