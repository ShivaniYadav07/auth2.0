# Full-Stack Architecture

This document explains the system as a whole — how the React frontend (`client/`) and the
Express backend (`oauth2-server/`) fit together, and the reasoning behind the decisions
that span both. For backend-internal layering (routes → services → models, error
handling, hashing choices) see [oauth2-server/ARCHITECTURE.md](./oauth2-server/ARCHITECTURE.md).

## The four OAuth roles, and the frontend's split personality

OAuth 2.0 is a **delegated-authorization** protocol: it lets one app access a user's data
on another service without ever seeing that user's password. RFC 6749 defines four roles,
and this project implements all of them:

| Role | Spec name | Here |
|---|---|---|
| The human who owns the data | Resource Owner | The registered user |
| The app requesting access | Client | A registered OAuth client (a third-party app) |
| The server issuing tokens | Authorization Server | `oauth2-server` |
| The server holding the data | Resource Server | `oauth2-server` (`/users/me`) |

The crucial subtlety: **the one React frontend wears two hats.** Most of the time it is
the *resource owner's browser* — a person logging into the authorization server itself.
But on the OAuth demo pages it also *impersonates the third-party client*, because there
is no second app in this repo to play that part. That is why the demo stashes a client
secret in the browser ([`client/src/utils/demoStorage.js`](./client/src/utils/demoStorage.js)) —
something a real client would keep on its own backend and never expose to a browser. Keep
this dual role in mind; it explains most "wait, why is that in the browser?" questions.

## System topology

```
┌──────────────────────────────────────┐        ┌─────────────────────────────────┐
│      BROWSER — client/ (React SPA)    │        │   oauth2-server (Express API)   │
│                                       │        │                                 │
│  pages/            route-level screens│        │  routes → middleware →          │
│    │                                  │        │    controllers → services →     │
│    ▼                                  │        │      models (MongoDB / Atlas)   │
│  context/AuthContext  global auth     │        │                                 │
│    │                                  │  HTTPS │  - signs JWT access tokens      │
│    ▼                                  │◄──────►│  - sets HttpOnly refresh cookie │
│  api/*.js          one axios instance │  JSON  │  - rotates refresh tokens       │
│    │                                  │        │  - validates redirect URIs      │
│    ▼                                  │        │  - CORS allow-list, rate limits │
│  utils/tokenStore  access token in    │        │                                 │
│                    memory only        │        │                                 │
└──────────────────────────────────────┘        └─────────────────────────────────┘
          ▲                                                     │
          │      refresh_token cookie (HttpOnly, path=/api/v1/auth)
          └───────────────────────────────────────────────────┘
```

The frontend's internal layering deliberately mirrors the backend's discipline: each
layer depends only on the one below it, and the lowest layers know nothing about the
layers above.

```
pages → context → api → utils
   ↘        ↘              ↗
    components  ←──  schemas
```

- **`api/`** is the *only* place that talks to the backend. It owns the single axios
  instance ([`axiosClient.js`](./client/src/api/axiosClient.js)); every other file calls
  typed functions like `loginUser()` and never touches HTTP directly.
- **`context/AuthContext`** is the single source of truth for "who is logged in." Exactly
  one piece of global state exists, which is why Context is used instead of Redux.
- **`utils/tokenStore`** holds the access token in a module-level variable — not React
  state — so the axios interceptors can read it without a React render cycle.

## The two-token model

Everything about session handling follows from a single security decision: **two tokens,
stored in two different places, with two different lifetimes.**

| | Access token | Refresh token |
|---|---|---|
| Format | Signed JWT (`sub`, optional `client_id`, `scope`) | Opaque random string (SHA-256 hashed in DB) |
| Lifetime | Short — 15 minutes | Long — 30 days, single-use (rotates) |
| Stored (frontend) | In memory ([`tokenStore.js`](./client/src/utils/tokenStore.js)) | Nowhere in JS — HttpOnly cookie |
| Sent on | Every API call, as `Authorization: Bearer …` | Only `/api/v1/auth/*` (cookie `path`) |
| Revocable? | No (stateless — no DB lookup on verify) | Yes |

**Why the access token lives in memory, not `localStorage`.** `localStorage` is readable
by any JavaScript on the page, so a single XSS foothold could exfiltrate a token there. A
module-level variable limits that blast radius and is wiped on refresh. The cost — the
token is lost on every page reload — is paid back by the bootstrap flow below.

