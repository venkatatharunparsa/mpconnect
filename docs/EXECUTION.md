# EXECUTION — How We Build VGPS / MPconnect
*Companion to VISION.md (what/why/whom). This file: the complete how — phases, prototype, architecture, workflows, technology, tools, team, costs, and gates. Detail lives in the 12 companion documents; this is the self-contained map.*

---

## 1. The strategy in three rules

1. **Prove the soul first:** intake → merge → route → *citizen-verified closure* → dashboard. Everything else is a later layer on those pipes.
2. **Never open citizen intake where no response path exists** (the FixMyStreet law: unanswered reports destroy more trust than no platform).
3. **The FRD is the scope firewall:** no feature gets built without a requirement ID traceable to evidence. New ideas → parking lot, reviewed at phase boundaries.

## 2. Phase plan

```
PHASE 0.5 — HACKATHON PROTOTYPE (34h, Jul 2026) — Code for Communities (Google)
  "People's Priorities" PS = our system, MP-centered · 7 demo moments ·
  Gemini/Google Maps/Cloud Run edition · plan: hackathon-build-pack-v1.0.md
  If shortlisted → its repo seeds Phase 1.

PHASE 0 — RESEARCH ✅ done
  Authority KB seed (Visakhapatnam, sourced) · existing-systems study · scheme/funding
  corpus · grievance trends · pain-point fit-gap · validation vs OSS/security/product
  → 8 design amendments (G1-G8) + 8 validation amendments (V1-V8) folded into design

PHASE 1 — PROTOTYPE (≈6 weeks, team of 4)         "prove the soul on real data"
  25 P0 requirements · six-beat demo (below) · test cohort in 2-3 wards + synthetic corpus
  GATE: demo live · AI gates green · zero lost reports in chaos drill

PHASE 2 — PILOT (≈3-4 months)                      "one MP office, 3-5 wards, real citizens"
  Officer flows · full notifications · escalation · shareable problem cards · help desk
  · assisted intake · legal entity + DPIA (longest lead item — counsel starts during P1)
  · KB hardened · voice line full robustness
  GATE: ◆ checklist green · citizen-verified resolution rate being produced weekly

PHASE 3 — CONSTITUENCY (≈6 months)                 "98 wards + 7 assembly segments"
  PROJECT lifecycle full (MPLADS packs + statutory clocks) · corporator dashboards
  (all parties) · DISPUTE evidence ledger · IVR at surge scale · public transparency
  site on fixed calendar · monsoon mode
  GATE: monsoon survived · problems → sanctioned works demonstrated

PHASE 4 — EXPANSION                                "second constituency / state conversation"
  Community platform · news intelligence (human-gated) · social listening (policy-gated)
  · DIGIT interop · district sharding toward state scale
```

**Dependency logic:** the Authority KB and the AI golden sets sit on the critical path of everything — they start day 1 and never stop. The solution engine waits for P3 because it needs P2's real problem corpus. Community/news wait for P4 because they multiply trust-risk until moderation capacity exists.

## 3. The prototype (Phase 1) — exactly what and when

### 3.1 The six-beat demo (= the definition of done)
1. A Telugu **voice note on WhatsApp** becomes a structured, located, classified report in minutes.
2. **40 reports become one Master Problem** — "affects 40 citizens" — and a wrong merge is split live.
3. It **routes to the correct authority** from the sourced KB; a human correction becomes a KB precedent.
4. A fix claim triggers **citizen verification**; a denial **reopens it publicly**.
5. The **MP dashboard** shows the ranked, mapped truth.
6. A judge **dials a toll-free number**, speaks Telugu, hears the read-back, gets an ID by SMS — no smartphone, no app, no literacy. *(The closer.)*

### 3.2 Six weeks × four people
Roles: **A** core/events (TS) · **B** channels (TS) · **C** pipeline/ML (Py) · **D** web/dashboards (Next.js). All four: 30 min/day golden-set labeling from week 2.

