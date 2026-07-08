# Authorization Code Flow walkthrough

This walks through the exact sequence a third-party app ("client") and a user go through
to get an access token, using the endpoints in this server. All requests below were
verified against a running instance.

```
Resource Owner (user)        This Auth Server                 OAuth Client ("app")
        |                           |                                  |
        | 1. register/login        |                                  |
        |-------------------------->|                                  |
        |  access_token (JWT)       |                                  |
        |<--------------------------|                                  |
        |                           |     2. app redirects browser     |
        |<--------------------------------------------------------------|
        |   GET /authorize?...      |                                  |
        | 3. (consent frontend) GET /authorize with Bearer token       |
        |-------------------------->|                                  |
        |   client name + scopes    |                                  |
        |<--------------------------|                                  |
        | 4. POST /authorize/decision {decision: allow}                |
        |-------------------------->|                                  |
        |   redirectUrl w/ code     |                                  |
        |<--------------------------|                                  |
        | 5. browser -> redirectUrl |                                  |
        |----------------------------------------------------------->  |
        |                           |   6. POST /oauth/token (code)    |
        |                           |<----------------------------------|
        |                           |   access_token + refresh_token   |
        |                           |---------------------------------->|
```

## 1. Resource owner logs into the auth server

```bash
curl -c cookies.txt -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ada@example.com","password":"Passw0rd123"}'
```

Response includes `data.accessToken`; a `refresh_token` HttpOnly cookie is also set,
scoped to `/api/v1/auth` (this is the user's *session* with the auth server itself, not
an OAuth token).

## 2. An OAuth client exists (registered once, ahead of time)

```bash
curl -X POST http://localhost:4000/api/v1/oauth/clients \
  -H "Authorization: Bearer $ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"My App","redirectUris":["https://app.example.com/callback"],"scopes":["profile","email"]}'
```

Save `data.client.clientId` and `data.clientSecret` (the secret is shown exactly once).

## 3. The app redirects the user to `/authorize`

A real client app would redirect the browser to a login/consent page, which in turn
calls this server's `/authorize` endpoint (with the user's access token) to fetch what to
render:

```bash
curl -G http://localhost:4000/api/v1/oauth/authorize \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  --data-urlencode "response_type=code" \
  --data-urlencode "client_id=$CLIENT_ID" \
  --data-urlencode "redirect_uri=https://app.example.com/callback" \
  --data-urlencode "scope=profile email" \
  --data-urlencode "state=xyz123"
```

`client_id` and `redirect_uri` are validated first; an unregistered `redirect_uri`
returns a JSON error here rather than any kind of redirect (see ARCHITECTURE.md).

## 4. The user approves (or denies), the consent page submits the decision

```bash
curl -X POST http://localhost:4000/api/v1/oauth/authorize/decision \
  -H "Authorization: Bearer $ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{
    "response_type": "code",
    "client_id": "'"$CLIENT_ID"'",
    "redirect_uri": "https://app.example.com/callback",
    "scope": "profile email",
    "state": "xyz123",
    "decision": "allow"
  }'
```

Response: `data.redirectUrl` = `https://app.example.com/callback?code=...&state=xyz123`.
The frontend performs the actual `window.location = redirectUrl`; on `decision: "deny"`
the URL instead carries `error=access_denied`.

## 5/6. The client exchanges the code for tokens

The client's backend (holding its `client_secret`) calls the token endpoint directly -
this step never touches the browser:

```bash
curl -X POST http://localhost:4000/api/v1/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "authorization_code",
    "code": "'"$CODE"'",
    "redirect_uri": "https://app.example.com/callback",
    "client_id": "'"$CLIENT_ID"'",
    "client_secret": "'"$CLIENT_SECRET"'"
  }'
```

```json
{
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 900,
  "refresh_token": "6Tnt7Jb3...",
  "scope": "profile email"
}
```

The code is now consumed - replaying the same request returns `invalid_grant`.

## 7. Refreshing the access token

```bash
curl -X POST http://localhost:4000/api/v1/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "refresh_token",
    "refresh_token": "'"$REFRESH_TOKEN"'",
    "client_id": "'"$CLIENT_ID"'",
    "client_secret": "'"$CLIENT_SECRET"'"
  }'
```

Returns a brand-new `access_token` **and** `refresh_token`; the old refresh token is
immediately revoked (rotation). Presenting it again returns `invalid_grant` and revokes
every other active refresh token for that client/user pair - see ARCHITECTURE.md's
section on theft detection.

## 8. Revoking a token early

```bash
curl -X POST http://localhost:4000/api/v1/oauth/revoke \
  -H "Content-Type: application/json" \
  -d '{"token":"'"$REFRESH_TOKEN"'","client_id":"'"$CLIENT_ID"'","client_secret":"'"$CLIENT_SECRET"'"}'
```

Always returns `200` (RFC 7009) whether or not the token was valid, to avoid letting the
endpoint be used to probe which tokens exist.
