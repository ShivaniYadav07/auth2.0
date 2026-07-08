# API Reference

Base URL: `http://localhost:4000/api/v1` (configurable via `PORT`/`APP_URL`).

## Conventions

Non-OAuth-protocol endpoints return:

```json
{ "success": true, "message": "...", "data": { } }
```

Errors:

```json
{ "success": false, "message": "...", "data": null, "code": "SOME_CODE", "errors": [ { "field": "email", "message": "Invalid email address" } ] }
```

`errors` is only present for validation failures. `code` is included outside of
production (`NODE_ENV=production` omits it from the response, though it is always
logged server-side).

OAuth protocol endpoints (`/oauth/token`, and error responses from `/oauth/authorize*`,
`/oauth/revoke`) instead follow RFC 6749's vocabulary:

```json
{ "error": "invalid_grant", "error_description": "..." }
```

## Authentication

Protected endpoints require `Authorization: Bearer <access_token>`.

| Header/Cookie | Set by | Used for |
|---|---|---|
| `Authorization: Bearer <jwt>` | client stores from a login/register/refresh/token response | authenticating API calls |
| `refresh_token` cookie (HttpOnly, path `/api/v1/auth`) | `/auth/login`, `/auth/register`, `/auth/refresh` | rotating the user's own session |

---

## `POST /auth/register`

Create a user account and start a session.

**Body**
```json
{ "name": "Ada Lovelace", "email": "ada@example.com", "password": "Passw0rd123" }
```
Password requires 8+ chars with at least one lowercase, one uppercase, and one digit.

**201 Response**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": { "_id": "...", "name": "Ada Lovelace", "email": "ada@example.com", "createdAt": "...", "updatedAt": "..." },
    "accessToken": "eyJ...",
    "expiresIn": 900
  }
}
```
Sets the `refresh_token` HttpOnly cookie.

**Errors**: `409 EMAIL_TAKEN`, `422 VALIDATION_ERROR`.

---

## `POST /auth/login`

**Body**: `{ "email": "...", "password": "..." }`

**200 Response**: same shape as register's `data`. **Errors**: `401 INVALID_CREDENTIALS`
(returned identically whether the email doesn't exist or the password is wrong).

---

## `POST /auth/logout`

No body required; reads the `refresh_token` cookie, revokes it, and clears the cookie.
Always returns `200` even if there was no session.

---

## `POST /auth/refresh`

Reads the `refresh_token` cookie, rotates it, and returns a new access token.

**200 Response**
```json
{ "success": true, "message": "Session refreshed", "data": { "accessToken": "eyJ...", "expiresIn": 900 } }
```

**Errors**: `401 MISSING_REFRESH_TOKEN`, `401 INVALID_REFRESH_TOKEN`.

---

## `GET /users/me`

Protected. Returns the authenticated user.

**200 Response**
```json
{ "success": true, "message": "Current user retrieved", "data": { "user": { "_id": "...", "name": "...", "email": "..." } } }
```

**Errors**: `401 UNAUTHENTICATED` (missing header), `401 INVALID_TOKEN` (bad/expired JWT).

---

## `POST /oauth/clients`

Protected. Registers a new OAuth client owned by the caller.

**Body**
```json
{
  "name": "My App",
  "redirectUris": ["https://app.example.com/callback"],
  "scopes": ["profile", "email"]
}
```
`scopes` must be a subset of `["profile", "email", "offline_access"]`.

**201 Response**
```json
{
  "success": true,
  "message": "OAuth client registered. Store the client secret now - it will not be shown again.",
  "data": {
    "client": { "clientId": "client_...", "name": "My App", "redirectUris": [...], "scopes": [...], "isActive": true },
    "clientSecret": "shown-once-plaintext-secret"
  }
}
```

---

## `GET /oauth/clients`

Protected. Lists OAuth clients owned by the caller (secrets are never included).

---

## `GET /oauth/authorize`

Protected (Bearer token of the resource owner). Validates an authorization request
before a consent screen is rendered.

**Query**: `response_type=code`, `client_id`, `redirect_uri`, `scope` (optional, space
-delimited), `state` (optional, recommended).

**200 Response**
```json
{
  "success": true,
  "message": "Authorization request is valid",
  "data": { "client": { "name": "My App", "clientId": "client_..." }, "scope": "profile email", "redirectUri": "...", "state": "xyz123" }
}
```

**Errors** (JSON, never a redirect - see ARCHITECTURE.md): `401 invalid_client`,
`400 invalid_request` (bad/unregistered redirect_uri), `400 invalid_scope`.

---

## `POST /oauth/authorize/decision`

Protected. Submits the resource owner's allow/deny decision.

**Body**: same fields as the `/authorize` query, plus `"decision": "allow" | "deny"`.

**200 Response (allow)**
```json
{ "success": true, "message": "Authorization granted", "data": { "redirectUrl": "https://app.example.com/callback?code=...&state=xyz123" } }
```

**200 Response (deny)**
```json
{ "success": true, "message": "Authorization denied", "data": { "redirectUrl": "https://app.example.com/callback?error=access_denied&state=xyz123" } }
```

---

## `POST /oauth/token`

Public (client authenticates via `client_id`/`client_secret` in the body). Responds in
the OAuth token shape, not the app's JSON envelope.

**Body - authorization_code grant**
```json
{ "grant_type": "authorization_code", "code": "...", "redirect_uri": "...", "client_id": "...", "client_secret": "..." }
```

**Body - refresh_token grant**
```json
{ "grant_type": "refresh_token", "refresh_token": "...", "client_id": "...", "client_secret": "..." }
```

**200 Response (both grants)**
```json
{ "access_token": "eyJ...", "token_type": "Bearer", "expires_in": 900, "refresh_token": "...", "scope": "profile email" }
```

**Errors**: `401 invalid_client`, `400 invalid_grant` (bad/expired/reused code or refresh
token, redirect_uri mismatch), `422 VALIDATION_ERROR` (malformed request body/unknown
`grant_type`).

---

## `POST /oauth/revoke`

Public (client-authenticated). Revokes a refresh token.

**Body**: `{ "token": "...", "client_id": "...", "client_secret": "..." }`

**200 Response**: `{ "success": true, "message": "Token revoked", "data": null }` -
always `200`, even for an unknown or already-revoked token (RFC 7009).

---

## `GET /health`

Unauthenticated liveness check: `{ "success": true, "message": "Service is healthy", "data": null }`.