| Wk | Build | Exit test |
|---|---|---|
| 1 | Shared-schema pkg · event store + hash chain · WhatsApp webhook→ack · ASR spike (IndicConformer vs API on 50 own Telugu clips) · dashboard shell + ward polygons *(shapefile = week-1 blocker; fallback: hand-digitize 3 wards)* | WhatsApp msg → `ReportReceived` → ID back in chat |
| 2 | Projections · media handling · slot-filling convo · LLM extract (classify/locate/urgency, structured outputs) · confidence gates · ops console v0 | voice note → transcript → classified, located report in console |
| 3 | Merge scoring (embed×geo×taxonomy×time, θ bands) · auto-merge + split · merge-review UI · KB schema + sourced pilot-ward entries | 40 pothole reports → 1 Master Problem; clean split |
| 4 | Routing lookup + ambiguity queue + precedents · GRIEVANCE state machine + SLA timers · rank v0 + ranked map · safety lane · Telugu notifications | validated problem auto-routes, ranked on dashboard, citizen notified |
| 5 | Verification loop (poll→confirm/deny/timeout→reopen) · event-timeline UI · CI eval gates · **voice thin-slice: CPaaS number → streaming ASR → same slot-filling machine → TTS read-back → ID by SMS** *(slips to wk6 before it ever threatens verification work)* | full loop: report→merge→route→claim→deny→reopen; a phone call files a report |
| 6 | 5× load test · LLM-kill chaos drill · injection suite · demo dataset + rehearsal · P2 gap memo | six-beat demo runs live |

### 3.3 Prototype gates (numbers, not vibes)
Classification ≥85% top-1 · auto-merge precision ≥95% (wrong merges destroy trust; missed merges are recoverable) · pipeline p95 ≤10 min at 5× load · safety lane ≤60 s · LLM outage degrades to human queues with **zero lost reports** · every problem shows a complete hash-chained timeline · 100% of KB entries carry source citations · ₹/report cost meter live.

## 4. Architecture (the one decision + the map)

**Everything follows from one decision: the event-sourced Problem entity.** Every module produces or consumes immutable events about one entity. Free consequences: complete audit trail, reversible merges, the dispute evidence ledger, rebuildable dashboards, replayable AI decisions, and a history nobody can rewrite.

```
CITIZEN & GOVT SURFACES: WhatsApp · voice line · SMS · web/PWA · assisted app
                         MP dashboard · ops console · officer flows · public site
        │
CHANNELS (TS): webhook adapters, conversation state machines, notifications
        │                                    WEB (Next.js): dashboards, consoles, portal
CORE (TS): append-only EVENT LOG (hash-chained) → projections (state, geo, rank, stats)
           lifecycle state machines (Grievance/Project/Dispute) · routing ← AUTHORITY KB
           SLA/escalation timers · RBAC×jurisdiction · config registry
        │
PIPELINE (Py): ASR → extract → validate → merge-match · safety lane · PII vault
               every stage: ModelDecision recorded; low confidence → human queue
        │
DATA: PostgreSQL 16 (+PostGIS geo +pgvector embeddings) · Redis queues · S3 media (India)
```

**Trust boundaries:** citizen content = untrusted (structured-output-only model calls, zero tool authority — prompt-injection is a designed-against threat) · officer input = semi-trusted (per-action signatures; shared-device reality) · personal grievances = politically firewalled (separate schema, non-political ops role only).

**Human-in-the-loop is the safety architecture:** AI narrows and structures; humans authorize merges, routings, and anything consequential; every correction becomes training data and KB precedent. No fact ever comes from model memory — authorities and schemes come only from cited registries (citation-or-silence).

## 5. Core workflows (condensed)

