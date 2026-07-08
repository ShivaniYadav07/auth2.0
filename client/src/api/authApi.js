import { apiClient } from './axiosClient';

// Each returns { user, accessToken, expiresIn }; the refresh_token is set server-side
// as an HttpOnly cookie, never present in the JSON body.
export function registerUser(payload) {
  return apiClient.post('/auth/register', payload).then((res) => res.data.data);
}

export function loginUser(payload) {
  return apiClient.post('/auth/login', payload).then((res) => res.data.data);
}

export function logoutUser() {
  return apiClient.post('/auth/logout').then((res) => res.data);
}

// Reads the refresh_token cookie server-side; returns { accessToken, expiresIn }.
export function refreshSession() {
  return apiClient.post('/auth/refresh').then((res) => res.data.data);
}
