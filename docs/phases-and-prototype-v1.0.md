# VGPS / MPconnect — Phase Plan & Prototype Build Spec v1.1
*2026-07-07. Narrows system-design-v1.0 through the FRD's P0 contract into buildable work for a team of 4. Governing law (from validation): never open citizen intake where no response path exists; prove dedup + verified closure + one dashboard before anything else.*
*v1.1 amendments: toll-free voice agent thin-slice promoted into the prototype (demo beat 6); shareable problem cards added to P2; proactive-identity note added.*

**Proactive identity note:** the system is "proactive mostly, reactive at its best" from day one — but proactivity starts from *our own consented data* (trend engine, recurrence detection, monsoon-mode hotspot forecasts), not from scraping. News/social ingestion remains P2/P4, human-gated. Say it this way in every pitch.

---

## Part 1 — Phase decomposition

```
P0 RESEARCH ✅ (done)
   ↓
P0.5 HACKATHON PROTOTYPE (34h, Jul 7-8 2026) — Code for Communities (Google×hack2skill)
   "People's Priorities" PS · 7 demo moments · Gemini/Google Maps edition
   → see hackathon-build-pack-v1.0.md · if shortlisted, output becomes P1's seed repo
   ↓
P1 PROTOTYPE (≈6 weeks)            "Prove the soul on real data"
   intake→understand→merge→route→verify→dashboard, 24 P0 requirements
   ↓ gate: demo + AI gates green on golden set
P2 PILOT (≈3-4 months)             "One MP office, 3-5 wards, real citizens"
   + officer flows, notifications full, escalation, help desk, KB hardening,
     DPIA/legal entity, assisted intake, public stats page
   ↓ gate: ◆ checklist green + citizen-verified resolution rate being produced
P3 CONSTITUENCY (≈6 months)        "All 98 wards + 7 segments"
   + PROJECT lifecycle full (MPLADS packs), corporator dashboards,
     DISPUTE ledger, IVR, surge readiness, transparency site
   ↓ gate: monsoon survived, funding conversions demonstrated
P4 EXPANSION                        "Second constituency / state conversation"
   + community layer, news intake (human-gated), DIGIT interop, district sharding
```

**Dependency logic:** the Authority KB and golden set are on the critical path of everything — they start day 1 of P1 and never stop. The solution engine waits for P3 because it needs P2's real problem corpus to recommend against. Community/news wait for P4 because they're trust-risk multipliers until moderation capacity exists.

**Standing rule carried between phases:** any feature request not traceable to an FR ID gets an ADR + FRD amendment first. The FRD is the scope firewall.

---

## Part 2 — Prototype specification (P1, 6 weeks)

### 2.1 What the prototype must prove (and nothing else)

1. A Telugu voice note on WhatsApp becomes a structured, located, classified report in minutes. *(the intake magic)*
2. 40 reports about the same pothole become **one Master Problem showing "affects 40 citizens"** — with a wrong-merge split demonstrated live. *(the intelligence)*
3. The problem routes to the correct authority from the KB — and a human correction becomes a KB precedent. *(the routing truth)*
4. A fix claim triggers citizen verification; a denial reopens it publicly. *(the soul — the anti-false-closure loop)*
5. The MP dashboard shows the ranked, mapped truth of the pilot wards. *(the unserved user, served)*
6. **A judge dials a toll-free number from their own phone, speaks Telugu, hears their problem read back, and receives a reference ID by SMS — no smartphone, no app, no literacy required.** *(the reach thesis, live)*

Demo storyline for judges/MP office = exactly these six beats, in order, live, on a phone + a screen. Beat 6 is the closer: it lands hardest with anyone who has a parent or grandparent in mind.

### 2.2 Scope fence

| In (24 P0 FRs) | Out (deferred, listed so they stay out) |
|---|---|
| WhatsApp intake (text/voice/image/location, te+en) | SMS, web *submission* (web = tracking only) |
| **Voice line thin-slice: one toll-free number, Telugu slot-filling, read-back, ID by SMS** | full IVR (DTMF status, callback polls, surge, dialects) |
| ASR + classification + location + safety flag + confidence gates | fine-tuned models (LLM few-shot only) |
| Validation queue, merge engine + review queue, split | community features, support/upvotes |
| GRIEVANCE lifecycle full; PROJECT/DISPUTE as *labels* with holding states | full PROJECT milestones, MPLADS packs, DISPUTE export |
| KB for pilot wards (sourced, versioned) + routing + precedent capture | full-district KB, transfer monitoring automation |
| Verification poll on WhatsApp + reopen | quorum sampling (single-reporter confirm is enough) |
| Rank score v0 (documented formula) | seasonal multipliers, equity weights (config stubs exist) |
| MP/staff dashboard + ops console (4 queues) | officer console (fix claims entered by ops staff at P1), corporator view |
| Reference IDs, status lookup, Telugu notifications on state changes | digests, DLT SMS |
| Event store + hash chain + ModelDecision records | public anchoring, warehouse, transparency site |

