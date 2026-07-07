# Validation Report — system-design-v1.0 vs. the Real World
*Self-check against open-source landscape, field evidence, security analysis, and product-risk review. 2026-07-07*
*Primary new evidence: eGov Foundation / CEPT University field study of PGR in Guntur & Visakhapatnam (read in full), incl. interviews inside GVMC.*

---

## Part A — Open-source landscape: what exists, what we reuse, what differentiates us

### A1. DIGIT (eGov Foundation) — the incumbent inside our own pilot city
**Fact discovered:** AP contracted eGov in 2015; all 110 ULBs incl. GVMC run DIGIT (CDMA website + PuraSeva app) with a PGR module. MIT-licensed, open API, published data-model specs. eGov handed operations to the AP govt in 2021 and is now advisory.
**What DIGIT PGR already does:** citizen filing, assignment to designated employee, reassignment requests, escalation routing matrix, SLA tracking, supervisor approval to close, citizen rating + reopen.
**What the field study proves it does NOT do (in GVMC, on the ground):**

1. **Closures without resolution** — citizens explicitly suggested "acknowledgment of the image with GPS location as proof." *Vizag citizens independently invented our verification loop and asked for it.* Strongest validation in this entire project.
2. **Misrouting from stale mappings** — "information and details regarding departments and employees are not updated, hence there is a delay in routing"; ward↔secretariat mapping cannot even be edited by ULB staff. *Our Authority-KB-with-maintenance thesis is not speculative — it's the documented #1 operational failure.*
3. **English-only UI** while politically-marketed Spandana won citizens with Telugu. *G6 (Telugu-first) validated as adoption-decisive, not cosmetic.*
4. **No duplicate aggregation, no Master Problems, no ranking, no funding mapping, no MP/MLA surface.** The entire intelligence plane of our design has no incumbent.
5. **Databases not integrated:** Spandana, DIGIT, GVMC Smart-City portal, Dial-Your-Mayor, Tapaal, ward secretariats all run in parallel; offline complaints at secretariats get "solved through oral orders and mostly not entered into the grievance system." *The fragmentation problem is worse than we claimed — even the government's own systems don't see each other.*

**Reuse decision:** do NOT rebuild municipal workflow. Adopt DIGIT's published PGR data-model standards for interoperability (so our records can sync into CDMA if a partnership forms), treat DIGIT/PGRS as systems-of-record we *bridge to*, and keep our build focused on the layers with zero incumbent: dedup/Master Problems, ranking, verification, funding intelligence, political dashboards.

### A2. Vizag ground-truth extracted from the study (updates our KB and taxonomy)
- **~650 ward secretariats in Vizag** (1 per 1,000–1,200 households) — much denser than our KB assumed; volunteers per 50–60 households.
- **Real top complaint categories (CDMA dashboard, GVMC):** Engineering — streetlights, potholes, flyover/culvert repairs, water pipe leakage, parks; Public Health — garbage removal, drain desilting, water stagnation, stray pigs, debris. *Our classifier taxonomy now has empirical seed categories.*
- **AP already ran a newspaper-clippings grievance channel** (AP Command Communication Centre) and vehicle-camera "video analytics" + "blackspot monitoring" (repeat-complaint spot tracking — a primitive Master Problem concept!). Both **stalled after the 2019 government change**. Precedent exists for our news-intake AND a warning (see C1).
- Higher officials' logins are handed to computer operators — per-officer metrics must survive login-sharing reality.
- Employees complained of vague complaints with **no reject option** — our reject-with-notified-reason path is validated.

