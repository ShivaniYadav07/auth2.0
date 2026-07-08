// The backend uses two error shapes: { success:false, message, errors? } for app
// endpoints, and { error, error_description } (RFC 6749) for OAuth protocol endpoints.
export function getErrorMessage(error) {
  const data = error?.response?.data;
  if (!data) return error?.message || 'Network error. Is the server running?';
  if (data.error_description) return data.error_description;
  if (data.message) return data.message;
  return 'Something went wrong.';
}

export function getFieldErrors(error) {
  return error?.response?.data?.errors ?? null;
}
