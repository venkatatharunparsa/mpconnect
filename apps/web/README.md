# MPconnect Web (frontend)

Standalone Next.js frontend for MPconnect. Talks to the backend API via `NEXT_PUBLIC_API_URL`.

## Run locally

Terminal 1 — **API** (repo root):

```bash
pnpm install
cp .env.example .env.local   # DATABASE_URL, GEMINI_API_KEY, CORS_ORIGINS=http://localhost:3001
pnpm dev                     # http://localhost:3000
```

Terminal 2 — **Web**:

```bash
cp apps/web/.env.example apps/web/.env.local
# NEXT_PUBLIC_API_URL=http://localhost:3000
pnpm dev:web                 # http://localhost:3001
```

## Routes

| Path | Description |
|------|-------------|
| `/` | Landing |
| `/submit` | Citizen chat intake |
| `/voice` | Browser voice agent |
| `/dashboard` | MP command center |
| `/review` | Human review queues |
| `/vision` | Vision page |
| `/p/[id]` | Public demand rally point |

## Deploy

Deploy this app separately from the API (e.g. second Vercel project). Set:

- `NEXT_PUBLIC_API_URL` → your API deployment URL
- `NEXT_PUBLIC_GOOGLE_MAPS_KEY` → Maps key (dashboard)
- `NEXT_PUBLIC_GEMINI_API_KEY` → optional, for Live voice mode
- `NEXT_PUBLIC_SITE_URL` → this frontend's public URL (OG images)

On the API deployment, set `CORS_ORIGINS` to your frontend URL.
