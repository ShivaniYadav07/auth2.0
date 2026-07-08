# OAuth 2.0 Authorization Server — Full Stack

A from-scratch OAuth 2.0 Authorization Server (RFC 6749 Authorization Code Flow) with
first-party user authentication, paired with a React single-page app that acts as its
login / consent / demo frontend.

This repository is a **monorepo** with two independently-deployable halves:

| Directory | What it is | Deployed on |
|---|---|---|
| [`oauth2-server/`](./oauth2-server) | Node.js + Express + MongoDB API — the Authorization **and** Resource Server | Render |
| [`client/`](./client) | React + Vite SPA — the login/consent UI and a live demo of the whole OAuth flow | Vercel |

The backend is **API-only** (every endpoint returns JSON, including `/oauth/authorize`).
The frontend is the browser-facing application that calls those APIs, holds the user's
session, and drives the OAuth redirect choreography. Neither half renders the other.

> New to the codebase? Read [ARCHITECTURE.md](./ARCHITECTURE.md) first — it explains the
> full-stack design, the two-token model, and how the two halves talk to each other. Then
> dive into the backend's own [ARCHITECTURE.md](./oauth2-server/ARCHITECTURE.md) for
> server-internal reasoning.

## What it does

- **User authentication** — register, login, logout, silent session refresh, protected
  routes, "who am I" (`/users/me`).
- **OAuth 2.0 Authorization Code Flow** — register a confidential OAuth client, run the
  `authorize → consent → code → token` handshake, rotate and revoke tokens.
- **Security** — bcrypt-hashed passwords and client secrets, short-lived JWT access
  tokens, HttpOnly refresh-token cookies, refresh-token rotation with theft detection,
  Helmet, a CORS allow-list, rate limiting, Zod validation on both tiers, and centralized
  error handling that never leaks internals.

## Architecture at a glance

```
┌───────────────────────────┐        HTTPS / JSON        ┌────────────────────────────┐
│   client/  (React SPA)     │ ─────────────────────────► │  oauth2-server/  (Express)  │
│                            │                            │                             │
│  pages → context → api →   │ ◄───────────────────────── │  routes → middleware →      │
│  tokenStore (access token  │   refresh_token cookie     │  controllers → services →   │
│  in memory only)           │   (HttpOnly, cross-site)   │  models (MongoDB)           │
└───────────────────────────┘                            └────────────────────────────┘
        Vercel                                                      Render + MongoDB Atlas
```

The **access token** is a short-lived (15 min) JWT held only in JavaScript memory. The
**refresh token** is an opaque, rotating value the browser never sees in JS — it lives in
an HttpOnly cookie. See [ARCHITECTURE.md](./ARCHITECTURE.md#the-two-token-model) for why.

## Tech stack

**Backend** — Node.js · Express · MongoDB/Mongoose · JWT · bcrypt · Zod · Helmet ·
`express-rate-limit` · Pino
**Frontend** — React 19 · Vite · React Router · React Hook Form · Zod · Axios · Tailwind CSS

## Getting started (local development)

### Prerequisites
- Node.js 18+
- MongoDB running locally, or a hosted connection string (MongoDB Atlas)

### 1. Backend

```bash
cd oauth2-server
npm install
cp .env.example .env      # then edit — set MONGO_URI and a 32+ char JWT_ACCESS_SECRET
npm run dev               # boots on http://localhost:4000
```

### 2. Frontend

```bash
cd client
npm install
cp .env.example .env      # defaults to http://localhost:4000/api/v1 — fine for local
npm run dev               # boots on http://localhost:5173
```

Open http://localhost:5173, register a user, then try the OAuth demo from the
**OAuth Clients** page.

> `CORS_ALLOWED_ORIGINS` in the backend `.env` must include the frontend origin
> (`http://localhost:5173`) or the browser will block the requests.

## Deployment

The two halves deploy separately. Because the frontend (`*.vercel.app`) and backend
(`*.onrender.com`) live on **different sites**, the session cookie must be configured for
cross-site use — this is the single most common thing that breaks a first deploy.

### Backend (Render)

Set these environment variables on the service:

| Variable | Value | Why |
|---|---|---|
| `NODE_ENV` | `production` | Enables `secure` cookies and the CORS production guard |
| `MONGO_URI` | your Atlas connection string | Atlas Network Access must allow Render's IPs (`0.0.0.0/0` on free tier) |
| `JWT_ACCESS_SECRET` | 32+ random chars | Signing key; the server refuses to boot without it |
| `CORS_ALLOWED_ORIGINS` | your exact Vercel origin, e.g. `https://your-app.vercel.app` | No trailing slash; comma-separate multiple |
| `COOKIE_SAMESITE` | `none` | Required so the refresh cookie is sent cross-site (Vercel → Render) |
| `COOKIE_DOMAIN` | *(leave unset)* | Must not be `localhost`; unset binds the cookie to the backend host |

`COOKIE_SAMESITE=none` only works together with `secure: true` (HTTPS), which is why it's
paired with `NODE_ENV=production`. A health check is available at `GET /health`.

### Frontend (Vercel)

- **Root Directory**: `client`
- **Environment variable**: `VITE_API_BASE_URL = https://<your-render-app>.onrender.com/api/v1`
  (note the `/api/v1` suffix; Vite inlines this at **build time**, so redeploy after changing it)
- SPA routing is handled by [`client/vercel.json`](./client/vercel.json), which rewrites
  all paths to `index.html` so deep links like `/oauth/callback` don't 404.

After the first Vercel deploy, copy the resulting URL back into Render's
`CORS_ALLOWED_ORIGINS` and redeploy the backend.

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — full-stack design, two-token model, request/auth/OAuth lifecycles, deployment topology
- [oauth2-server/ARCHITECTURE.md](./oauth2-server/ARCHITECTURE.md) — backend layering and server-internal security rationale
- [oauth2-server/src/docs/OAUTH_FLOW.md](./oauth2-server/src/docs/OAUTH_FLOW.md) — step-by-step Authorization Code Flow walkthrough
- [oauth2-server/src/docs/API.md](./oauth2-server/src/docs/API.md) — full endpoint reference

## License

MIT
