# VGPS / MPconnect — Full Production System Design v1.0
*The complete end-state design. Phasing and prototype narrowing come after this document, not inside it.*
*Grounded in Phase 0 research: authority-kb, existing-systems-study, scheme-funding-corpus, grievance-trends, vizag-pain-points-fitgap (G1–G8 incorporated throughout).*

---

## 1. Design principles (non-negotiable)

1. **Truth over throughput.** The system never fakes progress. Status reflects verified reality; "resolved" means citizen-confirmed. (Attacks PP8: 90%-resolved/78%-dissatisfied gap.)
2. **One problem, one record.** Duplicates merge into Master Problems; the affected-population count is the system's atomic unit of political weight.
3. **AI proposes, humans dispose.** Every consequential action (merge, route, close, escalate, publish) has a human owner and an audit trail. AI output is advisory and labeled as such.
4. **Facts only from the KB, never from model memory.** Authorities, schemes, eligibility, SLAs come from versioned, sourced registries. LLMs orchestrate and summarize; they do not recall.
5. **The weakest citizen is the design floor.** Telugu voice note on WhatsApp, assisted intake at a secretariat, or a plain SMS must be full-power inputs (G6).
6. **Not every problem is a pothole.** Three lifecycle classes — Grievance, Project, Dispute — with honest, different state machines (G1).
7. **Privacy split at the root.** Public problems are public; personal grievances are encrypted, access-controlled, invisible to community features.
8. **Every stakeholder gains by using it.** Citizen gets truth; officer gets a cleaner queue + proof of work; corporator gets ward data (G8); MLA/MP get constituency intelligence; Collector gets early warning. Adoption is engineered through aligned incentives, not mandates.

## 2. Actors and their clients

| Actor | Client surface | Core job-to-be-done |
|---|---|---|
| Citizen | WhatsApp bot (primary), web portal, SMS, IVR voice line, ward-secretariat assisted kiosk | Report, track, confirm/deny resolution, support & discuss public problems |
| Reporter-anonymous (G2) | Same channels, identity withheld | Report sensitive issues (pollution, encroachment) without exposure |
| Ward Secretariat functionary | Assisted-intake app (Android-first) | File on behalf of citizens; field-verify problems; receive routed work |
| Government officer (GVMC dept, Tahsildar, line dept, APEPDCL…) | Officer console (web + Android) | Work queue, accept/act/update, request info, mark fixed with evidence |
| Supervisor (Zonal Commissioner, RDO, HoD) | Same console, supervisor views | SLA monitoring, reassignment, escalation handling |
| District Collector | District command dashboard | Cross-department view, Monday-PGRS prep, early warnings |
| Corporator / ward member (G8) | Ward dashboard (read-heavy, mobile) | Ward problem map, status, evidence for council questions |
| MLA | Constituency dashboard | Segment-level priorities, escalations, project tracking |
| MP (pilot sponsor) | Constituency command center | Cross-district (LS constituency) view, MPLADS pipeline, parliament-question evidence packs |
| MP/MLA office staff | Ops console | Human-in-the-loop review: validation, merge approval, routing approval, moderation |
| Platform admin / KB curator | Admin console | Authority KB maintenance, scheme corpus updates, taxonomy, model thresholds |
| Auditor / researcher / press | Public transparency site | Aggregate statistics, office-level clocks (G4), open data exports |

## 3. High-level architecture

