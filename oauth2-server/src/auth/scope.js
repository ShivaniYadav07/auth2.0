import { SUPPORTED_SCOPES } from '../constants/oauth.js';

export function parseScope(scope) {
  return scope ? scope.trim().split(/\s+/).filter(Boolean) : [];
}

export function formatScope(scopes) {
  return scopes.join(' ');
}

/** True if every requested scope is both globally supported and allowed for this client. */
export function isScopeAllowedForClient(requestedScopes, client) {
  return requestedScopes.every(
    (scope) => SUPPORTED_SCOPES.includes(scope) && client.scopes.includes(scope),
  );
}