- **Report:** channel → ack+ID (≤2 min) → ASR/extract (below-threshold → human queue) → validate → merge-match (auto ≥θ_hi / human review / new problem) → lifecycle classify → KB routing → notify citizen → appears ranked on dashboard. p95 ≤10 min.
- **Verify (the soul):** fix claimed + photo → citizens polled on their own channel → confirmed = *resolved-verified* / denied = *reopened + false-closure counter* / 14-day silence = *resolved-unverified, never counted as success*.
- **Safety lane:** flagged report bypasses queues, 60-second budget, human alarm, priority routing.
- **KB learning:** ops corrects a routing → recorded as precedent → auto-suggested next time → curator promotes to first-class entry. Staleness daemon flags entries >180 days unreviewed.
- **Escalate:** SLA breach → +1 level (mirrors PGRS's own ladder) → chronic problems surface on MLA/MP dashboards. Disputes escalate by evidence-pack, never fake clocks.
- **Publish:** fixed calendar date → aggregates regenerate the public site automatically — no human gate, by design (neutrality is enforced by automation, not promises).

## 6. Technology & tools

| Layer | Choice | Why (one line) |
|---|---|---|
| System of record | PostgreSQL 16: append-only events + PostGIS (jurisdictions=polygons) + pgvector (merge matching) | one operable database for a team of 4; Kafka deliberately deferred |
| Services | 4 deployables: `core` (TS/Fastify) · `channels` (TS) · `pipeline` (Py/FastAPI) · `web` (Next.js + MapLibre/OSM) | one unit per person; seams for later extraction |
| ASR | AI4Bharat IndicConformer (MIT, self-hostable) + managed fallback | verified open license; Telugu WER ~30% on benchmarks → read-back confirmation is mandatory design, not optional |
| LLM | managed API, structured outputs only, zero tool authority, provider-swappable | best code-mixed extraction today; distill to fine-tuned Indic classifier at volume (100× cost drop) |
| Messaging | WhatsApp Cloud API via BSP (user-initiated window = free ✓; utility ≈ ₹0.115–0.145 ✓) · DLT-registered SMS · CPaaS voice | verified 2026 pricing; flows engineered to land in free windows |
| Auth | phone-OTP citizens · OIDC+MFA staff · designation-bound official accounts | never build auth |
| Dev | Claude Code / Cursor **with CLAUDE.md encoding the contracts** (event schema, citation-or-silence, θ config) so AI assistants obey the architecture | AI-speed development inside guardrails |
| Quality | GitHub Actions CI: tests + **golden-set AI gates block merge** · Vitest/pytest/Playwright · k6 load · chaos scripts | a model change that regresses accuracy cannot ship |
| Ops | OpenTelemetry + Grafana + Sentry · **₹/report cost meter from day one** · Terraform/Docker · India-region everything | observability and DPDP data-residency by default |

## 7. Security, privacy, compliance (the non-negotiables)

DPDP 2023: named data fiduciary + DPIA before pilot (legal workstream starts in P1 — longest lead item) · Telugu consent at first contact · PII vaulted and envelope-encrypted · personal grievances in a separate schema readable only by citizen + authorized designation + designated non-political ops role · every PII access logged · hash-chained events with daily public hash anchoring (tamper-evidence without blockchain theater) · CERT-In 6-hour breach runbook · fixed-calendar publication (anti-weaponization) · anti-gaming: geo-weighted support, velocity caps, one-voice-per-citizen · fake-media checks (pHash, EXIF-geo consistency).

## 8. Team, cost, and honesty about risk

**Team of 4** (prototype phase), one deployable each, AI-assisted development. Ops review at pilot: the team + MP-office staff; capacity math says ~100–400 master-problem events/day after dedup is sustainable.

**Cost at pilot (estimates, metered from day one):** infra ₹25–60k/mo · LLM ₹15–40k/mo (drops ~100× post-distillation) · ASR ₹15–30k/mo · WhatsApp ₹3–5k/mo → **≈ ₹1–2.3 per report**, inside the ≤₹10 ceiling.

**Top risks and their designed answers:** officials ignore it → MP sponsorship + WhatsApp zero-training fallback + public credit for verified work · political cycle kills it (AP's documented pattern) → multi-party corporator value + open data + archive that outlives regimes · Telugu ASR underperforms → read-back + human transcription queue absorb it · brigading → geo-verified identity-weighted support · state builds its own platform → our moat is the KB + verification archive, and we interop rather than compete · scope creep (our own biggest risk) → the FRD firewall and the parking lot.

## 9. What "done" looks like, phase by phase

P1: six beats run live, gates green. P2: a real citizen's real problem goes report→verified-fix, and the weekly verified-resolution rate exists for the first time in any Indian grievance system we know of. P3: an MPLADS work stands in the ground that began as merged citizen voices, and every corporator of every party checks their ward on it. P4: a second constituency asks for it — because the first one's numbers are public.

---

*Full detail: system-design-v1.0 · functional-requirements v1.3 (25 P0 / ~105 total requirements, incl. abuse defense + community gravity ladder) · non-functional-requirements-v1.0 (measurable gates) · technical-design-v1.0 (event catalog, schemas, model inventory) · architecture-workflows-tech-v1.0 (handbook) · phases-and-prototype v1.1 (week-by-week) · validation-report-v1.0 (why we believe any of this) · vizag-political-reality-v1.0 · abuse-defense-v1.0 · hackathon-build-pack-v1.0 (the immediate 34h build) · plus 5 research documents with sources.*