**Why the refresh token is an HttpOnly cookie.** `HttpOnly` means JavaScript literally
cannot read it (`document.cookie` won't show it), so even a successful XSS can't steal it.
The browser still *sends* it automatically — which is why the axios instance sets
`withCredentials: true`. The cookie is scoped to `path=/api/v1/auth`, so it is only ever
transmitted to the refresh/logout endpoints, never attached to ordinary API calls.

**Why the access token is stateless.** Verifying a JWT needs no database lookup, so every
protected-resource request is cheap. The trade-off — an access token cannot be revoked
before it expires — is mitigated by the short 15-minute TTL; long-lived access comes from
rotating the (revocable) refresh token, not from a longer access token.

## Lifecycles

### Request lifecycle (every API call)

1. A component calls a function in `api/*.js`.
2. The axios **request interceptor** attaches `Authorization: Bearer <access token>` from
   `tokenStore`, unless the caller set one explicitly ([`axiosClient.js`](./client/src/api/axiosClient.js)).
3. On `200`, the response is unwrapped (`res.data.data`) and returned to the component.
4. On `401` from a non-auth endpoint, the **response interceptor** performs exactly one
   silent refresh: it `POST`s `/auth/refresh` (sharing a single in-flight `refreshPromise`
   so parallel 401s don't stampede), stores the new access token, and transparently
   retries the original request. If the refresh fails, it clears the token and calls
   `notifyUnauthorized()`, which logs the user out.

### Authentication (session) lifecycle

- **Register / login** → backend returns `{ user, accessToken }` and sets the refresh
  cookie; `AuthContext` stores both.
- **Page refresh** → memory is wiped, so on mount `AuthContext` runs a **bootstrap**:
  it silently calls `/auth/refresh` (the browser attaches the cookie), mints a fresh
  access token, and re-fetches the user — so a reload doesn't log you out. The `loading`
  flag exists to cover this window; `ProtectedRoute` shows a spinner until it resolves.
  A `useRef` guard makes the bootstrap run once even under React StrictMode's
  double-invoked effects, which would otherwise redeem the single-use refresh token twice
  and trip theft detection.
- **Token expiry mid-session** → handled transparently by the response interceptor above.
- **Logout** → backend revokes the refresh token and clears the cookie; the frontend
  clears in-memory state.

### OAuth (delegation) lifecycle — the demo flow

The backend's `/oauth/authorize` returns **JSON**, not an HTML page, so the frontend is
the consent UI that renders it and performs the browser redirects itself:

1. The user registers an OAuth client and receives `client_id` + `client_secret` (shown
   once). The demo stashes the secret in `localStorage` and remembers the in-flight
   request in `sessionStorage`.
2. The browser visits `/oauth/authorize?client_id=…&redirect_uri=…&scope=…&state=…`.
3. `Authorize.jsx` `GET`s `/oauth/authorize`; the backend validates the request (crucially,
   it validates `client_id` + `redirect_uri` together with an **exact** match before doing
   anything else, to prevent open redirects) and returns consent data as JSON.
4. The user clicks **Allow** → `POST /oauth/authorize/decision` → the backend returns a
   `redirectUrl` carrying `?code=…&state=…`. The frontend navigates the browser there.
5. `/oauth/callback` (`OAuthCallback.jsx`) reads the single-use `code` and exchanges it —
   with the stored `client_secret` — via `POST /oauth/token`, receiving an OAuth access
   token. A `useRef` guard prevents StrictMode from burning the single-use code twice.
6. The success page proves it worked by calling `/users/me` with that new token.

The `state` parameter (CSRF defense) and the single-use `code` are the security spine of
this flow; the exact-match `redirect_uri` check is what stops the classic open-redirect
attack.

## Client-side vs server-side validation

The same Zod schemas conceptually exist on both tiers, but for different reasons.
**Client-side validation is a UX feature, not a security control** — anyone can bypass the
browser and POST arbitrary data. The frontend validates to give fast, friendly feedback;
the backend re-validates every input with its own Zod schemas because it is the only tier
that can be trusted. Any rule enforced *only* on the frontend is not actually enforced.

## Deployment topology and the cross-site cookie decision

In production the two halves live on **different sites** (`*.vercel.app` and
`*.onrender.com`). This changes one thing fundamentally: cookies.

A `SameSite=Strict` (or even `Lax`) cookie is **not sent on cross-site requests**, so the
silent-refresh call from the Vercel frontend to the Render backend would never carry the
refresh cookie, and users would appear logged out on every reload. The fix is
`SameSite=None` — which browsers only honor together with `Secure` (HTTPS). Both are true
in production, so the cookie's `sameSite` is made configurable via `COOKIE_SAMESITE`
(default `strict` for same-site local dev, set to `none` in production). `COOKIE_DOMAIN`
is left unset in production so the cookie binds to the backend's own host.

CORS is the other cross-site gate: the backend reflects only origins present in
`CORS_ALLOWED_ORIGINS`, echoes the specific origin (never `*`, which is illegal alongside
`credentials: true`), and — in production — refuses to fall back to allow-all if the list
is empty. The frontend's exact Vercel origin must be on that list.

See the [README](./README.md#deployment) for the concrete variable values.

## Why this architecture — and what was rejected

| Decision | Chosen | Rejected alternative | Why |
|---|---|---|---|
| App type | SPA (Vite + React) | Server-rendered (Next.js) | Backend is already a separate API; an SPA keeps a clean client/server split with no render server to run. |
| Global state | Context API | Redux / Zustand | Exactly one global value (auth); Redux would be ceremony. |
| Access token storage | In-memory variable | `localStorage` | `localStorage` is XSS-readable; memory limits the blast radius. |
| Data fetching | Plain axios + Context | React Query / SWR | Very little server state to cache; a caching layer would be overkill. |
| Forms | React Hook Form + Zod | Formik / hand-rolled | Uncontrolled inputs (fewer re-renders) and one schema shared with the backend contract. |
| Consent UI | JSON API + separate frontend | Server-rendered consent page | Mirrors how hosted-login systems (Auth0/Okta) actually work; keeps the backend templating-free. |

Each "rejected" row is a deliberate scope decision, not an omission — the same spirit as
the backend's [Known limitations](./oauth2-server/ARCHITECTURE.md#known-limitations--future-improvements)
(no PKCE, no token introspection, single scope tier), which are documented there rather
than left implicit.

## What should not change lightly

- **`api/` as the only HTTP boundary.** Keeping all backend calls behind typed functions
  is what makes the interceptors, auth headers, and error shaping work uniformly.
- **The access-token-in-memory / refresh-token-in-cookie split.** Moving the access token
  to `localStorage` for convenience would reintroduce the XSS exposure this design avoids.
- **The exact-match `redirect_uri` check** on the backend — relaxing it to a prefix match
  reopens the open-redirect vulnerability.
- **The single-use, rotating refresh token with theft detection** — the StrictMode `useRef`
  guards in the frontend exist specifically to keep this invariant intact.