### A3. Other OSS
- **FixMyStreet (mySociety, open source):** 18 years of evidence. Key lessons: (i) a citizen platform without committed fixers "erodes faith more than if the platform never existed" — our MP-sponsorship-first strategy is the correct mitigation; (ii) documented critique: FMS handles isolated potholes but "rarely aggregates reports to expose root causes" — precisely the gap our Master Problem + Project lifecycle fills; (iii) civic-tech users skew educated/connected — our WhatsApp/IVR/assisted-intake floor is mandatory, not optional.
- **Ushahidi:** proven multi-channel crowdsourcing + evidence mapping under adversarial conditions — pattern source for our DISPUTE evidence ledger.
- **Consul/Decidim:** mature participation/moderation patterns for our community layer (reputation, proposals) — study before building ours.
- **Verdict:** no existing OSS project, alone or combined, delivers our intelligence plane. The differentiation claim survives contact with the landscape — *provided we position as the intelligence layer, not another intake channel* (see C2).

## Part B — Design theses: validated / adjusted

| Thesis in system-design-v1.0 | Verdict | Evidence |
|---|---|---|
| Citizen-verified closure is the killer feature | **Validated — citizens asked for exactly this** | GVMC field study suggestion (GPS-photo proof) + The Wire false-closure investigation |
| Authority KB staleness is the core routing risk | **Validated — documented failure cause in GVMC** | Field study: outdated employee/ward mapping → delays, misrouting |
| Telugu-first decides adoption | **Validated** | Spandana beat DIGIT on Telugu + political marketing |
| Fragmentation of channels | **Validated, understated** | 6+ live channels, unintegrated databases, oral-order shadow system |
| Master Problem engine has no incumbent | **Validated** | Only primitive precedent: "blackspot monitoring," now defunct |
| MP/MLA as unserved dashboard user | **Validated** | No system in the study serves elected representatives |
| Seasonal/monsoon load design | Unchanged | — |
| Per-officer accountability metrics | **Adjust** | Login-sharing means designation-level attribution needs acceptance-signatures + evidence stamps, not login identity alone |

## Part C — New risks discovered (and required design changes V1–V8)

