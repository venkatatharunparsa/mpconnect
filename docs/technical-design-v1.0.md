# VGPS / MPconnect — Technical Design Document v1.0
*2026-07-07. Implements functional-requirements (v1.3) within non-functional-requirements-v1.0. Written for a team of 4 using AI-assisted development. Central architectural decision: the event-sourced Problem entity.*

> **Hackathon-edition variance (Jul 2026):** the P0.5 hackathon build (hackathon-build-pack-v1.0.md) intentionally substitutes Google-stack equivalents — Gemini multimodal/Live/embeddings for the LLM+ASR+embedding stages, Google Maps for MapLibre, Cloud Run deploy, simplified event log without the projector framework. These are demo-context choices behind the same adapter interfaces; the production choices below stand unchanged for P1+.

## 1. The one decision everything follows from

**Every module is a producer or consumer of events on one entity: the Problem.** No module holds private problem state. Consequences we get for free: complete audit trail (NFR-SEC-05), reversible merges (FR-MPE-03), the DISPUTE evidence ledger (FR-LCM-04), rebuildable projections (NFR-MNT-02), replayable AI decisions (FR-UND-07), and honest history (nobody can rewrite the past — G3 enforced by physics of the design).

```
                      ┌──────────────────────────────┐
   producers ───────► │  EVENT LOG (append-only)     │ ◄─────── producers
   intake, pipeline,  │  problem_events              │  ops console, officer
   routing, verifier  │  hash-chained per problem    │  console, escalator
                      └──────────────┬───────────────┘
                                     │ (async projectors)
        ┌──────────────┬─────────────┼──────────────┬───────────────┐
        ▼              ▼             ▼              ▼               ▼
  problem_current   geo_index    rank_scores   stats_warehouse   notification
  (state proj.)    (PostGIS)    (projection)   (aggregates)       outbox
```

## 2. Event catalog (v1 — the system's vocabulary)

```
Intake:        ReportReceived, ReportAcknowledged, MediaAttached, TranscriptProduced,
               ExtractionCompleted, SafetyFlagRaised
Validation:    ReportValidated, ReportRejected(reason), DuplicatePersonCollapsed
Problem:       ProblemCreated, ReportMergedIntoProblem, ProblemSplit,
               LifecycleClassified(class, by), AffectedCountRecomputed
Routing:       RoutingProposed(kb_entry, confidence), RoutingApproved(by),
               RoutingCorrected(by, becomes KB precedent), AssignmentIssued,
               AssignmentAccepted(signature), AssignmentDeclined(reason)
Progress:      StatusUpdated, InfoRequested, FixClaimed(evidence),
               MilestoneReached(project), FundingMapped(scheme_ref),
               RecommendationFiled(mplads_pack, clock_start),
               Deprioritized(reason ─ mandatory), EvidenceAppended(dispute)
Verification:  VerificationRequested, VerificationConfirmed, VerificationDenied(evidence),
               VerificationTimedOut, ProblemReopened
Escalation:    SlaBreached, Escalated(level), SurfacedToDashboard(mp|mla|corporator)
Community:     SupportAdded(geo_check), CommentPosted, ModerationApplied
Meta:          ModelDecisionRecorded (parallel stream, references problem events)
```
Rules: events are immutable; corrections are new events; every event carries `actor{human|model|system}`, `occurred_at`, `prev_hash`. Schema versioned per event type; consumers tolerate unknown fields.

## 3. Storage layer

- **PostgreSQL 16** — one instance at pilot (managed, India region):
  - `problem_events` (append-only; BRIN on time, index on problem_id) — system of record.
  - Projections: `problem_current`, `report`, `citizen`, `assignment`, `rank_score` — rebuildable.
  - **PostGIS**: ward/secretariat/zone/constituency polygons; reports and problems carry geography; `ST_Contains` drives jurisdiction resolution (FR-UND-03) and geo-weighted support (FR-RNK-01).
  - **pgvector**: report/problem embeddings for merge candidate search (cosine, HNSW index).
  - `authority_kb`, `scheme_corpus` — versioned rows (valid_from/valid_to, source_url, verified_on), never hard-deleted.
- **Object storage (S3-compatible, India)**: media keyed by content hash (dedup + integrity in one move); lifecycle rules per retention schedule.
- **Redis**: job queues (see §5), rate limits, session cache, WhatsApp 24h-window tracker (NFR-OPS-02 cost optimization).
- Kafka is **deliberately absent** at pilot scale — Postgres LISTEN/NOTIFY + Redis streams carry 2k reports/day × 5 surge easily; the event-log design means swapping the transport later doesn't change semantics (NFR-CAP-03).

