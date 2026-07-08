# Client — OAuth 2.0 Frontend

The React single-page app for the [OAuth 2.0 Authorization Server](../README.md). It is
the login / consent UI for the backend and a live demonstration of the full Authorization
Code Flow. Built with React 19, Vite, React Router, React Hook Form, Zod, Axios, and
Tailwind CSS.

> This is one half of a monorepo. For the big picture — the two-token model, how the
> frontend talks to the backend, and the deployment setup — read the root
> [README](../README.md) and [ARCHITECTURE](../ARCHITECTURE.md) first.

## Project structure

```
src/
  api/         the ONLY layer that talks to the backend (one axios instance + typed calls)
  context/     AuthContext — global auth state and the silent-refresh bootstrap
  pages/       route-level screens (Home, Login, Register, Dashboard, OAuth flow, errors)
  components/  reusable UI — layout/ (Layout, ProtectedRoute) and ui/ (Button, Input, …)
  schemas/     Zod schemas for form validation
  utils/       framework-agnostic helpers: tokenStore, demoStorage, apiError, constants
  App.jsx      route table + provider wiring
  main.jsx     entry point
```

Dependency direction is one-way: `pages → context → api → utils`, with `components` and
`schemas` as leaves. `utils/` imports nothing from the app.

## Getting started

```bash
npm install
cp .env.example .env      # VITE_API_BASE_URL, defaults to http://localhost:4000/api/v1
npm run dev               # http://localhost:5173
```

The backend must be running and must list this origin in its `CORS_ALLOWED_ORIGINS`.

## Scripts

```bash
npm run dev       # Vite dev server with HMR
npm run build     # production build to dist/
npm run preview   # serve the production build locally
npm run lint      # oxlint
```

## Environment variables

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Base URL of the backend API, including the `/api/v1` suffix. Inlined at **build time** — a change requires a rebuild. |

For deployment (Vercel + Render, including the cross-site cookie configuration), see the
root [README](../README.md#deployment). SPA deep-link routing is handled by
[`vercel.json`](./vercel.json).
