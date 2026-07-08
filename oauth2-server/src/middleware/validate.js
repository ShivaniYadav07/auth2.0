import { ZodError } from 'zod';
import { AppError } from '../errors/AppError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

/**
 * Validates req.{body,query,params} against a Zod schema shaped as
 * `z.object({ body, query, params })` (any subset). Parsed (and coerced/defaulted) values
 * are written back onto `req` so downstream code always sees trusted, normalized input.
 */
export function validate(schema) {
  return (req, _res, next) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (parsed.body !== undefined) req.body = parsed.body;
      if (parsed.query !== undefined) req.query = parsed.query;
      if (parsed.params !== undefined) req.params = parsed.params;

      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.issues.map((issue) => ({
          field: issue.path.slice(1).join('.'),
          message: issue.message,
        }));
        return next(
          new AppError(
            'Request validation failed',
            HTTP_STATUS.UNPROCESSABLE_ENTITY,
            'VALIDATION_ERROR',
            details,
          ),
        );
      }
      next(err);
    }
  };
}