### C1. Political discontinuity is the #1 systemic killer
DIGIT was TDP's platform (2015); YSRCP won 2019 and built Spandana *in parallel* rather than adopting it; DIGIT channels (GIS, video analytics, blackspot) "were at a standstill due to the change in policies." Then TDP returned in 2024 and rebranded Spandana→PGRS. **Governance software in AP dies or stalls every election cycle.** Our MP is TDP; 2029 is a real horizon.
**→ V1:** survival strategy in design: (a) value anchored in *data continuity* — the Master Problem archive, verified-resolution history, and KB grow more valuable across regime changes and belong to no scheme brand; (b) neutrality architecture (same stats for all parties' corporators) is survival, not just ethics; (c) target multi-party corporator adoption early (G8) so the platform has friends on both benches; (d) open-data publication makes killing it publicly visible.

### C2. "Ninth channel" trap
Vizag citizens already juggle PGRS, PuraSeva, GVMC portal, Dial-Your-Mayor, WhatsApp line, secretariats, Tapaal, Monday darbar. Launching "one more app" reproduces the disease we diagnose.
**→ V2:** citizen-facing positioning = *no new destination*: WhatsApp (existing behavior) + assisted intake at secretariats (existing footfall) + **bridging existing channels' data** where partnership allows. The web portal is a tracking/transparency surface, not the marketed front door. Our brand promise is "your complaint stops disappearing," not "download our app."

### C3. Security & compliance deep-dive (additions to §12 of the design)
1. **Prompt injection via citizen content:** every report is untrusted input flowing into LLM stages. Mitigations: strict structured-output contracts, no tool/action authority for models processing raw citizen text, injection-pattern screening, human gates on all consequential actions (already designed — now explicitly a security control). **→ V3.**
2. **Insider threat / political misuse of PII:** MP-office staff running ops queues could see opponents' personal grievances. Mitigation: personal-grievance queues handled only by non-political platform staff under logged access; political staff see public problems + aggregates only; access audits reviewable by the advisory group. **→ V4.**
3. **Data-fiduciary legal structure:** under DPDP 2023 someone must be the named fiduciary. A private team processing grievances "for an MP" is legally ambiguous — decide the entity (company as fiduciary with published policy; MP office as a data principal-facing front), get a DPIA done before pilot, define CERT-In 6-hour breach-reporting runbook. **→ V5 (legal workstream, pre-pilot blocker).**
4. **Selective-release weaponization:** aggregate stats released discretionarily before elections = weaponization. Mitigation: automated, scheduled, non-discretionary publication calendar (monthly, fixed date, all wards). **→ V6.**
5. **Fake evidence escalation:** AI-generated complaint images are now cheap. Add provenance checks (C2PA where available, EXIF+geo consistency, capture-in-app option for verifiers) and weight unverifiable media lower. **→ V7.**
6. **Platform dependencies:** WhatsApp BSP policy/pricing risk (Meta can change rules) — SMS/IVR/PWA are genuine fallbacks, keep them first-class; LLM API dependency — pipeline degrades to human queues, never blocks intake.

### C4. Product/business risks
1. **Single-customer concentration:** one MP = one election from zero. V1's multi-party corporator strategy + (later) other MPs/MLAs is the diversification path. Also: the *dataset itself* (city problem intelligence) has civil-society/research value independent of any office-holder.
2. **Unit economics:** ASR+LLM+embedding per report at Vizag scale (~10³/day) ≈ manageable (rough order: single-digit ₹/report with current API pricing; batch/self-hosted ASR cuts it further) — but budget it, meter it, and design the pipeline to skip LLM stages on high-confidence classifier paths. **→ V8: cost telemetry from day one.**
3. **Two-sided cold start:** FixMyStreet's lesson — citizen supply without government response is trust-negative. Sequencing law: **never open citizen intake in a ward before a response path is committed** (MP office minimum). Pilot = few wards, deep, not city-wide, shallow.
4. **Team-of-4 reality:** the v1.0 design is a multi-year system. This validation makes the phasing/prototype cut (next document) even more critical: the prototype must prove dedup + verification + one dashboard on real data — everything else stays paper until that works.

## Part D — Overall verdict

The design survives validation with its core intact — and the strongest finding of this entire exercise is that **Vizag citizens, GVMC's own field data, and 18 years of global civic-tech evidence all independently point at the same three gaps our design centers on: nothing verifies resolution, nothing aggregates duplicates into intelligence, and nothing serves elected representatives.** No open-source or government incumbent occupies that ground.

The validation also corrects us in three humbling ways: we are not the first "unified platform" attempt (DIGIT was exactly that promise in 2015 — and fragmentation won); technology platforms here die by election cycle unless engineered for political survival; and the most dangerous line in our own pitch is "one more channel." V1–V8 are now mandatory design amendments. With them, I'd rate the concept: **problem validity 9/10, differentiation 8/10, execution risk high-but-phased-manageable, political risk the honest wildcard.**

## Sources
- [eGov/CEPT — PGR in AP: Insights from Guntur & Visakhapatnam (full PDF, read complete)](https://egov.org.in/wp-content/uploads/2024/09/Public-Grievance-Redressal-for-Urban-e-Governance-in-Andhra-Pradesh-Insights-from-Guntur-Visakhapatnam.pdf)
- [DIGIT PGR module docs](https://docs.digit.org/local-governance/v2.8/products/modules/public-grievances-and-redressal/pgr-brochure) · [DIGIT PGR data-model specs](https://standards.digit.org/public-grievance-redressal-module-standards/pgr-data-modelling-standards) · [eGov Foundation](https://egov.org.in/)
- [FixMyStreet platform](https://fixmystreet.org/) · [FMS DIY guide (lessons)](https://fixmystreet.org/The-FixMyStreet-Platform-DIY-Guide-v1.1.pdf) · [Critique of symptomatic-fix pattern](https://grokipedia.com/page/fixmystreetcom)
- Prior project research docs: existing-systems-study-v0.1, vizag-pain-points-fitgap-v0.1, authority-kb-visakhapatnam-v0.1
