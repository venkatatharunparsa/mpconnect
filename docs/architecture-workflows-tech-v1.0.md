# VGPS / MPconnect — Architecture, Workflows, Features & Technology Handbook v1.0
*2026-07-07. The engineering handbook: consolidates and extends system-design-v1.0 + technical-design-v1.0 into one build reference. Where a choice has a rationale, it's stated; where a number is an estimate, it's marked.*

> **Hackathon-edition variance (Jul 2026):** the P0.5 hackathon prototype uses Gemini (multimodal/Live/embeddings), Google Maps, and Cloud Run in place of the production choices in §4 — same interfaces, demo-context substitution. See hackathon-build-pack-v1.0.md. Production stack below unchanged.

---

# 1. System architecture

## 1.1 The architectural identity

**An event-sourced governance ledger with an AI-powered intake funnel and human-gated intelligence.** Three sentences that define every choice below:

1. The **Problem** is the only first-class entity; everything else produces or consumes events about it.
2. AI narrows and structures; **humans authorize**; the KB is the only source of facts.
3. Every consequential fact is **auditable back to its source** — a citizen's voice note, a KB citation, a hash-chained event.

## 1.2 Logical architecture

```
╔══════════════════ CITIZEN & GOVERNMENT SURFACES ══════════════════╗
║  WhatsApp bot │ Web/PWA │ SMS │ IVR(P2) │ Assisted-intake app     ║
║  MP dashboard │ Ops console │ Officer flows │ Corporator view     ║
║  KB curator console │ Public transparency site                    ║
╚═════════════════════════════╦══════════════════════════════════════╝
                              │ HTTPS / webhooks
╔═════════════════════════════▼══════════════════════════════════════╗
║ CHANNELS unit (TS)          │ WEB unit (Next.js)                   ║
║ webhook adapters, convo     │ dashboards, consoles, portal,        ║
║ state machines, notif send  │ static public site                   ║
╚═════════╦═══════════════════╧═════════════════════════╦════════════╝
          │ events / internal API                       │ reads
╔═════════▼═══════════════════════════════╗   ╔═════════▼════════════╗
║ CORE unit (TS)                          ║   ║ PROJECTIONS          ║
║ • Event store (append-only, hash-chain) ║──►║ problem_current      ║
║ • Lifecycle state machines (G/P/D)      ║   ║ geo_index (PostGIS)  ║
║ • Routing engine ◄── AUTHORITY KB       ║   ║ rank_scores          ║
║ • SLA/escalation timers                 ║   ║ stats aggregates     ║
║ • RBAC×ABAC policy layer                ║   ║ notification outbox  ║
║ • Config registry (taxonomy/SLA/θ/wts)  ║   ╚══════════════════════╝
╚═════════╦═══════════════════════════════╝
          │ queued jobs (Redis)
╔═════════▼═══════════════════════════════════════════════════════════╗
║ PIPELINE unit (Python)                                               ║
║ ASR → extract(classify/locate/urgency) → validate → merge-match     ║
║ + safety lane + PII detect + image pHash + embeddings               ║
║ every stage: ModelDecision event · confidence<θ → human queue       ║
╚══════════════════════════════════════════════════════════════════════╝
Data plane: PostgreSQL16 (+PostGIS+pgvector) · Redis · S3-compatible media store
Cross-cutting: OTel tracing · Sentry · cost meter · audit log · KMS/PII vault
```

## 1.3 Deployment architecture (pilot scale)

- **One container runtime** (managed K8s optional; Docker Compose on 2 VMs is acceptable at P1) in an **India region** (data residency, NFR-CMP-06).
- 4 deployables (`core`, `channels`, `pipeline`, `web`) + managed Postgres + Redis + object storage.
- 1 GPU node (or serverless GPU) for ASR/embeddings if self-hosting IndicConformer; else Bhashini/managed API and zero GPUs at P1.
- Static public site served from CDN, generated on the fixed publication schedule.
- Estimated infra cost at pilot: **₹25k–60k/month** (estimate, verify with chosen cloud; excludes LLM/ASR API usage — see §6 cost table).

