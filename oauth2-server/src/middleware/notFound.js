import { AppError } from '../errors/AppError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export function notFound(req, _res, next) {
  next(
    new AppError(
      `Route not found: ${req.method} ${req.originalUrl}`,
      HTTP_STATUS.NOT_FOUND,
      'ROUTE_NOT_FOUND',
    ),
  );
}