```
┌────────────────────────────  INTAKE PLANE  ────────────────────────────┐
│ WhatsApp Business API │ Web/PWA portal │ SMS gateway │ IVR/voice bot   │
│ Assisted-intake app │ News ingestor │ Social listener │ PGRS/CPGRAMS   │
│                                                        bridge (import) │
└───────────────┬────────────────────────────────────────────────────────┘
                ▼
┌──────────────────────────  UNDERSTANDING PLANE  ───────────────────────┐
│ Media pipeline (ASR Telugu/Hindi/En, OCR, image tagging, EXIF/geo)     │
│ NLU pipeline: language ID → translate → classify (taxonomy) →          │
│ location resolution → entities → urgency/severity → PII detect →       │
│ confidence scoring                                                     │
└───────────────┬────────────────────────────────────────────────────────┘
                ▼
┌──────────────────────────  INTELLIGENCE PLANE  ────────────────────────┐
│ Validation engine (spam/fraud/dup) │ Master Problem engine (merge)     │
│ Lifecycle classifier (Grievance/Project/Dispute) │ Ranking engine      │
│ Routing engine ◄── AUTHORITY KB │ Solution engine ◄── SCHEME CORPUS    │
│ Escalation engine │ Trend & season engine │ Anti-gaming engine         │
└───────────────┬────────────────────────────────────────────────────────┘
                ▼
┌──────────────────────────  ACTION PLANE  ──────────────────────────────┐
│ Human review queues (ops console) │ Assignment & work orders           │
│ Officer console │ Verification loop │ Notification engine              │
│ Community platform │ Help-desk assistant │ Dashboards & heat maps      │
│ Evidence ledger (append-only) │ Public transparency site               │
└─────────────────────────────────────────────────────────────────────────┘
Cross-cutting: Identity & access ▪ Audit ▪ Privacy vault ▪ Observability ▪
Model ops ▪ Data platform (warehouse + open-data exports)
```

## 4. Core data model

```
CitizenReport            -- one submission from one person via one channel
  id, channel, raw_media[], transcript, language, submitted_at
  citizen_id (nullable if anonymous; anonymity_level: none|pseudonymous|full)
  extracted{category, subcategory, location(geo+text), urgency, entities[]}
  confidence, pii_map (vaulted), status

MasterProblem            -- the atomic unit of governance intelligence
  id, title, taxonomy_code, lifecycle_class {GRIEVANCE|PROJECT|DISPUTE}
  visibility {PUBLIC|PERSONAL}
  geo_boundary (polygon), ward/mandal/segment/constituency codes
  reports[] (n:1 merge), affected_count (deduped citizens + household est.)
  evidence[] (media, hash-chained), severity, rank_score (recomputed)
  current_assignment → Authority, sla_clock / milestone_plan / case_ledger
  state (per lifecycle state machine), state_history[] (append-only)

Authority (KB)           -- versioned registry, never LLM-generated
  id, name, dept, designation_level, org {STATE|ULB|CENTRAL|PARASTATAL}
  jurisdiction (polygon/ward list/mandal list), taxonomy_codes_owned[]
  escalation_parent, contact_channels[], source_citation, verified_on,
  staleness_flag, correction_history[] (human-in-loop feedback)

Scheme (Corpus)          -- versioned, sourced
  id, name, level {CENTRAL|STATE|MPLADS|ULB}, funds, eligibility_rules,
  permissible_works[], process_clocks (e.g., MPLADS 45/75d), docs[], valid_until

Assignment / WorkOrder   -- routed unit of work with acceptance + SLA/milestones
StatusEvent              -- every transition: actor, timestamp, reason (mandatory
                            on deprioritize/reject — G3), evidence, hash-chain
Verification             -- closure claim → citizen poll → confirmed|denied|
                            unverified(timeout) ; photo optional
Community                -- per public MasterProblem: thread, supports (geo-weighted),
                            updates, moderation state
User                     -- citizen (phone-verified), official (govt-verified),
                            staff, admin; RBAC + ABAC (jurisdiction-scoped)
EscalationRule, NotificationJob, AuditRecord, ModelDecision (for every AI output:
model, version, input hash, output, confidence — replayable)
```

## 5. Intake plane — every channel, one pipeline

**5.1 WhatsApp (primary):** Business Cloud API bot. Accepts text, voice notes (Telugu/Hindi/English), images, video, live location. Conversational slot-filling only for what extraction missed ("Which area is this in?"). Returns reference ID + tracking link. Also the delivery channel for status, verification polls, and help-desk chat. GVMC itself already runs WhatsApp complaints — validated channel.
**5.2 Web/PWA portal:** full submission + tracking + public problem map + community. Works offline-first (PWA queue) for poor connectivity.
**5.3 SMS:** structured-lite ("issue + area" free text) → NLU; responses via SMS with short codes for status. For non-smartphone citizens.
**5.4 IVR voice line:** AI voice agent (Telugu-first), slot-filling dialogue, generates report + reads back summary for confirmation; DTMF fallback for status check by reference number.
**5.5 Assisted intake (G6):** Android app for ward-secretariat functionaries and MP-office field staff: file on behalf of a citizen (their phone number = their tracking identity), attach field-verification tag. Doubles as the field-verification tool for merge/dispute review.
**5.6 News ingestor:** RSS/scrape pipeline for local press (The Hindu Vizag, Eenadu, Sakshi, Yo!Vizag…) → same NLU → candidate problems flagged `source=news`, always requiring human validation before becoming/joining a Master Problem. No auto-publication.
**5.7 Social listener:** public posts mentioning tracked handles/keywords, geo-fenced. Same rule: candidates only, human-gated, weighted low by anti-gaming. (Politically sensitive — governed by policy switch; can run in "constituency office monitoring" mode only.)
**5.8 PGRS/CPGRAMS bridge:** import citizen-forwarded grievance PDFs/IDs to attach state-system history to Master Problems; export/file into CPGRAMS for central-agency problems (G5). Positioning: we *audit and coordinate* with the state system, not replace it.

