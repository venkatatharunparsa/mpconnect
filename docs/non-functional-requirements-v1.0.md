# VGPS / MPconnect — Non-Functional Requirements v1.0
*2026-07-07. All numbers are engineering targets set by us (not external facts); each carries its rationale. Targets marked ◆ are pilot-gate criteria — the pilot does not launch until they're met.*

## 1. Performance & latency

**NFR-PER-01 (P0)** Intake acknowledgment (message received → reference ID returned): **p95 ≤ 2 min**, p99 ≤ 5 min. *Rationale: WhatsApp-conversation expectations; also keeps replies inside the free 24h service window.*
**NFR-PER-02 (P0)** Full pipeline (report → routed or human-queued): **p95 ≤ 10 min** for high-confidence items. *Rationale: same-day routing is the visible difference from the status quo.*
**NFR-PER-03 (P0)** Safety-flagged reports: pipeline **p95 ≤ 60 s** + immediate ops alert. *Rationale: open-transformer/sewage class incidents.*
**NFR-PER-04 (P1)** Dashboard interactions: p95 ≤ 2 s for map/list views at 10k open problems.
**NFR-PER-05 (P1)** Status lookup by reference ID: p95 ≤ 3 s end-to-end on WhatsApp.

## 2. Capacity & scalability

**NFR-CAP-01 (P1)** Sustained load: **2,000 reports/day** city-wide without degradation. ◆
**NFR-CAP-02 (P1)** Monsoon surge: **5× sustained load for 14 consecutive days** with NFR-PER-01 held; backlog drain ≤ 48h after surge. *Rationale: documented seasonality (G7).* ◆
**NFR-CAP-03 (P2)** Architecture shall scale to state level (~10⁶ reports/day) by district-sharding without redesign of the event store or KB model.
**NFR-CAP-04 (P1)** Media storage plan: ≥ 1 image per report average, 2 MB median — ~4 GB/day at pilot sustained load; retention per NFR-CMP-04.

## 3. Availability & resilience

**NFR-AVL-01 (P1)** Intake plane availability: **99.5% monthly** (≈3.6h downtime budget). Intake is the trust surface; dashboards may tolerate 99%.
**NFR-AVL-02 (P1)** Channel independence: failure of any one channel (WhatsApp API outage, LLM API outage) shall not block others; LLM outage degrades to human queues, never drops reports. ◆
**NFR-AVL-03 (P1)** Durability: no accepted report may ever be lost — write-ahead persistence before acknowledgment; RPO ≤ 15 min, RTO ≤ 4 h.
**NFR-AVL-04 (P2)** Cyclone posture: SMS+IVR remain operable when data networks degrade; static status page on independent infrastructure.

## 4. Accuracy & AI quality (gates, not aspirations)

