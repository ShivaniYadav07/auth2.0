// Demo-only persistence. A real OAuth "app" would keep its client_secret on its own
// backend and never expose it to a browser; this frontend plays both the resource owner's
// browser AND (for demonstration purposes only) the third-party app, so it needs somewhere
// to stash the secret between "register client" and "exchange code for token".
const SECRET_PREFIX = 'demo_oauth_client_secret:';
const PENDING_FLOW_KEY = 'demo_oauth_pending_flow';

export function saveDemoClientSecret(clientId, clientSecret) {
  localStorage.setItem(`${SECRET_PREFIX}${clientId}`, clientSecret);
}

export function getDemoClientSecret(clientId) {
  return localStorage.getItem(`${SECRET_PREFIX}${clientId}`);
}

// Remembers which client/redirect_uri initiated an in-flight authorization request, so
// the callback route can complete the code exchange after the browser round-trips through
// /oauth/authorize/decision's redirect.
export function savePendingAuthFlow(flow) {
  sessionStorage.setItem(PENDING_FLOW_KEY, JSON.stringify(flow));
}

export function getPendingAuthFlow() {
  const raw = sessionStorage.getItem(PENDING_FLOW_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearPendingAuthFlow() {
  sessionStorage.removeItem(PENDING_FLOW_KEY);
}