## 1.4 Trust boundaries (where security lives)

```
UNTRUSTED: citizen content (text/audio/images), news items, social posts
   → injection screening, structured-output-only model calls, no tool authority (V3)
SEMI-TRUSTED: officer inputs (authenticated but shared-device reality)
   → acceptance-signatures per action (FR-OFC-03)
TRUSTED: ops staff actions (authenticated + MFA + logged), KB curator entries (citation-mandatory)
POLITICALLY FIREWALLED: personal grievances — separate schema, non-political ops role only (V4)
```

---

# 2. End-to-end workflows

## 2.1 Citizen report (the golden path)

```
1. Citizen sends Telugu voice note + photo on WhatsApp
2. channels: webhook → media fetched+hashed → ReportReceived → ack + reference ID (≤2 min)
3. pipeline: ASR → transcript (conf ≥θ? else human transcription queue)
4. pipeline: extract → {category: "pothole", ward: 43 (from photo EXIF + text), urgency: med}
   → low-confidence field? → ONE clarifying question back on WhatsApp, else silent
5. pipeline: validate → confidence composite ≥θ → ReportValidated
6. pipeline: merge-match → cos-sim×geo×taxonomy×time vs open problems
   ├─ ≥θ_hi  → ReportMergedIntoProblem (affected_count++) → citizen told "joined problem affecting N"
   ├─ θ_lo–θ_hi → human merge queue (side-by-side UI)
   └─ <θ_lo  → ProblemCreated
7. core: lifecycle classify (rules+model propose, human confirms at P1) → GRIEVANCE
8. core: routing lookup (taxonomy×geo) → KB hit: "GVMC Zone 4 Engineering AE"
   → RoutingProposed → ops approves (P1) → AssignmentIssued → citizen notified in Telugu
9. rank engine recomputes; problem appears on MP dashboard map, ranked
```

## 2.2 Fix claim → citizen verification (the soul)

```
1. Officer (via ops at P1) claims fix + photo → FixClaimed(evidence hash-chained)
2. core: VerificationRequested → WhatsApp poll to reporter(s): "GVMC says this is fixed. Is it?"
   [✅ Fixed] [❌ Not fixed] [📷 send photo]
3a. Confirmed → resolved_verified → counts in verified-resolution stats → thank-you + rating
3b. Denied → ProblemReopened → supervisor flag → false-closure counter++ → visible on dashboard
3c. 14 days silence → resolved_unverified (NEVER counted as verified)
```

## 2.3 Safety-critical lane

```
extract stage raises SafetyFlagRaised (open transformer / sewage-in-water / collapse)
→ skips batch queues → 60s budget → ops alert (sound+push) → human confirms
→ immediate routing + phone-call-grade notification path → dashboard red banner
```

## 2.4 Routing correction → KB learning loop

```
Ops sees RoutingProposed("Zone 4 AE") but knows drain-under-road = Zone 4 + R&B shared
→ RoutingCorrected(actual, reason) → recorded as KB precedent row (source: ops decision + date)
→ next identical (taxonomy×geo) case auto-suggests the precedent
→ curator console periodically promotes precedents into first-class KB entries
```

## 2.5 Escalation ladder

```
SLA timer breach → SlaBreached → notify assignee+supervisor → level+1 per KB path
second breach → level+2 · chronic (n breaches ∨ m reopens) → SurfacedToDashboard(MLA/MP)
DISPUTE class: no SLA theater → EvidenceAppended events accumulate → export pack on demand
```

## 2.6 KB curation workflow

```
Sources: citizen charters, GOs, gazette notifications, official sites, RTI replies, ops precedents
→ curator drafts entry (citation URL/document + verified_on mandatory, else save blocked)
→ second-person review → published (versioned; old row gets valid_to)
→ staleness daemon: >180d unreviewed → curator queue; officer-transfer news → event-driven review
```

