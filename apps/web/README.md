# MPconnect Web (frontend)

Standalone Next.js frontend for MPconnect. Talks to the backend API via `NEXT_PUBLIC_API_URL`.

## Run locally

Terminal 1 — **API** (repo root):

```bash
pnpm install
cp .env.example .env.local   # DATABASE_URL, GEMINI_API_KEY, CORS_ORIGINS=http://localhost:3001
pnpm db:push && pnpm seed
pnpm dev                     # http://localhost:3000
```

Terminal 2 — **Web**:

```bash
cp apps/web/.env.example apps/web/.env.local
# NEXT_PUBLIC_API_URL=http://localhost:3000
# NEXT_PUBLIC_GOOGLE_MAPS_KEY=...   # required for /map
pnpm dev:web                 # http://localhost:3001
```

## User flow

| Step | Route | Who |
|------|-------|-----|
| 1. Home | `/` | Citizen — report CTA, recent submissions, trending |
| 2. Report | `/submit` | Citizen — voice/text/photo chat intake |
| 3. Map | `/map` | Everyone — Google Maps demand hotspots (tap pin → detail) |
| 4. Detail | `/p/[id]` | Everyone — priority score, timeline, "I'm affected too" |
| 5. Priorities | `/dashboard` | MP/staff — ranked list, role switcher, demand drawer |
| Staff | `/review`, `/voice`, `/vision` | Staff links in header menu |

Bottom nav (mobile): **Home · Map · Report · Priorities · About**

## Routes

| Path | Description |
|------|-------------|
| `/` | Citizen home |
| `/submit` | Chat intake |
| `/map` | Constituency hotspot map (MPconnect demands) |
| `/p/[id]` | Public demand / rally point |
| `/dashboard` | MP priorities command center |
| `/voice` | Browser voice agent |
| `/review` | Human review queues |
| `/vision` | Vision & about |

## Deploy

Set on the web app:

- `NEXT_PUBLIC_API_URL` → API deployment URL
- `NEXT_PUBLIC_GOOGLE_MAPS_KEY` → Maps (for `/map`)
- `NEXT_PUBLIC_GEMINI_API_KEY` → optional, Live voice
- `NEXT_PUBLIC_SITE_URL` → public frontend URL

On the API: `CORS_ORIGINS` = frontend URL.
