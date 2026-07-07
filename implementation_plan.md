# Implementation Plan: MPconnect Folder & Directory Architecture

This plan establishes the folder and directory structure for the Next.js 14 single-repo **MPconnect** application. By referencing all specifications in the [docs/](file:///c:/Users/mahip/OneDrive/Desktop/MPConnect/mpconnect/docs/) directory (including the technical design, system design, and functional requirements), this architecture maps the code layout to a clean **Layered Architecture** (Routers, Services, Repositories, and Infrastructure Clients) while fulfilling the 7 demo moments.

---

## Folder Design Goals

1. **Strict separation of concerns**: Routers handle requests, Services handle orchestration, Repositories handle data, and Clients handle external integration (Gemini, Telegram).
2. **Alignment with CLAUDE.md contracts**:
   * Append-only ledger events live in `src/db/repositories/eventRepository.ts` to enforce the immutability hash-chain contract.
   * Taxonomy rules and thresholds live in config files (`src/lib/config.ts`, `src/lib/taxonomy.ts`), not inlined in services.
   * Prompts live inside `src/prompts/` to ensure they are version-controlled and distinct from execution code.
3. **App Router structure**: Standardizing the 7 demo moments into user routes and versioned JSON API endpoints under `/api/v1/`.

---

## Visual Directory Layout

```
mpconnect/
├── docs/                      # [EXISTING] 20 research, validation, and design documents
├── seed/                      # [EXISTING] Seed dataset configurations
│   ├── authorities.json       # Sourced authority mappings (verified vs quarantined)
│   ├── datasets.json          # UDISE + Census data rows (real and estimated)
│   ├── wards.json             # Pilot ward polygon coordinates (Gajuwaka, MVP, Bheemili)
│   └── load.ts                # Seed script loader (supports --reset)
├── src/                       # Main application source directory
│   ├── app/                   # Router & UI Layer (Next.js 14 App Router)
│   │   ├── api/               # API Router Layer
│   │   │   └── v1/            # Versioned API routes
│   │   │       ├── submit/    # Web & Telegram webhook ingestion endpoint
│   │   │       │   └── route.ts
│   │   │       ├── demands/   # Demands querying, manual merging/splitting
│   │   │       │   └── route.ts
│   │   │       ├── verify/    # Citizen confirm/deny route for Moment 6
│   │   │       │   └── route.ts
│   │   │       ├── review/    # Admin queue review (Moment 7 coordinated attacks)
│   │   │       │   └── route.ts
│   │   │       └── simulate/  # Developer endpoint to trigger templated report bursts
│   │   │           └── route.ts
│   │   ├── submit/            # Citizen Intake Page (Moment 1 - text/voice/photo)
│   │   │   └── page.tsx
│   │   ├── voice/             # Browser Gemini Live voice agent (Moment 11)
│   │   │   └── page.tsx
│   │   ├── dashboard/         # MP Command Center, Google Map, Evidence Panel (Moments 3, 4, 5)
│   │   │   └── page.tsx
│   │   ├── review/            # Human-gate quarantine review screen (Moment 7)
│   │   │   └── page.tsx
│   │   ├── vision/            # Project vision & methodology page (H13)
│   │   │   └── page.tsx
│   │   ├── p/                 # Public demand detail page
│   │   │   └── [id]/          # Dynamic folder per Demand ID (Rally points)
│   │   │       └── page.tsx
│   │   ├── globals.css        # [EXISTING] Global CSS and Tailwind resets
│   │   ├── layout.tsx         # [EXISTING] App wrapper containing navigation header
│   │   └── page.tsx           # [EXISTING] Landing page showing moments index
│   ├── db/                    # DB configuration, mappings, and raw schemas
│   │   ├── repositories/      # Repository Layer (Isolates Drizzle queries from services)
│   │   │   ├── submissionRepository.ts # Submission queries (insertion, query by phone)
│   │   │   ├── demandRepository.ts     # Master demand CRUD, state updates, rank inserts
│   │   │   ├── eventRepository.ts      # Event ledger appends, SHA-256 chain validation
│   │   │   └── authorityRepository.ts  # Sourced authority mappings checks
│   │   ├── index.ts           # [EXISTING] Drizzle client initialization
│   │   └── schema.ts          # [EXISTING] Schema definitions (events, submissions, demands)
│   ├── services/              # Service Layer (Orchestrates business logic and components)
│   │   ├── intakeService.ts      # Structured attribute extraction (Gemini Multimodal ASR)
│   │   ├── mergeService.ts       # Embedding similarity + Geo-proximity merge calculation
│   │   ├── rankingService.ts     # Formula scoring calculations and MPLADS recommendation generator
│   │   ├── verificationService.ts # State transitions and citizen confirm/deny flows
│   │   └── abuseService.ts        # Coordinated attack patterns and rate limit scoring
│   ├── lib/                   # Shared utility modules
│   │   ├── clients/           # Infrastructure Clients (Third-party integrations)
│   │   │   ├── gemini.ts      # @google/generative-ai SDK wrapper (retry limit handling)
│   │   │   └── telegram.ts    # grammY bot webhook connection adapter
│   │   ├── config.ts          # [EXISTING] Threshold configs (thetaHi, thetaLo, rank weights)
│   │   ├── events.ts          # [EXISTING] SHA-256 event append-only core logic
│   │   ├── taxonomy.ts        # [EXISTING] Standard GVMC taxonomy categories
│   │   ├── logger.ts          # Structured JSON logging utility with X-Request-ID
│   │   └── errors.ts          # AppError definitions mapping to HTTP status codes
│   ├── prompts/               # Prompts Layer (Version-controlled template text)
│   │   ├── extraction_v1.txt  # System prompt for structured NLU attributes
│   │   ├── correlation_v1.txt # Prompt to analyze coordination patterns
│   │   └── narrative_v1.txt   # Prompt to generate side-by-side evidence texts
│   └── types/                 # Shared TypeScript Type/Zod definitions
│       └── api.ts             # Zod validation schemas for request/response payloads
├── tests/                     # Verification Layer
│   ├── unit/                  # Offline unit tests
│   │   ├── events.test.ts     # Tests event insertion and SHA-256 chain tampering detection
│   │   ├── merge.test.ts      # Tests auto-merge candidate math configurations
│   │   └── ranking.test.ts    # Tests prioritization ranking scores
│   └── integration/           # Integration tests
│       └── intake.test.ts     # Tests intake service with mocked Gemini client responses
├── drizzle.config.ts          # [EXISTING] Drizzle Kit push/pull migration config
├── next.config.mjs            # [EXISTING] Next.js settings
├── package.json               # [EXISTING] Monolithic dependency manifest
├── tailwind.config.ts         # [EXISTING] Tailwind theme colors configuration
└── tsconfig.json              # [EXISTING] TypeScript configurations
```

---

## Detailed Directory and File Specifications

### 1. The Prompt Layer (`src/prompts/`)
Following **LLM Practice #1** (Version your prompts), prompts must be treated as code. They are stored as separate text files to prevent inline clutter:
* `extraction_v1.txt`: Fenced template instructions for parsing Telugu/English citizen voice logs to strict JSON format without tools.
* `correlation_v1.txt`: Analysis prompt to detectcoordinated attacks.
* `narrative_v1.txt`: Comparative prompt to fuse census/UDISE+ data with citizen demands to produce objective recommendations.

### 2. The Infrastructure Clients (`src/lib/clients/`)
Encapsulates standard SDK calls to isolate changes in downstream providers:
* `gemini.ts`: Standardizes the configuration of the `@google/generative-ai` model client, handles temperature settings (temperature=0 for structured extraction), maps tokens, and implements exponential backoff retries using `tenacity`-style patterns.
* `telegram.ts`: Set up adapter hooks for `grammY` webhooks to format Telegram voice notes/text into standard internal Report types.

### 3. The Repository Layer (`src/db/repositories/`)
Encapsulates Drizzle ORM operations, mapping database tables to domain logic:
* `eventRepository.ts`: Enforces **Sacred Contract #1 (Append-only)**. It exposes `appendEvent` which retrieves the previous event's hash, generates a canonical sorted payload, hashes the result, and inserts it. It also exposes `verifyChain` to trace tampered logs.
* `submissionRepository.ts`: Implements retrieval and insertion interfaces for citizen submissions.
* `demandRepository.ts`: Implements search, creation, manual merge, and split logic for Master Demands.

### 4. The Service Layer (`src/services/`)
Orchestrates business rules across layers:
* `intakeService.ts` (Moment 1): Handshakes with `gemini.ts` to convert audio/text inputs to validated JSON schemas.
* `mergeService.ts` (Moment 2): Uses pgvector embeddings and config weights (`CONFIG.merge.weights` from [config.ts](file:///c:/Users/mahip/OneDrive/Desktop/MPConnect/mpconnect/src/lib/config.ts)) to match submissions. Auto-merges if $\ge \theta_{hi}$, queues if between $\theta_{lo}$ and $\theta_{hi}$, or creates a new demand.
* `rankingService.ts` (Moment 4 & 5): Prioritizes demands by applying weights to affected count, urgency, recurrence, equity flags, and data gaps. Auto-drafts the statutory 45/75-day clocks MPLADS recommendations.
* `verificationService.ts` (Moment 6): Runs the confirm/deny flow transitions. Denials increment the false-closure score and reopen the Master Demand.
* `abuseService.ts` (Moment 7): Implements coordinated burst detectors, text similarity matches, and shadow-quarantine assignments.

### 5. The API Router Layer (`src/app/api/v1/`)
Implements Next.js Route Handlers. They:
1. Parse the request.
2. Validate the payload using Zod schemas defined in `src/types/api.ts`.
3. Invoke the corresponding service layer method.
4. Catch custom exceptions (`AppError`) and map them to HTTP status codes, outputting consistent JSON envelopes.

---

## Verification Plan

### Automated Tests
* **Ledger Chain Integrity Test**: Run Vitest queries asserting that manual tampering of a historical event row triggers an audit failure in `verifyChain()`.
* **Auto-Merge Boundary Test**: Test that `mergeService` correctly matches mock reports within Gajuwaka ward when similarity exceeds $0.82$, and routes to the queue when similarity sits at $0.70$.
* Run command: `npm run test` (via Vitest runner).

### Manual Verification
* **Seeding Check**: Executing `pnpm demo:reset` wipes all records and rebuilds the basic [authorities](file:///c:/Users/mahip/OneDrive/Desktop/MPConnect/mpconnect/seed/authorities.json) and [datasets](file:///c:/Users/mahip/OneDrive/Desktop/MPConnect/mpconnect/seed/datasets.json) tables.
* **Moment 1-7 Dry-Run**: Launching local dev server via `npm run dev` and dry-running submissions to verify pages `/submit`, `/dashboard`, and `/review` route data cleanly through the new layout.
