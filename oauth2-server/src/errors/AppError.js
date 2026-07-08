/**
 * Base class for all operational errors we throw intentionally (bad input, auth failure,
 * missing resource, etc). The global error handler treats `AppError` instances as "safe to
 * describe to the client" and everything else as an unexpected bug whose details are hidden.
 */
export class AppError extends Error {
  constructor(message, statusCode, code = 'APP_ERROR', details = undefined) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
