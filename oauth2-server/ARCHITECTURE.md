# Architecture

## Layering

```
routes  ->  middleware (validate/authenticate)  ->  controllers  ->  services  ->  models
                                                          |
                                                     utils/auth/errors (shared)
```

- **routes/** wire an HTTP verb + path to `[middleware..., controller]`. No logic here.
- **middleware/** is reusable, request-shaped logic: schema validation, authentication,
  rate limiting, 404, and the centralized error handler.
- **controllers/** are thin: parse `req` -> call one service function -> shape the
  response. No business rules, no direct model access.
- **services/** hold all business logic and are the only layer that talks to Mongoose
  models. Services throw `AppError`/`OAuthError`; they never touch `req`/`res`.
- **models/** are Mongoose schemas plus schema-level concerns (indexes, `toJSON`
  redaction). No business logic.
- **auth/**, **utils/**, **constants/**, **errors/** are shared leaf modules with no
  dependencies on the layers above them.

This is intentionally a simple, single-service layering - no repository interfaces,
no dependency injection container, no CQRS. At this scope those would add indirection
without adding safety or clarity; the boundary that actually matters (services never
import `req`/`res`, controllers never import `mongoose`) is enforced by convention and is
easy to keep enforcing as the codebase grows a bit. If this were to grow into several
independently-deployed services, the service layer is already the natural seam to split
along.

## Why two kinds of refresh tokens live in one model

`RefreshToken` has a nullable `client` field:

- `client: null` - a first-party session token issued by `/api/v1/auth/login` or
  `/register`, delivered as an HttpOnly cookie scoped to `/api/v1/auth`. This is what
  lets a user stay logged into the auth server itself.
- `client: <OAuthClient _id>` - a token issued to a third-party app via
  `/api/v1/oauth/token`, delivered in the JSON response body (per RFC 6749 - the OAuth
  client is a separate application, not the browser, so a cookie wouldn't reach it).

Both share the same rotation/expiry/revocation logic (`services/tokenService.js`)
because the security properties they need are identical. Splitting them into two models
would duplicate that logic for no behavioral difference.

## Access tokens are stateless JWTs

`access_token`s are signed JWTs (`sub`, optional `client_id`, `scope`) verified with no
database lookup - this keeps every protected-resource request cheap. The cost is that an
access token **cannot be revoked before it expires**. That's why:

- the default TTL is short (15 minutes, `JWT_ACCESS_TOKEN_TTL`);
- long-lived access is achieved by rotating refresh tokens, which *are* revocable, not by
  extending the access token TTL.

A production system that needs immediate access-token revocation would add either a
short-lived denylist (e.g. Redis, keyed by `jti`) or a token-introspection endpoint
(RFC 7662). Both are deliberately left out here to keep the token path lookup-free; see
[Known limitations](#known-limitations--future-improvements).

## Why secrets are hashed, and with what

| Secret | Hash | Why this algorithm |
|---|---|---|
| User password | bcrypt (cost 12) | Low-entropy, user-chosen - needs a slow, salted KDF to resist offline guessing. |
| OAuth client secret | bcrypt (cost 12) | Same trust model as a password (a long-lived shared secret compared on every token request), so it gets the same treatment. |
| Authorization code / refresh token | SHA-256 | High-entropy (256-bit random), single-use-or-short-lived bearer tokens, not guessable offline. A fast hash is correct here - bcrypt would add cost with no security benefit and would slow down every refresh. |

## Refresh token rotation & theft detection

Every time a refresh token is redeemed (`tokenService.rotateRefreshToken`):

1. The presented token is looked up by its SHA-256 hash.
2. If it's already `revokedAt`-marked, this is a reuse of a token that was already
   rotated away - a strong signal it was stolen and the legitimate client already moved
   on. The server responds `invalid_grant` **and** revokes every other non-revoked
   refresh token for that `(user, client)` pair, forcing re-authentication everywhere.
3. Otherwise, the token is marked revoked, a new pair is issued, and the old record's
   `replacedByTokenHash` points at the new one - preserving the rotation chain for future
   forensics/telemetry (not currently surfaced via an API, but the data is there).

This follows the rotation-with-reuse-detection pattern described in RFC 6749 §10.4.

## Authorization Code flow, and why `/authorize` returns JSON instead of rendering a page

This is an API-only backend - there's no templating engine in the stack and no consent
UI was requested. Rather than bolt on server-rendered views, `/api/v1/oauth/authorize`
and `/api/v1/oauth/authorize/decision` are JSON endpoints meant to be called by a
first-party login/consent frontend (not included in this repo), which then performs the
actual browser redirect. This mirrors how hosted-login systems like Auth0/Okta actually
work in practice (a separate login app calls back-end APIs, then redirects).

Full walkthrough: [src/docs/OAUTH_FLOW.md](./src/docs/OAUTH_FLOW.md).

Because of this, the user must already hold a valid **access token for this server**
(from `/api/v1/auth/login`) before calling `/authorize` - `Authorization: Bearer <token>`
is required on both the GET (validate) and POST (decision) calls.

### Redirect safety

`client_id` and `redirect_uri` are validated together, before anything else, and an
exact (not prefix) match against the client's registered `redirectUris` is required. If
either is invalid, the server responds with a JSON error rather than redirecting -
redirecting to an unverified URL is exactly the open-redirect vulnerability this check
exists to prevent. Only once the redirect_uri is confirmed registered do subsequent
failures (e.g. `access_denied`, `invalid_scope`) get encoded as query parameters on that
URL, per RFC 6749 §4.1.2.1.

## Centralized error handling

Every thrown error passes through `middleware/errorHandler.js`, which:

- normalizes Mongoose errors (`ValidationError`, `CastError`, duplicate-key `11000`) and
  JWT errors into the same `AppError` shape used everywhere else;
- renders `OAuthError`s in the RFC 6749 `{ error, error_description }` shape (required
  for OAuth client libraries to parse them), and everything else in the app's
  `{ success, message, data }` envelope;
- logs unexpected errors with full detail via Pino, but only ever returns a generic
  "Something went wrong" message to the client for anything that isn't a recognized,
  operational `AppError` - this is what stops stack traces, DB error text, or internal
  file paths from leaking into a response.

## Request validation

Every route that accepts input runs a Zod schema through `middleware/validate.js` before
the controller sees it. The schema validates `req.body`/`query`/`params` together and
writes the parsed (coerced/defaulted) result back onto `req` - so a controller can trust
`req.body.email` is actually a lowercased, trimmed, valid email without re-checking it.

## Known limitations & future improvements

Documented here deliberately, rather than silently - these are scope decisions, not
oversights:

- **No PKCE / public clients.** Only confidential clients (server-side apps holding a
  client secret) are supported. A real-world server serving mobile/SPA clients would add
  PKCE (RFC 7636) as a second, secret-less flow.
- **No access-token revocation before expiry.** Mitigated with a short TTL; a full
  solution needs an introspection endpoint or a revocation denylist.
- **Authorization code reuse only rejects the replay** - it doesn't walk back to revoke
  tokens already issued from that code, because no code-to-token linkage is stored. RFC
  6749 §10.5 recommends full revocation on reuse; tracking that linkage was left out to
  keep `AuthorizationCode` a pure, short-lived record.
- **No consent UI.** `/authorize` is JSON-only, by design (see above) - a real deployment
  pairs this with a separate login/consent frontend.
- **Single scope tier.** Scopes are a flat allow-list per client, not a fine-grained
  permission system - sufficient for this exercise, not for a multi-tenant marketplace of
  third-party apps.
