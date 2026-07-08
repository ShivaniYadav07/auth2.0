# OAuth 2.0 Authorization Server

A from-scratch OAuth 2.0 Authorization Server implementing the **Authorization Code
Flow** (RFC 6749), plus first-party user authentication (register/login/logout/refresh),
built with Node.js, Express, and MongoDB.

This is a learning/reference implementation written the way a production service would
be: layered architecture, validated input, hashed secrets, rotating refresh tokens,
centralized error handling, and structured logging. It intentionally covers a realistic
subset of the OAuth 2.0 spec rather than every extension - see
[ARCHITECTURE.md](./ARCHITECTURE.md#known-limitations--future-improvements) for what's
out of scope and why.

## Features

- **User authentication**: register, login, logout, current-user, protected routes
- **OAuth 2.0 Authorization Code Flow**: client registration, authorize + consent,
  authorization codes, token issuance, refresh token rotation, revocation
- **Security**: bcrypt password/secret hashing, JWT access tokens, HttpOnly refresh
  token cookies, refresh token rotation with theft detection, Helmet, CORS allow-list,
  rate limiting, Zod input validation, centralized error handling with no leaked internals

## Tech stack

Node.js · Express · MongoDB/Mongoose · JWT (`jsonwebtoken`) · bcrypt · Zod · Helmet ·
`express-rate-limit` · Pino (`pino-http`) · ESLint/Prettier

## Project structure

```
src/
  config/       env validation, DB connection, logger, CORS options
  constants/    HTTP status codes, OAuth scopes/grant types/error codes
  errors/       AppError, OAuthError
  auth/         JWT signing/verification, scope helpers
  models/       Mongoose schemas: User, OAuthClient, AuthorizationCode, RefreshToken
  validators/   Zod request schemas
  middleware/   validate, authenticate, rate limiters, error handler, 404
  services/     business logic (auth, users, OAuth clients, codes, tokens)
  controllers/  thin HTTP-layer glue between routes and services
  routes/       Express routers
  docs/         API reference and OAuth flow walkthrough
  app.js        Express app assembly (no side effects on import)
  server.js     boots the DB connection and HTTP listener
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the reasoning behind this layering and the
security/design decisions throughout the codebase.

## Getting started

### Prerequisites

- Node.js 18+
- MongoDB running locally (or a connection string to a hosted instance)

### Install

```bash
npm install
cp .env.example .env   # then edit values, especially JWT_ACCESS_SECRET
```

### Run

```bash
npm run dev     # node --watch, restarts on file change
npm start       # production-style single run
```

The server boots on `http://localhost:4000` by default and logs
`OAuth2 authorization server listening on ...` once MongoDB is connected.

### Lint & format

```bash
npm run lint
npm run format
```

## Environment variables

All variables are validated at startup with Zod (`src/config/env.js`) - the process
exits with a clear error message if anything required is missing or malformed. See
[`.env.example`](./.env.example) for the full list with defaults; the ones without a
default are effectively required:

| Variable | Required | Purpose |
|---|---|---|
| `MONGO_URI` | yes | MongoDB connection string |
| `JWT_ACCESS_SECRET` | yes (min 32 chars) | HMAC signing key for access tokens |
| `JWT_ACCESS_TOKEN_TTL` | no (default `15m`) | Access token lifetime |
| `REFRESH_TOKEN_TTL_DAYS` | no (default `30`) | Refresh token lifetime |
| `AUTH_CODE_TTL_SECONDS` | no (default `60`) | Authorization code lifetime |
| `REFRESH_TOKEN_COOKIE_NAME` | no | Name of the HttpOnly session cookie |
| `COOKIE_DOMAIN` | no | Cookie `Domain` attribute |
| `CORS_ALLOWED_ORIGINS` | no | Comma-separated allow-list; empty + production = deny all |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | no | General rate limit window/ceiling |

## Database setup

No migrations are needed - Mongoose creates collections and indexes on first use.
Point `MONGO_URI` at any MongoDB 5+ instance:

```bash
# local
mongod --dbpath ./data

# .env
MONGO_URI=mongodb://127.0.0.1:27017/oauth2_server
```

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - layering, request flows, security rationale, limitations
- [src/docs/OAUTH_FLOW.md](./src/docs/OAUTH_FLOW.md) - step-by-step Authorization Code Flow walkthrough
- [src/docs/API.md](./src/docs/API.md) - full endpoint reference with example requests/responses

## Quick end-to-end example

```bash
# 1. Register a user (this is the resource owner who will log into the auth server)
curl -c cookies.txt -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada Lovelace","email":"ada@example.com","password":"Passw0rd123"}'
# => { data: { accessToken, ... } }, refresh_token set as an HttpOnly cookie

# 2. Register an OAuth client ("app") owned by that user
curl -X POST http://localhost:4000/api/v1/oauth/clients \
  -H "Authorization: Bearer <accessToken>" -H "Content-Type: application/json" \
  -d '{"name":"My App","redirectUris":["https://app.example.com/callback"],"scopes":["profile","email"]}'
# => { data: { client: { clientId }, clientSecret } }  (secret shown once)

# 3. Validate + submit an authorization decision (see src/docs/OAUTH_FLOW.md for the full flow)
# 4. Exchange the returned code at /api/v1/oauth/token for access_token + refresh_token
# 5. Use refresh_token at /api/v1/oauth/token (grant_type=refresh_token) to rotate it
```

## License

MIT