## 2.7 The monthly truth cycle (transparency)

```
Fixed calendar date → warehouse aggregates (personal data excluded at source)
→ static site regenerated: ward heat maps, verified-resolution rates, office clocks,
   ranking methodology + changelog → published automatically, no human gate (V6)
```

---

# 3. Feature catalog (by user)

**Citizen** — report in Telugu voice/text/photo on WhatsApp · reference ID + status anytime · one clarifying question max · told when their report joins a bigger problem · notified at every state change · asked to confirm every claimed fix · denial reopens visibly · personal grievances private · safety notices · (P2+) support public problems, help-desk navigation, rate resolution.

**MP / MLA / staff** — live constituency problem map (cross-district geometry) · ranked list with affected-counts · problem timelines (full evidence + history) · escalation feed · verified-resolution trends per ward/department · (P3) MPLADS pack generator with statutory clocks, brief-pack exports, dispute evidence packs.

**Ops staff** — validation / transcription / merge / routing / lifecycle queues, two-click actions · corrections become training data + KB precedents · personal-grievance queue restricted to designated role.

**Officer / supervisor (P2)** — jurisdiction-scoped queue · accept/decline-with-reason/request-info/fix-claim+photo · WhatsApp fallback flow · SLA countdowns · workload views · designation-level (not login-level) attribution.

**Corporator (P3)** — read-only ward map + statuses + stats, identical across parties.

**KB curator** — citation-mandatory CRUD · review workflow · staleness dashboard · precedent promotion.

**Public** — monthly auto-published statistics, methodology page, open-data CSV (P3).

---

# 4. Technology choices (with rationale and rejected alternatives)

| Layer | Choice | Why | Rejected & why |
|---|---|---|---|
| System of record | **PostgreSQL 16** + append-only event table | one database for events+geo+vectors = team-of-4 operable | EventStoreDB/Kafka-as-log: operational overhead unjustified at 2k/day |
| Geo | **PostGIS** | jurisdiction = polygon containment; battle-tested | separate geo service: needless hop |
| Vectors | **pgvector (HNSW)** | merge-matching inside the same DB/txn | dedicated vector DB: sync complexity |
| Queues/cache | **Redis** (streams + jobs) | one tool for jobs, rate limits, 24h-window tracking | RabbitMQ/Kafka: deferred by design (§TDD-12) |
| Media | **S3-compatible, India region** | content-hash keys give dedup+integrity free | DB blobs: bloat |
| Core/channels | **TypeScript + Fastify/NestJS** | shared types with web via shared-schema pkg | Go: fine, but splits the type system from Next.js |
| Pipeline | **Python + FastAPI workers** | ML ecosystem | TS for ML: ecosystem friction |
| Web | **Next.js + MapLibre + Tailwind** | dashboard+portal+static site in one framework; OSM tiles, no Google dependency | separate SPA+SSG stacks: more surface |
| Mobile (assisted intake, P2) | **Android/Kotlin or Capacitor PWA** | decide at P2 by offline-camera needs | — |
| ASR | **IndicConformer (MIT)** primary, **Bhashini/managed** fallback | self-hostable, 22 languages; verified open license | Whisper-only: weaker on Telugu benchmarks; commercial-only: lock-in + cost |
| LLM (extract/adjudicate) | **Managed API (Claude class), structured outputs, zero tool authority** | best code-mixed handling now; provider-swappable via ModelProvider interface | self-hosted LLM at P1: quality/ops cost |
| Embeddings | multilingual-E5-class | multilingual, cheap, local | OpenAI-only embeddings: lock-in |
| Classifier (P2+) | distilled MuRIL/IndicBERT from ops labels | 100× cheaper per report at volume | fine-tuning at P1: no labels yet |
| Auth | phone-OTP (citizens); OIDC+MFA (staff) via managed IdP | don't build auth | custom auth: never |
| Notifications | WhatsApp Cloud API (BSP) · DLT-registered SMS provider | verified pricing model; free service-window | — |
| IaC | **Terraform + Docker** | reproducible, small | raw console clicking: unauditable |

