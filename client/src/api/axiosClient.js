import axios from 'axios';
import { getAccessToken, setAccessToken, notifyUnauthorized } from '../utils/tokenStore';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api/v1';

// withCredentials is required so the browser sends/receives the HttpOnly refresh_token
// cookie (scoped to /api/v1/auth by the backend) on cross-origin requests.
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  // Only fill in the resource owner's own session token if the caller hasn't already
  // set one explicitly (e.g. the Success page demos calling /users/me with the
  // separate access token issued to an OAuth client via /oauth/token).
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

let refreshPromise = null;

function isAuthEndpoint(url = '') {
  return AUTH_ENDPOINTS.some((path) => url.includes(path));
}

// A short-lived (15m) access token can expire mid-session. On a 401 from a
// non-auth endpoint, try exactly one silent refresh via the refresh_token cookie
// before giving up, so the user isn't kicked out for no reason.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status !== 401 || !originalRequest || isAuthEndpoint(originalRequest.url) || originalRequest._retried) {
      return Promise.reject(error);
    }

    originalRequest._retried = true;

    try {
      if (!refreshPromise) {
        refreshPromise = axios
          .post(`${API_BASE_URL}/auth/refresh`, null, { withCredentials: true })
          .finally(() => {
            refreshPromise = null;
          });
      }
      const refreshResponse = await refreshPromise;
      const newToken = refreshResponse.data.data.accessToken;
      setAccessToken(newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      setAccessToken(null);
      notifyUnauthorized();
      return Promise.reject(refreshError);
    }
  },
);