## 6. Understanding plane — the AI pipeline

| Stage | Function | Approach |
|---|---|---|
| Language ID | te/hi/en/code-mixed | fastText/IndicLID class model |
| ASR | Voice → text, Telugu-first | Indic ASR (AI4Bharat/Bhashini class); human fallback queue below confidence threshold |
| OCR | Documents, letters | Indic OCR; layout-aware for govt forms |
| Image understanding | Pothole/garbage/waterlogging tagging, duplicate-image detection (pHash), EXIF geo/time | Vision model + heuristics; flags stock/old images (fraud signal) |
| Translation | Normalize to English pivot for models; preserve original for display | Indic MT |
| Classification | Taxonomy: GVMC's civic categories + revenue/land + entitlements + utilities + health + education + police + environment + central-agency | Fine-tuned Indic encoder; LLM adjudicates low-confidence |
| Location resolution | Free text ("near RTC complex Gajuwaka") → ward/secretariat polygon | Gazetteer built from GVMC ward maps + secretariat boundaries + OSM; confidence-scored |
| Urgency/severity | Safety-critical detection (open transformer, sewage in drinking water, structural collapse) → immediate-alert path | Rules + classifier; recall-biased |
| PII handling | Detect + vault personal identifiers; personal grievances fully vaulted | PII NER; envelope encryption |
| Confidence score | Composite over all stages; drives auto vs human-review path | Calibrated; thresholds tunable per category |

Every model output is a `ModelDecision` record — versioned, replayable, auditable. Threshold policy: high-confidence flows straight to intelligence plane; low-confidence to human queues. Human corrections are training data (continuous learning with human labels, no silent auto-learning).

## 7. Intelligence plane

**7.1 Validation engine.** Spam/abuse filters; fraud signals (recycled images, impossible geo/time, velocity anomalies); duplicate-person detection (same citizen, same issue, multiple channels = one voice, not three). Output: Grievance Confidence Score. Nothing is silently dropped — rejected reports get a notified reason and appeal path.

**7.2 Master Problem engine (the heart).** Candidate matching: embedding similarity (text+image) × geo proximity × taxonomy × time window. Auto-merge above high threshold; below it, human merge queue with side-by-side view. Wrong merges are reversible (split operation preserves history). Affected count = unique verified citizens + household coefficient; geo-weighted (reporter proximity matters — anti-brigading).

**7.3 Lifecycle classifier (G1).** Rules + LLM adjudication + human confirmation classify each Master Problem:
- **GRIEVANCE** → SLA state machine: `reported → validated → assigned → accepted → in_progress → fixed_claimed → citizen_verification → resolved_verified | reopened | resolved_unverified(timeout)`. SLA per taxonomy (mirrors PGRS 24h–90d norms).
- **PROJECT** → milestone machine: `identified → scoped → cost_estimated → funding_mapped (scheme corpus) → recommended (e.g., MPLADS filed, 45/75d clocks tracked) → sanctioned → tendered → executing (progress %) → delivered → citizen_verified`. No fake SLAs; honest statuses incl. `awaiting_funds (reason, since-date)` (G3).
- **DISPUTE** → case ledger: no closure promise; append-only evidence timeline (every complaint, response, inspection, media report), authority-response log with response-time clocks, `export_pack` generator (RTI-ready, court-ready, parliament-question-ready PDF). Supports anonymous contributions (G2). The product here is the *immutable record*.