**NFR-AIQ-01 (P0)** Classification: ≥ **85% top-1** on the Vizag golden set before auto-classification; below-threshold → human. ◆
**NFR-AIQ-02 (P0)** Auto-merge precision ≥ **95%**; merge recall is sacrificial (missed merges are recoverable, wrong merges destroy trust). ◆
**NFR-AIQ-03 (P0)** ASR: readback-confirmation required before submission when word-level confidence < θ; uncorrected-transcript submission rate target < 5%. *Rationale: Telugu WER ~30% on public benchmarks — we design for the error rate we actually have.*
**NFR-AIQ-04 (P1)** Safety classifier: recall ≥ 95% on the safety golden set (precision sacrificial — false alarms are reviewable).
**NFR-AIQ-05 (P0)** Every AI stage has a golden-set eval that runs in CI; any model/prompt change that regresses a gate blocks deploy. ◆
**NFR-AIQ-06 (P1)** Routing correctness: ≥ 90% of routings accepted without reassignment after month 2 (measures KB quality; FS baseline: misrouting was the #1 documented failure).

## 5. Security

**NFR-SEC-01 (P0)** All citizen content treated as untrusted model input: structured-output contracts; models processing raw content have no tool/action authority (V3).
**NFR-SEC-02 (P1)** AuthN: OTP for citizens; MFA for staff/officials; designation-bound official accounts; session and key rotation policies.
**NFR-SEC-03 (P1)** AuthZ: RBAC × jurisdiction ABAC enforced server-side on every read; personal grievances readable only by citizen + authorized designation + designated ops role (V4); every PII read logged.
**NFR-SEC-04 (P1)** Encryption in transit (TLS 1.2+) and at rest; PII envelope-encrypted with KMS; secrets in a managed vault, never in repos.
**NFR-SEC-05 (P1)** Evidence integrity: media hashed at ingest; state events hash-chained; DISPUTE export packs carry verifiable digests.
**NFR-SEC-06 (P2)** Annual penetration test; dependency and container scanning in CI; vulnerability disclosure policy published.
**NFR-SEC-07 (P1)** Abuse resistance: per-number rate limits, OTP throttling, media-size caps, injection-pattern screening at intake.

## 6. Privacy & compliance (DPDP Act 2023)

**NFR-CMP-01 (P1)** Named data fiduciary established before pilot (legal entity decision = pre-pilot blocker, V5); privacy notice and consent in Telugu + English at first contact; separate consent for public visibility of report content.
**NFR-CMP-02 (P1)** Purpose limitation: grievance data never used for electoral targeting; enforced by role design (V4) + audit + published policy.
**NFR-CMP-03 (P1)** Data-principal rights: access, correction, erasure (de-attribution from statistics, not falsification of counts); grievance narratives treated as sensitive-by-default (may reveal caste/health).
**NFR-CMP-04 (P1)** Retention schedule published: media 3 years, transcripts 5 years, aggregate statistics indefinite, vault purge on withdrawal where lawful. (Targets — confirm with counsel.)
**NFR-CMP-05 (P1)** Breach runbook aligned to CERT-In 6-hour reporting; DPIA completed before pilot. ◆
**NFR-CMP-06 (P1)** Data residency: all storage and processing in India regions; DLT-registered SMS templates; WhatsApp BSP contract with India data terms.

## 7. Fairness, neutrality & integrity

**NFR-FNI-01 (P1)** Ranking formula, weights, and changes published with changelog (FR-RNK-02); identical data served to all parties' officeholders. ◆
**NFR-FNI-02 (P1)** Publication automation: public statistics released on a fixed calendar with no discretionary gate (V6).
**NFR-FNI-03 (P1)** Verified-resolution statistics shall be computed identically across wards/departments; no manual overrides of computed statistics, ever.
**NFR-FNI-04 (P2)** Quarterly bias audit: intake and resolution rates examined across ward income profiles (civic-tech skews toward the connected — FixMyStreet evidence; we measure instead of assuming).

## 8. Accessibility, language & inclusion

**NFR-ACC-01 (P0)** Telugu is a first-class language on every citizen surface (input, output, notifications, IVR). English co-equal; code-mixed input handled. *(FS: language decided platform adoption.)*
**NFR-ACC-02 (P1)** Voice-first parity: every citizen-facing task completable without literacy (voice in, voice/read-back out) on WhatsApp and IVR.
**NFR-ACC-03 (P1)** Web surfaces meet WCAG 2.1 AA; PWA functions on ₹8k-class Android and 3G-grade connectivity; per-page payload ≤ 500 KB on citizen surfaces.
**NFR-ACC-04 (P1)** Non-smartphone floor: complete report + track + verify journey possible via SMS+IVR only.

## 9. Usability & adoption

**NFR-USE-01 (P1)** First-time citizen completes a report on WhatsApp in ≤ 3 minutes, ≤ 6 interactions, no instructions.
**NFR-USE-02 (P1)** Officer actions (accept, update, fix-claim) each ≤ 3 taps on mobile; WhatsApp officer fallback requires zero training.
**NFR-USE-03 (P1)** Ops review actions ≤ 2 clicks with full context visible; reviewer throughput target ≥ 60 items/hour at steady state.

## 10. Operability & observability

**NFR-OPS-01 (P1)** End-to-end tracing per report (channel → pipeline stages → routing → notification); per-stage latency and queue-depth dashboards; alerting on gate breaches.
**NFR-OPS-02 (P1)** Cost telemetry per report (ASR seconds, LLM tokens, messages sent) from day one (V8); monthly unit-cost report. Target: **≤ ₹10/report** all-in AI+messaging at pilot scale; expected typical flow is lower (user-initiated WhatsApp service window = ₹0 messaging; utility template ≈ ₹0.115–0.145 when we must initiate — verified 2026 pricing).
**NFR-OPS-03 (P1)** Config-not-code (taxonomy, SLAs, thresholds, weights) hot-reloadable with audit trail (FR-ADM-02).
**NFR-OPS-04 (P2)** Chaos drill twice yearly: monsoon-surge simulation + LLM-outage degradation + restore-from-backup.

## 11. Maintainability & team-of-4 reality

**NFR-MNT-01 (P0)** Single deployable modular monolith at P0/P1; service extraction only at documented seams; no microservice before its queue depth demands it.
**NFR-MNT-02 (P0)** Event-sourced core: any projection rebuildable from the event log; schema migrations never rewrite events.
**NFR-MNT-03 (P1)** CI: tests + AI gates + scans on every merge; one-command deploy; staging env with synthetic Vizag dataset.
**NFR-MNT-04 (P1)** Every module ownable by one person with a documented runbook; bus-factor ≥ 2 on intake and event store.

## 12. Verification of these NFRs

Each ◆ target has a named test in the pilot-gate checklist: load test (CAP-01/02), chaos test (AVL-02), golden-set CI (AIQ-01/02/05), DPIA + counsel sign-off (CMP-05), neutrality review (FNI-01). The pilot launches when the checklist is green — not before.
