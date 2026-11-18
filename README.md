# AskData web app

The Next.js frontend for AskData, deployed to Vercel. The FastAPI backend lives in its own repository and is deployed to Render.

## How it talks to the backend

The browser only ever calls this app. `next.config.ts` forwards every `/api/*` request to the backend (`BACKEND_URL`), so:

- the login cookie (`askdata_session`, HttpOnly) belongs to this app's own domain, and no CORS setup is needed;
- every write sends an `X-AskData-CSRF: 1` header, which the backend requires for cookie-authenticated requests ([src/lib/api.ts](src/lib/api.ts)).

[src/proxy.ts](src/proxy.ts) only sends logged-out visitors to `/login`; the backend checks the token on every call. It deliberately never runs on `/api/*`, because Next.js buffers proxied request bodies (10 MB by default), which would cut off large uploads.

## Run locally

Start the backend first (in the backend repo): `uv run uvicorn app.main:app --reload`. Then:

```bash
npm install
npm run dev          # http://localhost:3000, proxies /api to http://localhost:8000
```

Set `BACKEND_URL` to point somewhere else.

## Checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Deploy (Vercel)

- Import this repository in Vercel (framework preset: Next.js, default settings).
- **Environment variable:** `BACKEND_URL=https://<your-backend>.onrender.com`. It is read **at build time** (rewrites are compiled into the build), so redeploy after changing it.
