import { apiClient } from './axiosClient';

// Validates an authorization request and returns consent data:
// { client: { name, clientId }, scope, redirectUri, state }
export function getAuthorizationRequest(params) {
  return apiClient.get('/oauth/authorize', { params }).then((res) => res.data.data);
}

// body: { response_type, client_id, redirect_uri, scope, state, decision }
// Returns { redirectUrl }.
export function submitAuthorizationDecision(payload) {
  return apiClient.post('/oauth/authorize/decision', payload).then((res) => res.data.data);
}

// The token endpoint speaks raw RFC 6749 shape, not the app's { success, data } envelope:
// { access_token, token_type, expires_in, refresh_token, scope }
export function exchangeToken(payload) {
  return apiClient.post('/oauth/token', payload).then((res) => res.data);
}

export function revokeToken(payload) {
  return apiClient.post('/oauth/revoke', payload).then((res) => res.data);
}