## 4. Services (modular monolith, 4 deployable units)

| Unit | Owner-shaped | Contents |
|---|---|---|
| `core` (TypeScript, NestJS or Fastify) | 1 dev | Event store API, projections, routing engine, lifecycle state machines, escalation timers, notification outbox, RBAC/ABAC, admin config |
| `channels` (TypeScript) | 1 dev | WhatsApp webhook adapter, SMS gateway adapter, web/PWA API (tRPC/REST), IVR adapter (P2), officer WhatsApp flow |
| `pipeline` (Python, FastAPI + workers) | 1 dev | ASR, classification, location resolution, embeddings, merge candidate scoring, safety classifier, PII detection, LLM orchestration — all stages emit ModelDecision events |
| `web` (Next.js) | 1 dev | Citizen portal/PWA, MP/staff dashboard, ops console, officer console, KB curator console, public transparency site (static-generated) |

Interfaces between units = the event log + a thin internal HTTP API. Any unit can be re-written without touching others (NFR-MNT-04).

## 5. Pipeline design (Python workers)

```
ReportReceived ──► q:transcribe ──► q:extract ──► q:validate ──► q:match ──► routed/queued
   (audio only)      (ASR)          (LLM/clf)      (rules+clf)    (vector+geo)
Safety path: extract stage raises SafetyFlagRaised → priority lane, 60s budget (NFR-PER-03)
Every stage: confidence < θ → corresponding human queue (never guess, never drop)
```

**Model choices (v1, all swappable behind a `ModelProvider` interface):**
- **ASR:** AI4Bharat **IndicConformer** (MIT-licensed, 22 Indian languages, self-hostable on one GPU) as primary; managed API (e.g., Bhashini) as fallback. Design accepts reality: Telugu WERs on public benchmarks run ~30% — hence mandatory read-back confirmation (FR-INT-03/NFR-AIQ-03) and human transcription queue. Store audio always; transcripts are re-derivable as models improve.
- **Classification & extraction:** start with **LLM few-shot + structured outputs** (fast to ship, good on code-mixed text), collect ops-validated labels, then distill to a fine-tuned Indic encoder (MuRIL/IndicBERT class) when volume justifies (cost path per NFR-OPS-02).
- **Embeddings:** multilingual sentence embedding model (e.g., multilingual-E5 class) for merge matching; image pHash for evidence dedup (FR-UND-06).
- **LLM usage rules (V3, FR-UND-08):** structured-output JSON schemas only; citizen text enters prompts as fenced data, never as instructions; no tool access in content-processing calls; injection screening pre-stage; all outputs validated against schema before entering the event log.
- **Merge scoring:** `score = w_t·cos(text_emb) + w_g·geo_decay(dist) + w_c·same_taxonomy + w_i·image_sim + w_τ·time_decay` — thresholds θ_lo/θ_hi tuned on the golden set to hit auto-merge precision ≥95% (NFR-AIQ-02); between-thresholds → human merge queue.

**Golden sets (NFR-AIQ-05):** built during prototype from ~500 hand-labeled real/realistic Vizag reports (taxonomy seeded from FS field-study categories); CI runs evals on every change; gates block deploys.

## 6. Channel integrations (verified facts marked ✓)

