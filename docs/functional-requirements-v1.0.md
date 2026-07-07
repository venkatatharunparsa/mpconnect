# VGPS / MPconnect — Functional Requirements Document v1.2
*2026-07-07. Companion to system-design-v1.0 and validation-report-v1.0.*
*v1.1 amendments (from founder raw-draft review): FR-INT-07 voice agent thin-slice promoted to P0; FR-CTZ-05 shareable problem cards added at P1.*
*v1.2 amendments (abuse-defense-v1.0): FR-VAL-05..08 added — corroboration gate, trust scoring, coordination detection, shadow limitation.*
*v1.3 amendments (community gravity ladder): CMN module restructured into three stages; ward leaderboard added (FR-DSH-06).*

## 0. Conventions

- **ID scheme:** FR-<module>-<nn>. Modules: INT (intake), UND (understanding), VAL (validation), MPE (master problem engine), LCM (lifecycle), RNK (ranking), RTE (routing/KB), SOL (solution engine), VER (verification), NTF (notifications), ESC (escalation), CTZ (citizen experience), OFC (officer experience), DSH (dashboards), CMN (community), HLP (help desk), OPS (ops console), ADM (administration), PUB (public transparency).
- **Priority:** **P0** = prototype must have it (proves the soul of the system) · **P1** = pilot launch requirement · **P2** = scale/mature.
- **Trace:** every requirement cites its evidence — PP1–PP8 (vizag-pain-points), G1–G8 (fit-gap), V1–V8 (validation), FS (eGov/CEPT field study), W (The Wire investigation), MPLADS (guidelines 2023).
- Requirements say **shall**; acceptance criteria (AC) are testable.

---

## 1. Intake (INT)