**7.4 Ranking engine.** `rank = f(affected_count(geo-weighted), severity, safety_flag, duration_unresolved, recurrence, seasonal_multiplier (G7), community_support(verified, geo-weighted), equity_weight (SC/ST/slum areas), scheme_availability)` — formula versioned and **publicly documented** (a ranking users can't inspect will be assumed rigged). Anti-gaming engine dampens brigading: velocity caps, geo checks, identity weighting, astroturf pattern detection.

**7.5 Trend & season engine.** Ward×category×time aggregates; monsoon-mode pre-season hotspot forecasts from prior-year data; anomaly alerts (sudden spike in ward X = early warning to Collector dashboard). Feeds the proactive-governance promise with boring, defensible statistics rather than social-media surveillance.

## 8. Routing & the Authority KB

Deterministic function, not generative: `route(taxonomy_code, geo, lifecycle) → Authority` via KB lookup — GVMC dept/zone for urban civic, Tahsildar/RDO for revenue, APEPDCL section for power, secretariat functionary for entitlements, **central branch → CPGRAMS bridge** for Port/Railways/Steel Plant/NHAI (G5). Ambiguity (multi-department problems, e.g., drain under a road) → human routing queue with KB-suggested candidates; resolution recorded as KB precedent. KB governance: quarterly refresh + event-driven updates (transfer orders monitored), staleness SLA (no entry older than 180 days unreviewed), every entry carries source citation + verified-on date, curator console with correction workflow fed by staff/officer feedback.

## 9. Solution recommendation engine (advisory-only, retrieval-grounded)

For each Master Problem (strongest for PROJECT class):
1. **Similar-case retrieval** — resolved problems of same taxonomy/geo (grows with usage).
2. **Scheme matching** — rules + retrieval over Scheme Corpus: permissible-works matching, eligibility, fund availability, process clocks. Flagship automation: **MPLADS recommendation pack generator** — pre-filled work recommendation (description, location, beneficiary estimate from affected_count, cost range from SoR data, SC/ST earmark tagging) ready for the MP's signature, with the 45/75-day statutory clock tracked after filing.
3. **Options memo** — 1–3 approaches ranked by cost/time/impact/risk, every factual claim linked to its corpus source; unsourced = not shown. Clearly watermarked "AI-prepared advisory — decision and execution rest with the competent authority."
4. **Research fetch** — on-demand deep-dive (technical norms, precedent projects in other districts) via live web retrieval into a reviewed appendix.

## 10. Action plane

**10.1 Human-in-the-loop ops console.** Queues: validation, merge review, routing ambiguity, lifecycle confirmation, sensitive-content, moderation, ASR/low-confidence transcription. Every action two-click with full context; throughput metrics; corrections feed models + KB. Staffing model: MP-office staff + platform team; volume-based (see §17 capacity).

**10.2 Officer console.** Jurisdiction-scoped work queue; accept/decline(reason)/request-info/update/fix-claimed(+photo evidence); bulk ops; SLA countdowns; supervisor views (workload heat, overdue list, reassignment). Zero-training design: WhatsApp-based officer flow as fallback for officers who won't adopt a console (deep links + structured replies).

**10.3 Verification loop.** `fixed_claimed` → citizen poll (WhatsApp/SMS/IVR per their channel): Confirmed → `resolved_verified`. Denied(+optional photo) → `reopened`, flagged to supervisor + counts against false-closure metrics. Timeout (14d default) → `resolved_unverified` (never counted as verified in stats). Multi-reporter problems: sample polling with quorum. This single loop is the product's soul — it generates the *citizen-verified resolution rate* per office, per department, per ward: the accountability statistic nobody in the state currently produces (G4 clocks included: stage-wise office performance published in aggregate).

**10.4 Notification engine.** Event-driven, per-citizen channel preference, Telugu default; batched digests to avoid spam; every state transition notifies; escalation and verification requests are priority-class. Officers get assignment/SLA-warning/escalation notices. All templates versioned; DLT-registered for SMS compliance.

**10.5 Escalation engine.** Rule table per lifecycle/taxonomy: SLA breach → supervisor; repeat breach → next level (mirrors + extends PGRS's reopen ladder: District Level Officer → HoD); chronic (n breaches / m days) → visibility escalation onto MLA/MP dashboards (political layer — always-on for their constituency regardless of admin level). DISPUTE class: escalation = evidence-pack generation + surfacing, never fake SLAs.

**10.6 Community platform.** Per public Master Problem: discussion thread, evidence uploads, geo-verified "affects me too" support, updates subscription. Moderation: AI-assisted (toxicity, communal-content, PII exposure, misinformation flags) + human moderators; identity = verified-phone pseudonyms; reputation earned by verified contributions (field photos matching geo). Hard rules: no candidate/party campaigning surfaces, problem-centric threads only. Anonymous reports appear as unattributed evidence (G2), weighted lower until corroborated.

**10.7 Help-desk assistant.** RAG strictly over Scheme Corpus + Authority KB + procedure library ("My pension stopped" → NTR Bharosa rules, secretariat functionary to visit, documents, grievance option — with sources). Refuses beyond corpus ("I don't have verified information on that") — no procedural hallucination. Available in WhatsApp/web/IVR, Telugu-first. Every answer offers: "file this as a grievance?"

**10.8 Dashboards.**
- **MP command center:** LS-constituency map (cross-district — Srungavarapukota included), top Master Problems by rank, MPLADS pipeline (recommended→sanctioned→executing with statutory clocks), escalation feed, dispute evidence packs, citizen-verified resolution trends, sentiment digest, exportable parliament-question briefs.
- **MLA / segment:** same scoped to segment.
- **Corporator ward view (G8):** ward problem map + status + verified-resolution stats; read-heavy; designed to be shown in council meetings (the anti-"no data" weapon).
- **Officer/supervisor/Collector:** workload, SLA risk, cross-dept early warnings, Monday-PGRS prep pack (auto-generated brief of the week's top issues).
- **Public transparency site:** aggregate heat maps, office-level performance clocks, ranking methodology, open-data downloads (monthly CSV), platform health stats. Personal grievances never appear anywhere public.

## 11. Identity, trust & safety

- **Citizens:** phone-OTP identity (one voice per number); optional profile. Anonymity tiers (G2): pseudonymous (staff can see identity) and full (identity captured nowhere; contribution weighted lower). Safety messaging embedded in all channels (never pay fees, verify officials' ID) per original vision §19.
- **Officials:** verified onboarding against KB entries (designation-bound accounts, transferred officer = account re-binding, never shared logins).
- **Anti-gaming:** §7.4 engine + moderation + public methodology. Political-neutrality policy: platform publishes the same statistics regardless of which party holds which office; formula changes are public changelog events.
- **Child-safety and vulnerable-person rules:** reports involving minors auto-route to sensitive queue, restricted visibility, mandatory human handling.

## 12. Security, privacy, compliance (DPDP Act 2023 by design)

- **Consent:** explicit, per-purpose, Telugu-language consent at first contact; separate consent for public visibility of a report's content; withdrawal honored (content de-attributed, not silently deleted from statistics).
- **Privacy vault:** PII tokenized + envelope-encrypted (KMS); personal grievances E2E-restricted to citizen + jurisdictionally-authorized officials; special-category inference caution (grievance content can reveal caste/health — vault treats grievance narratives as sensitive by default).
- **RBAC/ABAC:** every read scoped by role × jurisdiction; officials see only their queue's PII, never bulk exports.
- **Audit:** append-only, hash-chained event log for all state transitions and data access (who read what, when); evidence media hashed on ingest (tamper-evident for DISPUTE packs).
- **Data residency:** all data in India regions; DLT-compliant SMS; WhatsApp BSP with India data terms.
- **Retention:** published schedule (raw media n years, statistics indefinitely as aggregates, vault purge on withdrawal where lawful).
- **Security ops:** SSO+MFA for staff/officials, secrets management, dependency scanning, annual pentest, vulnerability disclosure policy, DPIA maintained, breach-notification runbook.

## 13. Platform infrastructure

- **Stack:** PostgreSQL + PostGIS (system of record, jurisdiction geometry) + pgvector (embeddings); Redis (queues/cache); object storage (media, evidence); Kafka-class event bus (intake→pipeline→notification fan-out); OpenSearch (text/geo search).
- **Services:** modular monolith first, service seams at the plane boundaries (intake adapters, ML pipeline workers, intelligence services, notification workers, dashboard/API gateway). Python (FastAPI) for ML plane, TypeScript (Node/Next.js) for product plane; Android (Kotlin) assisted-intake/officer apps; PWA for citizens.
- **ML serving:** GPU pool for ASR/vision/embeddings; managed LLM APIs for adjudication/summarization/help-desk with strict RAG; model registry + versioned prompts + eval suites (per-stage accuracy dashboards, drift alerts).
- **Scale posture:** cloud-native (India region), horizontally scalable stateless workers; designed load: constituency-scale (10³–10⁴ reports/day, monsoon 5×) → state-scale (10⁶/day) by sharding on district; event-bus architecture makes fan-out linear.
- **Resilience:** offline-tolerant clients; intake channels degrade independently (SMS lives when data dies — cyclone season matters in Vizag); RPO ≤ 15min, RTO ≤ 4h; chaos-tested monsoon-surge runbook.
- **Observability:** tracing across planes, per-channel intake SLOs, pipeline latency budgets (report → routed < 10 min at p95 for high-confidence), citizen-facing status page.

## 14. Data platform & continuous learning

Warehouse (problem/ward/office grain) powering dashboards, trend engine, open-data exports. Human corrections (validation, merges, routing, transcriptions) become labeled datasets → periodic supervised retraining with eval gates; no online self-training. Ranking formula changes A/B-tested against staff judgment panels and published. Research corpus grows: every resolved Project becomes a costed precedent for the solution engine.

## 15. Failure modes & designed mitigations

| Failure | Mitigation |
|---|---|
| Officials ignore the platform | MP/MLA political sponsorship; WhatsApp officer fallback; their *good* work gets publicly counted (verified-resolution credit); Collector's Monday-prep pack makes it useful, not extractive |
| False closures migrate into our system | Citizen verification is structural; per-officer false-closure metric; reopened problems escalate automatically |
| Wrong merge destroys trust | Reversible splits, human gate below threshold, merge-quality audits |
| Brigading/astroturfing | Geo-weighted verified support, velocity caps, anti-gaming engine, public methodology |
| KB staleness misroutes | Staleness SLA, transfer-order monitoring, correction loop, routing-failure telemetry |
| AI hallucination in solutions/help-desk | Strict RAG with citation-or-silence; advisory watermark; human review before anything reaches an official's decision surface |
| Political weaponization | Neutral statistics policy, public changelog, same data for all parties' corporators, no campaigning surfaces |
| Citizen expectation inflation ("app = fixed") | Honest statuses (G3), lifecycle-appropriate promises, help-desk explains process reality |
| Retaliation against reporters | Anonymity tiers, sensitive-queue handling, PII vault |
| State builds competing platform | Our moat = intelligence + verification + KB depth, not intake; PGRS bridge positions us as complementary auditor |

## 16. Success metrics (north stars first)

1. **Citizen-verified resolution rate** (the number that indicts the 90%-claimed world).
2. **Median time: report → verified resolution**, per category/office.
3. **Repeat-report rate** on "resolved" problems (false-closure detector).
4. **Coverage:** % of ward population that has successfully used any channel; language/channel mix (are we reaching non-smartphone citizens?).
5. **Officer adoption:** % assignments accepted + acted within SLA without escalation.
6. **Funding conversion:** Master Problems → filed recommendations → sanctioned works (₹ mobilized, MPLADS clocks met).
7. **Trust delta:** periodic IVR satisfaction survey (same methodology as the 78%-dissatisfaction survey — deliberately comparable).

## 17. Operating model

Platform team (product/eng/ML/ops) + KB curators (research staff) + ops reviewers (MP-office staff trained on consoles) + field verifiers (secretariat coordination) + moderators. Governance: published charter (neutrality, privacy, methodology), advisory group (retired administrator, civil-society, journalist) for legitimacy, quarterly transparency report. Capacity math at constituency scale: ~500–2,000 reports/day peak → after dedup ~100–400 Master Problem events/day → ops team of 4–8 reviewers sustains human-in-the-loop gates (validated against prototype telemetry before scaling).

---

*This is the complete end-state. Next documents: (a) phase decomposition with dependency-ordered milestones, (b) prototype specification — the thinnest vertical slice that proves the soul of the system: intake → Master Problem → route → verify, on real Vizag data.*