- **WhatsApp Business Cloud API** via a BSP: user-initiated service window (24h) is free ✓; business-initiated utility templates ≈ ₹0.115–0.145/msg in India (2026, per-template-message billing ✓ — [pricing sources](https://www.uptail.ai/blog/whatsapp-business-api-pricing-2026-what-it-costs-and-how-billing-works)). Design: drive verification polls and status updates to land inside open service windows where possible; template catalog kept minimal and versioned (FR-NTF-02). Webhook idempotency keys on message IDs; media fetched and re-hosted immediately (WhatsApp media URLs expire).
- **SMS:** DLT-registered templates via Indian A2P provider; sender-ID registration is a lead-time item — start early.
- **IVR (P2):** Indian CPaaS voice API; dialogue = same slot-filling state machine as WhatsApp, TTS in Telugu.
- **Maps:** MapLibre + OpenStreetMap tiles; ward boundaries from GVMC/official shapefiles (KB acquisition item); no Google Maps dependency on citizen surfaces (cost + data terms).
- **PGRS/CPGRAMS:** no public write APIs assumed — bridge = document/ID attachment (FR-INT-10) + generated filing packs (FR-RTE-04); any deeper integration is a partnership outcome, not an engineering assumption.

## 7. Security implementation

- AuthN: phone-OTP (rate-limited, NFR-SEC-07); staff/officials OIDC + MFA; officer actions carry acceptance-signatures (FR-OFC-03) — a signed action token per accept/update, attributing to designation+person even on shared devices.
- AuthZ: policy middleware on every query — role × jurisdiction predicate compiled into SQL filters (no client-side trust); personal-grievance tables physically separate schema with restricted DB role (V4).
- PII vault: identifiers tokenized at extraction; vault table encrypted (KMS envelope); PII reads emit audit events.
- Hash chain: `event.prev_hash = H(prev_event)` per problem stream; nightly anchor of the day's head hashes published to the public site (cheap tamper-evidence without blockchain theater).
- Backups: PITR + daily snapshot, restore-tested quarterly (NFR-OPS-04).

## 8. Ranking & escalation implementation

- Rank recompute: event-triggered incremental + nightly full pass; formula/weights in versioned config (FR-ADM-02) rendered on the public methodology page (FR-RNK-02).
- Seasonal multiplier: config table keyed by taxonomy × month, seeded from monsoon calendar; prior-year hotspot layer = warehouse query, not ML, at P1 (G7 honestly cheap).
- Escalation timers: durable scheduled jobs derived from SLA table; breach emits `SlaBreached` → notification + escalation per KB path; all idempotent (safe re-runs).

## 9. Dashboards & transparency implementation

- MP/staff dashboard: Next.js + MapLibre reading projections (no direct event-log queries); problem drill-down renders the event stream as a human-readable timeline (the audit trail *is* the UI).
- Corporator view: same components, jurisdiction-filtered, read-only role (G8/FNI-01 = a permissions row, not a new app).
- Public site: static-generated on the fixed publication schedule (V6 — automation *is* the neutrality control); aggregates only, computed in the warehouse with personal data excluded at source.

## 10. Testing & release strategy

1. **Unit + property tests** on state machines (lifecycle transitions are pure functions — exhaustively testable).
2. **Golden-set AI gates in CI** (NFR-AIQ-05): classification, merge, safety, ASR-confidence calibration.
3. **Synthetic Vizag dataset** (generated + hand-curated, Telugu/code-mixed, seeded from FS categories) for staging and load tests (NFR-CAP-01/02 via k6).
4. **Chaos drills:** kill LLM provider mid-load (must degrade to queues, NFR-AVL-02); WhatsApp webhook replay storm (idempotency); restore-from-backup.
5. **Release:** trunk-based, feature flags, one-command deploy, staged rollout (staff → friendly ward → pilot wards).

## 11. Repository & delivery layout

```
mpconnect/
  core/          channels/        pipeline/        web/
  packages/shared-schema/   (event types, taxonomy, config schemas — single source of truth)
  infra/         (IaC: one Postgres, Redis, object store, container runtime, India region)
  evals/         (golden sets + CI gates)     docs/  (these documents, ADRs)
```
ADR discipline: every irreversible choice (event schema, KB model, provider contracts) gets a one-page Architecture Decision Record. AI-assisted development works best against exactly this kind of explicit contract surface.

## 12. Explicitly deferred (recorded so nobody "accidentally" builds them early)

Kafka/microservices · community platform (P2) · news/social ingestion (P2, human-gated design already specified) · IVR (P2) · fine-tuned classifiers before label volume exists · DIGIT record-exchange integration (P2, standards adopted in schema now) · any blockchain (hash-chain + public anchoring suffices).

## 13. Source-verified technical facts used here

- [WhatsApp per-template pricing & free service window, India 2026](https://www.uptail.ai/blog/whatsapp-business-api-pricing-2026-what-it-costs-and-how-billing-works) · [rate tables](https://aisensy.com/pricing)
- [AI4Bharat IndicConformer — MIT-licensed 22-language ASR](https://github.com/AI4Bharat/IndicConformerASR) · [model card](https://huggingface.co/ai4bharat/indic-conformer-600m-multilingual) · Telugu WER ~30% class on public benchmarks ([agricultural-context ASR benchmark](https://arxiv.org/pdf/2602.03868))
- [DIGIT PGR data-model standards (adopted for interop)](https://standards.digit.org/public-grievance-redressal-module-standards/pgr-data-modelling-standards)
- GVMC taxonomy seed categories: eGov/CEPT field study (see validation-report-v1.0 sources)
