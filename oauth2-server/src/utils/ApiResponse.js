/** Every non-OAuth-protocol JSON response follows this shape for consistency. */
export function sendSuccess(res, { statusCode = 200, message = 'Success', data = null } = {}) {
  return res.status(statusCode).json({ success: true, message, data });
}
