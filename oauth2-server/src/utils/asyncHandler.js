/**
 * Wraps an async controller/middleware so rejected promises are forwarded to
 * Express's error pipeline via `next()` instead of crashing the process.
 */
export function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
