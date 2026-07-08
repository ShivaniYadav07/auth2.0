import { apiClient } from './axiosClient';

// Returns { client, clientSecret } - the secret is shown exactly once by the backend.
export function registerOAuthClient(payload) {
  return apiClient.post('/oauth/clients', payload).then((res) => res.data.data);
}

export function listOAuthClients() {
  return apiClient.get('/oauth/clients').then((res) => res.data.data.clients);
}
