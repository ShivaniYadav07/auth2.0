import { apiClient } from './axiosClient';

// accessToken lets callers demonstrate calling this protected endpoint with an
// arbitrary token (e.g. one issued to an OAuth client), instead of the resource
// owner's own session token.
export function getCurrentUser(accessToken) {
  const config = accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined;
  return apiClient.get('/users/me', config).then((res) => res.data.data.user);
}