**Data reality at P1:** no real MP office yet — so intake runs with a **test cohort** (team + friendly residents in 2–3 wards, e.g., one MVP-Colony-class and one Gajuwaka-class ward) + a **synthetic corpus** (~500 hand-curated Telugu/code-mixed reports seeded from the field study's real GVMC categories). Real citizens' reports get responses from *us* acting as the ops layer — nobody is promised government action yet (the FixMyStreet trust law, honored).

### 2.3 Build plan — 6 weeks × 4 people

Roles: **A** = core/events (TS) · **B** = channels (TS) · **C** = pipeline/ML (Py) · **D** = web/dashboards (Next.js). Everyone: golden-set labeling 30 min/day from week 2.

**Week 1 — skeleton + contracts.**
Shared-schema package (event types, taxonomy from FS categories, config). Event store with hash chain + projections scaffold (A). WhatsApp Cloud API test number webhook echo→ack with reference ID (B). ASR spike: IndicConformer hosted vs Bhashini API — pick by WER on 50 self-recorded Telugu clips (C). Dashboard shell + map with ward polygons (D — sourcing GVMC ward shapefile is a week-1 blocker item; fallback: digitize 3 pilot wards by hand).
*Exit: a WhatsApp message produces `ReportReceived` and an ID lands back in chat.*

**Week 2 — the pipeline spine.**
Projections: problem_current, report (A). Media handling, slot-filling conversation (B). Extract stage: LLM structured-output classify+locate+urgency; ModelDecision records; confidence gates → queues (C). Ops console v0: validation + transcription queues (D).
*Exit: voice note → transcript → classified, located report visible in ops console.*

**Week 3 — the heart: merge.**
Merge scoring (embedding+geo+taxonomy+time), θ bands, auto-merge events, split operation (C+A). Merge-review UI side-by-side (D). KB schema + curator entry of pilot-ward authorities from sourced research (B builds, all contribute entries).
*Exit: 40 synthetic pothole reports → 1 Master Problem, affected_count=40; wrong merge split cleanly.*

**Week 4 — routing + lifecycle + rank.**
Routing lookup + ambiguity queue + precedent capture (A). GRIEVANCE state machine + SLA timers (A). Rank v0 + ranked list/map on dashboard (D). Safety lane end-to-end (C). Notification outbox → WhatsApp state-change messages in Telugu (B).
*Exit: validated problem auto-routes, appears ranked on dashboard, citizen notified.*

**Week 5 — the soul: verification + the voice line.**
Fix-claim entry in ops console; VerificationRequested → WhatsApp poll → confirm/deny/timeout paths; reopen flow + dashboard "reopened" badge (B+A+D). Problem timeline view — the event stream rendered as the audit UI (D). Golden-set eval harness in CI with gates (C). **Voice thin-slice (B+C): CPaaS number → streaming ASR → the same slot-filling state machine as WhatsApp → TTS read-back → ReportReceived → ID by SMS.** The voice line is deliberately a *fifth adapter on existing pipes*, not a new subsystem — if it threatens the verification work, it slips to week 6, never the reverse.
*Exit: full loop demo-able: report → merge → route → fix claim → citizen denies → reopens; a phone call produces a validated report.*

**Week 6 — hardening + demo.**
Load test at 5× target; LLM-outage chaos drill (degrade to queues); injection test suite on intake; polish the five-beat demo; seed realistic demo dataset; rehearse. Write the P2 gap memo (what broke, what the pilot needs).
*Exit: demo + AI gates green + honest gap memo.*

### 2.4 Prototype exit criteria (gates, not vibes)

1. Six-beat demo runs live without hand-waving (beat 6 may run on a staged number if CPaaS onboarding lags — stated honestly, never faked).
2. Golden set: classification ≥85% top-1; auto-merge precision ≥95% (NFR-AIQ-01/02).
3. Pipeline p95 ≤10 min at 5× load; LLM-kill drill degrades to queues with zero lost reports (NFR-AVL-02/03).
4. Every problem shows a complete, hash-chained, human-readable timeline.
5. KB: 100% of pilot-ward entries carry source citations; ≥1 routing correction captured as precedent.
6. Cost telemetry reporting ₹/report (NFR-OPS-02).

### 2.5 Honest risk register for these 6 weeks

| Risk | Response |
|---|---|
| Telugu ASR worse than benchmarks on real voice notes | Read-back confirmation absorbs error; human transcription queue is not optional; measure WER weekly on our own clips |
| Ward shapefiles unobtainable quickly | Hand-digitize 3 pilot wards (hours, not days); file the formal request in parallel |
| WhatsApp test-number limits (recipient caps) | Test cohort registered as test users; BSP onboarding started week 1 for P2 (lead-time item) |
| Merge precision below gate | Ship with θ_hi raised (more human review, zero wrong merges) — the queue IS the fallback |
| Scope creep (the 10-ideas-per-day pattern) | FRD firewall rule + this scope fence; new ideas → `docs/parking-lot.md`, reviewed at P2 planning |

### 2.6 What P2 immediately adds (so the prototype is built with sockets for it)

Officer WhatsApp flow (fix claims stop being ops-entered) · real BSP number · DPIA + legal entity (V5 — start counsel conversation during P1, it's the longest lead item) · assisted-intake app · escalation engine · full notifications · **shareable problem cards (FR-CTZ-05) — the distribution engine: every public Master Problem becomes a forwardable WhatsApp card; the arguing energy stays in citizens' own groups and every tap recruits a verified supporter** · full voice line robustness · pilot-ward KB → district KB · the MP-office conversation with the six-beat demo as the pitch.

---

*Document set complete: research (5) → system-design → validation → FRD/NFR/TDD → this. The next artifact is code.*
