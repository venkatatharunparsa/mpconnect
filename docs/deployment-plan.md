# MPconnect Deployment Plan

This document outlines the step-by-step procedure to deploy the **MPconnect** monorepo (frontend, backend, and database) to production cloud hosting platforms.

---

## Architecture Topology

```
                  ┌──────────────────────┐
                  │   Citizen Interface  │
                  │   (Telegram Bot)     │
                  └──────────┬───────────┘
                             │ (Webhook)
                             ▼
 ┌──────────────┐  HTTP/JSON ┌──────────────┐  SQL  ┌─────────────────────┐
 │  Web PWA     ├───────────►│  Backend API ├──────►│  Neon PostgreSQL    │
 │ (apps/web)   │  (CORS)    │  (apps/api)  │       │  (+PostGIS/vector)  │
 └──────────────┘            └──────────────┘       └─────────────────────┘
```

* **Frontend Web (`apps/web`)**: Deployed on **Vercel** (recommended for Next.js).
* **Backend API (`apps/api`)**: Deployed on **Vercel** or **Railway/Render/Cloud Run** (allows API endpoints, Webhooks, and CRON paths).
* **Database**: Managed **Neon PostgreSQL** database with PostGIS and pgvector support.

---

## Phase 1: Database Provisioning & Schema Migration

### 1. Provision Neon Database
1. Go to [Neon Console](https://neon.tech) and create a new project.
2. Select PostgreSQL version **16** (region: Asia/India preferred for lower latency).
3. Enable the following extensions in the Neon console SQL editor (if not auto-enabled):
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
4. Copy the connection string (with SSL mode enabled: `?sslmode=require`).
   Example: `postgresql://neondb_owner:<password>@<host>/neondb?sslmode=require`

### 2. Apply Schema & Load Seed Data (From your local machine)
Use the workspace orchestrator to migrate and seed the remote database using your `.env.local` credentials:
```bash
# 1. Update DATABASE_URL in apps/api/.env.local with your production Neon string

# 2. Push database schema directly to Neon
pnpm db:push

# 3. Load official Visakhapatnam authority and datasets seed
pnpm seed
```

---

## Phase 2: Backend API Deployment (`apps/api`)

This guide uses **Vercel** as the primary host. The same configuration applies to Render/Railway.

### 1. Create a New Vercel Project
1. Log in to [Vercel Console](https://vercel.com) and click **Add New** -> **Project**.
2. Select your git repository containing `mpconnect`.
3. In the project settings, configure:
   * **Project Name**: `mpconnect-api`
   * **Framework Preset**: `Next.js`
   * **Root Directory**: `apps/api` (Crucial! Do not deploy the root `.`)
4. Under **Build & Development Settings**:
   * **Build Command**: `next build` (Vercel overrides this automatically when the root directory is set to `apps/api`)
   * **Install Command**: `pnpm install`
5. Under **Environment Variables**, add the following production values:
   * `DATABASE_URL`: Your Neon connection string.
   * `GEMINI_API_KEY`: Google AI Studio key.
   * `TELEGRAM_BOT_TOKEN`: Token obtained from `@BotFather`.
   * `PUBLIC_URL`: Set this to the production domain Vercel assigns to this API project (e.g., `https://mpconnect-api.vercel.app`).
   * `CORS_ORIGINS`: Set this to your production frontend domain (e.g., `https://mpconnect-web.vercel.app`).
   * `ENABLE_DEV_ENDPOINTS`: Set to `false` in production.
6. Click **Deploy**.

---

## Phase 3: Frontend Web Deployment (`apps/web`)

### 1. Create a New Vercel Project
1. In the Vercel console, click **Add New** -> **Project**.
2. Select the same git repository.
3. In the project settings, configure:
   * **Project Name**: `mpconnect-web`
   * **Framework Preset**: `Next.js`
   * **Root Directory**: `apps/web` (Crucial!)
4. Under **Build & Development Settings**:
   * **Install Command**: `pnpm install`
5. Under **Environment Variables**, add:
   * `NEXT_PUBLIC_API_URL`: The production backend URL from Phase 2 (e.g., `https://mpconnect-api.vercel.app`).
   * `NEXT_PUBLIC_GOOGLE_MAPS_KEY`: Your production-restricted Google Maps API JavaScript key.
   * `NEXT_PUBLIC_GEMINI_API_KEY`: (Optional) Browser API key if utilizing the Live voice agent.
   * `NEXT_PUBLIC_SITE_URL`: Set this to the frontend URL itself (e.g., `https://mpconnect-web.vercel.app`).
6. Click **Deploy**.

---

## Phase 4: Webhook & Integration Configuration

Once both frontend and backend are live, wire up external integrations.

### 1. Set Telegram Bot Webhook
To route messaging incoming from Telegram to your deployed API:
```bash
# In apps/api/.env.local, set:
# PUBLIC_URL = https://mpconnect-api.vercel.app
# TELEGRAM_BOT_TOKEN = <your_token>

# Run webhook registration script
pnpm telegram:webhook
```
Alternatively, hit the setup endpoint directly via your browser or curl:
`https://mpconnect-api.vercel.app/api/telegram?setup=true` (ensure it returns `{"ok":true}`).

### 2. Configure Vercel Cron Jobs (Optional)
The backend has cron paths configured under `src/app/api/cron/...` for:
- SLA Escalations (`/api/cron/escalate`)
- Verification Timings (`/api/cron/verification-timeout`)

If using Vercel, create a `vercel.json` inside `apps/api/` to schedule these endpoints:
```json
{
  "crons": [
    {
      "path": "/api/cron/escalate",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/verification-timeout",
      "schedule": "0 12 * * *"
    }
  ]
}
```
*Note: Cron endpoints are protected. Secure them using an auth header check in production (e.g., `CRON_SECRET`).*

---

## Post-Deployment Checklist

- [ ] Hit the backend health check: `https://<api-domain>/` (should render the "MPconnect API" homepage).
- [ ] Send a test message to your Telegram bot (verify it gets logged and replies with a tracking ID).
- [ ] Open the citizen frontend, submit a report, and verify it updates the Neon database state.
- [ ] Access the MP dashboard (confirm the map markers load and UDISE data panels fetch properly).
- [ ] Confirm CORS configuration allows cross-domain communications between the frontend and backend.