## 4.1 AI model inventory (all behind `ModelProvider`, all emitting ModelDecision)

| Stage | Model class | Gate |
|---|---|---|
| Language ID | fastText/IndicLID | — |
| ASR te/en | IndicConformer 600M / API fallback | conf<θ → human queue; read-back always |
| Extract/classify | LLM few-shot, JSON-schema output | ≥85% top-1 golden set |
| Location resolve | gazetteer + PostGIS + LLM disambiguation | conf<θ → ask citizen |
| Safety flag | rules + small classifier | recall ≥95% |
| PII detect | Indic NER + patterns | vault on detect |
| Embeddings | multilingual-E5-class | merge precision ≥95% via θ tuning |
| Image checks | pHash + EXIF consistency | flag, never auto-reject |

---

# 5. Tools (how the team of 4 actually works)

| Purpose | Tool | Notes |
|---|---|---|
| AI-assisted dev | **Claude Code** (+ Cursor/Antigravity as preferred) | CLAUDE.md in repo root encodes contracts: event schema location, "no facts from model memory," θ config paths — so AI assistants obey the architecture |
| VCS / CI | GitHub + Actions | CI = tests + **golden-set AI gates** + lint + container scan; gates block merge (NFR-AIQ-05) |
| Project tracking | GitHub Projects | issues labeled by FR ID — the FRD firewall in practice; `docs/parking-lot.md` for new ideas |
| Local env | Docker Compose (`make dev` = full stack + seeded synthetic Vizag data) | one-command onboarding |
| API contracts | OpenAPI + shared-schema package | single source of truth for events/types across TS/Py |
| Testing | Vitest (TS) · pytest (Py) · Playwright (e2e) · **k6** (load: CAP-01/02) | chaos drill scripts in repo |
| Observability | OpenTelemetry → Grafana stack (or managed) · Sentry | per-stage latency, queue depth, ₹/report meter (NFR-OPS-02) |
| Secrets | cloud KMS + secrets manager | never in repo; pre-commit secret scan |
| Eval/labeling | Label Studio (or lightweight in-house queue UI) | ops corrections auto-append to golden sets |
| Docs | ADRs in `docs/adr/` + these 11 documents | every irreversible choice = 1-page ADR |
| Design | Figma (dashboard/console mocks) · excalidraw (diagrams) | before pixels, after contracts |

---

# 6. Cost model at pilot (estimates — meter from day one)

| Item | Basis | Est./month |
|---|---|---|
| Infra (VMs/DB/Redis/storage/CDN) | §1.3 | ₹25k–60k |
| WhatsApp | most flows user-initiated (free window ✓); utility templates ₹0.115–0.145 ✓ × ~30k/mo | ₹3k–5k |
| LLM API | ~2k reports/day × ~3k tokens | ₹15k–40k (drops 100× post-distillation) |
| ASR | self-hosted GPU node OR API | ₹15k–30k |
| SMS (P2) | DLT + per-msg | ₹2k–5k |
| **Total order-of-magnitude** | | **₹60k–140k/month** ≈ ₹1–2.3/report at 60k reports/mo — inside the ≤₹10 NFR ceiling |

✓ = externally verified (2026 pricing sources in TDD §13). Everything else: engineering estimate, validated by the cost meter in week 1 of operations.

---

# 7. What this handbook deliberately repeats

The scope fence (prototype = 24 P0 FRs), the human-gate principle, and the citation-or-silence rule appear in every document on purpose: they are the three rules most likely to be eroded by enthusiasm, deadline pressure, or a helpful AI assistant generating "just one more feature." When in doubt, the FRD is the firewall and the event log is the truth.

*Companion documents: system-design-v1.0 (the why), functional-requirements-v1.0 (the what), non-functional-requirements-v1.0 (the how well), technical-design-v1.0 (the how), phases-and-prototype-v1.0 (the when).*