**FR-INT-01 (P0)** The system shall accept citizen reports via WhatsApp: free text, voice notes, images, and location pins, in Telugu, English, and code-mixed Telugu-English. *(G6, FS: Telugu decided Spandana's win)*
AC: a Telugu voice note produces a structured report with category, location, and reference ID returned in the same chat.

**FR-INT-02 (P0)** The system shall issue a unique human-readable reference ID (format `VZG-YYMM-NNNNN`) for every accepted report, returned on the same channel within 2 minutes.
AC: ID resolves on the tracking surface; duplicate submissions by the same citizen return the existing ID with current status. *(PP8)*

**FR-INT-03 (P0)** The system shall run conversational slot-filling only for missing mandatory fields (what, where), never re-asking what extraction already captured.
AC: report with clear text+location asks zero follow-up questions.

**FR-INT-04 (P1)** The system shall accept reports via a web/PWA form with the same field contract as WhatsApp.
**FR-INT-05 (P1)** The system shall accept reports via SMS (free-text) and register the sender's phone as the tracking identity. *(G6: non-smartphone floor)*
**FR-INT-06 (P1)** The system shall provide assisted intake: an authenticated field-staff app to file on behalf of a citizen, with the citizen's phone number as the tracking identity and a `filed_by` attribution. *(FS: secretariat oral-orders shadow system)*
**FR-INT-07 (P0 thin-slice / P2 full)** The system shall accept reports via a toll-free AI voice line with Telugu dialogue. **P0 thin-slice:** one number, slot-filling dialogue (what + where), mandatory read-back confirmation, reference ID spoken back and sent by SMS. **P2 full:** DTMF status lookup, callback verification polls, surge capacity, multi-dialect robustness. *(Reach thesis: the no-smartphone citizen's entire experience = one phone call; ASR WER reality makes read-back non-negotiable)*
AC (P0): a Telugu phone call with no prompting beyond the greeting produces a validated report and the caller can repeat back their reference ID.
**FR-INT-08 (P2)** The system shall ingest local news items as *candidate* problems flagged `source=news`, which shall never become or join a Master Problem without human approval. *(V-scope discipline; precedent: AP Command Centre clippings channel, FS)*
**FR-INT-09 (P1)** The system shall support anonymity tiers at submission: identified (default), pseudonymous (identity vaulted, staff-visible), anonymous (identity not captured). Anonymous reports shall be marked and weighted per FR-VAL-04. *(G2, PP6)*
**FR-INT-10 (P1)** The system shall attach citizen-provided evidence of a PGRS/CPGRAMS grievance (ID or document) to a report, linking prior government-system history. *(V2: audit-not-replace positioning)*
**FR-INT-11 (P0)** Every intake channel shall display/read the safety notice set (officials carry ID; never pay unofficial fees; official channels only) at first contact per citizen. *(vision §19)*

## 2. Understanding pipeline (UND)

**FR-UND-01 (P0)** The system shall detect language (te/en/code-mixed) and transcribe voice to text, storing both original audio and transcript.
AC: transcript confidence below threshold θ_asr routes to the human transcription queue (FR-OPS-03) instead of proceeding silently. *(Telugu WER ~30% benchmark reality — grounded)*

**FR-UND-02 (P0)** The system shall classify each report into the problem taxonomy. The taxonomy shall be seeded from empirically documented Vizag categories: streetlights, potholes/road damage, flyover/culvert repairs, water pipe leakage, parks; garbage removal, drain desilting, water stagnation, stray animals, debris; plus water supply, electricity, revenue/land, entitlements/pensions, health, education, police/safety, environment/pollution, encroachment, central-agency. *(FS: GVMC top categories — real data)*
AC: ≥85% top-1 accuracy on the golden set before auto-classification is enabled; below-threshold items route to human queue.

**FR-UND-03 (P0)** The system shall resolve location from GPS pin, free text ("near RTC complex Gajuwaka"), or image EXIF to a ward/secretariat polygon with a confidence score.
AC: pin → ward mapping is exact; text-only location below θ_geo asks one clarifying question (FR-INT-03).

**FR-UND-04 (P0)** The system shall extract urgency/safety flags with a recall-biased safety classifier (electrocution risk, sewage-in-water, structural collapse, open manholes). Safety-flagged reports bypass batch processing (see NFR-PER-03).
**FR-UND-05 (P1)** The system shall detect and vault PII inside report content before any content is displayed on public surfaces. *(DPDP)*
**FR-UND-06 (P1)** The system shall compute a perceptual hash of every image and flag reuse of previously-seen or stock imagery. *(V7: fake evidence)*
**FR-UND-07 (P0)** Every AI stage output shall be recorded as a ModelDecision (model, version, input hash, output, confidence) — replayable and auditable. *(design principle 3)*
**FR-UND-08 (P0)** All model-facing processing of citizen content shall treat it as untrusted input: structured-output contracts only; no model processing raw citizen text shall hold tool or action authority. *(V3: prompt injection)*

## 3. Validation (VAL)

**FR-VAL-01 (P0)** The system shall compute a composite confidence score per report; reports below θ_valid route to the human validation queue; nothing is silently dropped.
**FR-VAL-02 (P1)** The system shall detect same-citizen duplicates across channels and collapse them into one voice (one citizen = one count per problem). *(anti-gaming)*
**FR-VAL-03 (P1)** Rejected reports shall notify the citizen with the reason and an appeal path. *(FS: employees wanted a reject option; citizens deserve the reason)*
**FR-VAL-04 (P1)** Anonymous reports shall carry reduced evidentiary weight until corroborated by an identified report or field verification. *(G2)*
**FR-VAL-05 (P1)** No Master Problem shall become publicly visible or rankable on a single uncorroborated voice: promotion from `claimed` to `validated-public` requires k independent unlinked reporters (default 3), OR one field verification, OR strong geo-consistent evidence plus one additional reporter. Lone reports remain acknowledged, tracked, and routed for field check — just unpublished. *(abuse-defense L3; P0 carries the `claimed` state + basic rate limits)*
**FR-VAL-06 (P1)** Each reporter identity shall carry a trust score: cold-start below full weight, raised by verified behavior, decayed by unfounded outcomes; affected counts and community support are trust-weighted. *(abuse-defense L1/L5)*
**FR-VAL-07 (P1)** Merge clusters shall be scored for coordination signatures (burst timing, cold identities, templated text, geo-implausibility, single-purpose history); high scores route the cluster to a suspected-coordinated ops queue with auto-merge suspended and public surfaces frozen pending human review; review decisions become labeled training data. Genuine surges (e.g., cyclone) are distinguished by human review with seasonal context, never by threshold alone. *(abuse-defense L4)*
**FR-VAL-08 (P1)** Field checks may return `unfounded` (on-site evidence, hash-chained). Repeat-unfounded identities (config strikes/window) enter shadow limitation: reports accepted and acknowledged but auto-quarantined pending unrelated corroboration. Abuse-flagged rejections use truthful-but-generic reasons; detection thresholds are never published. *(abuse-defense L5/L6)*

## 4. Master Problem engine (MPE)

**FR-MPE-01 (P0)** The system shall match each validated report against open Master Problems using taxonomy + geo-proximity + text/image similarity + time window, and: auto-merge above θ_hi; queue for human merge review between θ_lo–θ_hi; create a new Master Problem below θ_lo.
AC: on the golden set, auto-merge precision ≥95% (wrong merges are worse than missed merges).

**FR-MPE-02 (P0)** Every Master Problem shall maintain: affected count (unique citizens, geo-weighted + household coefficient), evidence set, geographic boundary, lifecycle class, state, and full report lineage.
**FR-MPE-03 (P0)** Merges shall be reversible: a split operation shall restore constituent reports with full history preserved. *(validation: wrong-merge trust risk)*
**FR-MPE-04 (P0)** The Master Problem shall be implemented as an event-sourced entity: all state transitions are immutable events; current state is a projection. *(architecture decision from review synthesis)*
**FR-MPE-05 (P1)** Citizens whose reports merge into a Master Problem shall be notified ("your report joined a problem affecting N citizens") and subscribed to its updates.

## 5. Lifecycle management (LCM)

**FR-LCM-01 (P0)** Each Master Problem shall be classified GRIEVANCE, PROJECT, or DISPUTE (rules + model proposal + human confirmation at P0), each with its own state machine. *(G1)*
**FR-LCM-02 (P0)** GRIEVANCE lifecycle: `reported → validated → assigned → accepted → in_progress → fix_claimed → verifying → resolved_verified | reopened | resolved_unverified`. SLA per taxonomy code (seeded from PGRS's 24h–90d norms).
**FR-LCM-03 (P1)** PROJECT lifecycle: `identified → scoped → cost_estimated → funding_mapped → recommended → sanctioned → tendered → executing → delivered → citizen_verified`, with honest holding states: `awaiting_funds(reason, since)`, `deprioritized(reason)`. Deprioritization shall require a logged reason visible to affected citizens. *(G3, PP2)*
**FR-LCM-04 (P1)** DISPUTE lifecycle: append-only case ledger — every complaint, authority response, inspection, and media item timestamped and hash-chained; no closure-promise SLA; one-click export pack (chronology + evidence index) in RTI-annexure-ready format. *(PP6: the ignored village)*
**FR-LCM-05 (P1)** Lifecycle reclassification (e.g., recurring GRIEVANCE → PROJECT: the pothole that returns every monsoon is a resurfacing project) shall be supported with history intact. *(FS "blackspot" pattern, PP3)*

## 6. Ranking (RNK)

**FR-RNK-01 (P0)** The system shall compute a priority score per open Master Problem from: affected count, severity, safety flag, days unresolved, recurrence count, seasonal multiplier, verified community support (geo-weighted), equity weight (SC/ST/slum-notified areas), scheme availability.
**FR-RNK-02 (P1)** The scoring formula, weights, and any changes shall be published on the public transparency surface with a changelog. *(V6-adjacent: inspectability)*
**FR-RNK-03 (P1)** Anti-gaming: support velocity caps, geo-plausibility checks on supporters, and identity weighting shall dampen coordinated inflation; flagged patterns route to ops review.

## 7. Routing & Authority KB (RTE)

**FR-RTE-01 (P0)** Routing shall be a deterministic KB lookup `(taxonomy, geo, lifecycle) → authority`, never a generative guess. Facts absent from the KB shall cause a routed-to-human outcome, not a model guess. *(design principle 4; FS: misrouting was DIGIT's documented #1 failure)*
**FR-RTE-02 (P0)** Every KB entry shall carry source citation, verified-on date, and staleness flag; entries unreviewed >180 days shall surface in the curator queue.
**FR-RTE-03 (P0)** Ambiguous or multi-department routings shall queue for human decision with KB-suggested candidates; the human decision shall be recorded as a reusable KB precedent.
**FR-RTE-04 (P1)** The KB shall model: state hierarchy (secretariat → mandal → division → district), GVMC (ward → zone → dept → commissioner), parastatals (APEPDCL, APSRTC), and a central branch (Port, Railways, Steel Plant, NHAI) whose routing outcome is a CPGRAMS filing pack. *(G5)*
**FR-RTE-05 (P1)** Officer-transfer events shall re-bind designations, not create new authority entities (metrics follow the designation). *(FS: login-sharing reality)*
**FR-RTE-06 (P2)** The system shall interoperate with DIGIT PGR data-model standards for record exchange with CDMA systems. *(V-A1 reuse decision)*

## 8. Solution engine (SOL)

**FR-SOL-01 (P1)** For PROJECT problems, the system shall generate an options memo: 1–3 approaches with cost range, timeline, funding route, beneficiary estimate, risks — every factual claim carrying a source link into the Scheme Corpus; claims without corpus sources shall not be rendered. *(anti-hallucination contract)*
**FR-SOL-02 (P1)** The system shall generate MPLADS recommendation packs: pre-filled work description, location, beneficiary estimate (from affected count), cost band, SC/ST earmark tagging; after filing, track the statutory 45-day rejection-notice and 75-day sanction clocks. *(MPLADS 2023)*
**FR-SOL-03 (P2)** The system shall check whether a problem falls inside an already-sanctioned work (AMRUT/SBM/GVMC pipelines) and output "expedite existing work" with the work reference, instead of proposing new funding.
**FR-SOL-04 (P1)** All solution outputs shall carry the watermark: "AI-prepared advisory — decision and execution rest with the competent authority."

## 9. Verification (VER)

**FR-VER-01 (P0)** On `fix_claimed`, the system shall poll reporting citizens on their original channel: Confirmed → `resolved_verified`; Denied (optional photo) → `reopened` + supervisor flag; no response in 14 days → `resolved_unverified` — which shall never be counted as verified in any statistic. *(PP8, W, FS: citizens asked for GPS-photo proof)*
**FR-VER-02 (P1)** Multi-reporter problems shall verify by sampled quorum (min 3 or 10% of reporters, whichever greater).
**FR-VER-03 (P1)** Officers' fix claims shall require photo evidence with capture-time geo-consistency checks. *(V7)*
**FR-VER-04 (P1)** The system shall compute citizen-verified resolution rate and repeat-report rate per taxonomy, ward, department, and designation — the canonical accountability statistics. *(north star)*

## 10. Notifications (NTF)

**FR-NTF-01 (P0)** Citizens shall be notified on their originating channel at: receipt, validation outcome, assignment, fix claim (=verification request), and final state. Telugu default.
**FR-NTF-02 (P1)** Notification templates shall be versioned; SMS templates DLT-registered; WhatsApp business-initiated messages use utility templates (cost model: user-initiated 24h service window is free — design flows to maximize in-window replies).
**FR-NTF-03 (P1)** Officers shall receive assignment, SLA-warning (at 75% elapsed), and breach notices; supervisors receive breach rollups.
**FR-NTF-04 (P2)** Digest batching shall prevent >2 non-critical notifications per citizen per day.

## 11. Escalation (ESC)

**FR-ESC-01 (P1)** SLA breach shall auto-escalate one level per the KB escalation path; second breach escalates again; all escalations are logged, notified, and visible to the citizen. *(mirrors PGRS reopen ladder: DLO → HoD)*
**FR-ESC-02 (P1)** Chronic problems (n breaches or m reopens) shall surface on MLA/MP dashboards regardless of administrative level. *(political visibility layer)*
**FR-ESC-03 (P1)** DISPUTE problems shall escalate by evidence-pack generation and surfacing, never by fake SLA clocks.

## 12. Citizen experience (CTZ)

**FR-CTZ-01 (P0)** A citizen shall retrieve full status (state, responsible designation, next expected event, history) by reference ID via WhatsApp or web, in Telugu or English.
**FR-CTZ-02 (P1)** Citizens shall be able to support a public Master Problem ("affects me too") with geo-verification, and subscribe to its updates.
**FR-CTZ-03 (P1)** Personal grievances shall be visible only to the citizen and jurisdictionally-authorized officials — never on public surfaces, community, or political dashboards. *(privacy split; V4)*
**FR-CTZ-04 (P2)** Citizens shall rate the resolution experience post-closure (feeds satisfaction survey, comparable to the 78%-dissatisfaction IVR methodology).
**FR-CTZ-05 (P1)** Every public Master Problem shall generate a **shareable card** (image: problem title, affected count, status, ward, tracking link/QR) optimized for WhatsApp forwarding. Tapping the link shows status and offers geo-verified "affects me too" + reporting. *(Founder raw-draft strategy: harness existing social-argument energy as distribution — the fight stays in their WhatsApp groups; every share recruits verified supporters without us hosting a social network. Full community platform remains P2/P4.)*
AC: card renders in Telugu+English; share→tap→support round-trip works without app install.

## 13. Officer experience (OFC)

**FR-OFC-01 (P1)** Officers shall have a jurisdiction-scoped queue with accept / decline-with-reason / request-info / update / fix-claim(+photo) actions.
**FR-OFC-02 (P1)** A WhatsApp-based officer flow (deep links + structured replies) shall exist as the zero-training fallback. *(adoption risk mitigation)*
**FR-OFC-03 (P1)** Personal-action attribution shall use acceptance-signatures on actions, not login identity alone. *(FS: login sharing)*
**FR-OFC-04 (P2)** Supervisors shall reassign work, view workload heat, and see designation-level performance.

## 14. Dashboards (DSH)

**FR-DSH-01 (P0)** MP/staff dashboard: constituency map of open Master Problems, ranked list, drill-down to problem detail with evidence and history. *(the unserved user)*
**FR-DSH-02 (P1)** MP dashboard shall add: MPLADS pipeline with statutory clocks, escalation feed, verified-resolution trends, exportable brief packs. Constituency geometry shall span districts (Srungavarapukota). *(KB §2)*
**FR-DSH-03 (P1)** Corporator ward view: read-only ward-scoped map, statuses, verified-resolution stats — identical data regardless of party. *(G8, V1 neutrality)*
**FR-DSH-04 (P2)** Collector view: cross-department early warnings, Monday-PGRS prep pack auto-generated.
**FR-DSH-05 (P1)** Heat map layers: problem density, age, category, seasonal comparison (monsoon mode: prior-year hotspots as preventive flags). *(G7)*
**FR-DSH-06 (P3)** Public **ward-vs-ward verified-fix leaderboard** ("Gajuwaka: 43 verified fixes this month") — competitive civic pride channeling AP's group-rivalry energy at outcomes; ranks wards by citizen-verified resolutions only (ungameable by claim inflation), never ranks parties. *(vizag-political-reality §3.5 fan-war jujitsu)*

## 15. Community (CMN) — the gravity ladder (be the scoreboard before the stadium)

**Stage 1 — rally points (P1, with FR-CTZ-05):**
**FR-CMN-01 (P1)** Every public Master Problem shall have a public page acting as a rally point: live supporter count, status, evidence timeline, one-tap geo-verified "affects me too," photo contribution, and subscribe — **no free-text discussion**. Designed to be cited from citizens' existing WhatsApp/X spaces (via shareable cards); the fight stays on their turf, our page is the score.

**Stage 2 — structured arenas (P3):**
**FR-CMN-02 (P3)** Geography auto-forms communities (your ward's problems = your feed); **no user-created groups** (they become party cells). Participation is structured: official updates, citizen evidence posts, reactions — still no open threads.
**FR-CMN-03 (P3)** Contribution reputation earned by verified contributions (geo-consistent photos, confirmed resolutions), never volume.

**Stage 3 — open discussion (P4, gated):**
**FR-CMN-04 (P4)** Full problem-centric discussion threads with verified-phone pseudonyms — launched only after: legal entity exists, moderation staffing exists, and Stages 1–2 show inhabited pages. Moderation: AI-assisted flagging (toxicity, communal content, PII, misinformation) + human decision; no electoral campaigning surfaces; problem-centric threads only.

## 16. Help desk (HLP)

**FR-HLP-01 (P1)** The assistant shall answer procedure/eligibility questions strictly by retrieval over the Scheme Corpus + Authority KB + procedure library, citing sources, and shall refuse when the corpus lacks the answer ("I don't have verified information on that"). *(anti-hallucination contract)*
**FR-HLP-02 (P1)** Every help-desk answer shall offer conversion: "file this as a grievance?"
**FR-HLP-03 (P2)** Voice help desk on the IVR line, Telugu-first.

## 17. Ops console (OPS)

**FR-OPS-01 (P0)** Human queues: validation, merge review, routing ambiguity, lifecycle confirmation — two-click actions with full context; every action recorded and attributable.
**FR-OPS-02 (P1)** Ops corrections (class, category, merge, route) shall accumulate as labeled training data and KB precedents. *(the real learning loop)*
**FR-OPS-03 (P0)** Human transcription queue for below-threshold ASR items.
**FR-OPS-04 (P1)** Personal-grievance queues shall be handleable only by designated non-political ops roles; access is logged and reviewable. *(V4 insider threat)*

## 18. Administration (ADM)

**FR-ADM-01 (P1)** KB curator console: CRUD with mandatory source citation, review workflows, staleness dashboard, import from structured sources (GO PDFs, ward maps).
**FR-ADM-02 (P1)** Taxonomy, SLA table, thresholds (θ), and ranking weights shall be configuration, not code — versioned with changelog.
**FR-ADM-03 (P1)** Role administration: RBAC×jurisdiction ABAC; designation-bound official accounts; MFA for staff/officials.

## 19. Public transparency (PUB)

**FR-PUB-01 (P1)** A public surface shall show aggregate statistics (problems by ward/category/status, verified-resolution rates, office-level clocks) with **automated fixed-schedule publication** — no discretionary release. *(G4, V6)*
**FR-PUB-02 (P2)** Monthly open-data CSV export, personal data excluded, methodology page included.

---

## 20. Traceability summary

| Evidence | Requirements it drives |
|---|---|
| PP8 / W (false closures, distrust) | FR-VER-*, FR-CTZ-01, FR-PUB-01 |
| FS field study (misrouting, Telugu, login-sharing, no-reject, oral orders) | FR-RTE-01/02/05, FR-INT-01/06, FR-OFC-03, FR-VAL-03 |
| PP1/PP3 (garbage, potholes) | FR-UND-02 taxonomy, FR-LCM-02/05 |
| PP2 (structural water deficit) | FR-LCM-03, FR-SOL-* |
| PP6 (ignored village) | FR-LCM-04, FR-INT-09, FR-ESC-03 |
| PP7 (council data vacuum) | FR-DSH-03 |
| G1–G8, V1–V8 | mapped inline above |
| MPLADS 2023 | FR-SOL-02 |
| Telugu ASR WER benchmarks | FR-UND-01, FR-INT-07 read-back |
| WhatsApp pricing model (verified 2026) | FR-NTF-02 |

**P0 set (the prototype contract):** INT-01/02/03/11 · **INT-07 thin-slice** · UND-01/02/03/04/07/08 · VAL-01 · MPE-01/02/03/04 · LCM-01/02 · RNK-01 · RTE-01/02/03 · VER-01 · NTF-01 · CTZ-01 · DSH-01 · OPS-01/03 — 25 requirements. Everything else waits.
