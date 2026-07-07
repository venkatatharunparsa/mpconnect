# Existing Grievance Systems Study — CPGRAMS & AP PGRS (v0.1)
*Phase 0 research output for VGPS/MPconnect — built from live web sources, 2026-07-07*

## 1. Why this study matters

Our pitch cannot be "there is no grievance system." India has two mature ones covering Visakhapatnam. Our pitch is: **both systems optimize for disposal counts, neither verifies real resolution, neither aggregates duplicates into intelligence, and neither serves the MP/MLA as a user.** Every claim below is sourced.

## 2. CPGRAMS (Central — pgportal.gov.in)

**What it is:** GoI's centralized portal covering central ministries + states, run by DARPG. Monthly disposal reports, nodal officers, appeal provision, feedback via call center.

**Scale:** 1,15,52,503 grievances redressed 2020–2024; all-time high 26,45,869 in 2024. Pendency: 2,08,103 cases as of April 2025; 23 states/UTs with >1,000 pending each.

**Documented weaknesses (our openings):**

1. **Quality vs quantity:** citizen satisfaction barely exceeds 50% despite high disposal numbers — "procedural disposal does not guarantee substantive resolution" (IMPRI analysis).
2. **No consequence architecture:** no real accountability for poor handling; monthly reports emphasize disposal counts, not resolution quality.
3. **Robotic disposals & misclassification:** complaints misfiled as suggestions, template closures, duplication with sectoral mechanisms.
4. **Weak at the grassroots:** centralized design handles systemic/central issues better than local context-specific problems — long chain of command, poor accessibility. Local civic issues (our core domain) are its weakest area.
5. **No duplicate aggregation:** every complaint is an isolated ticket. Zero "master problem" intelligence.

## 3. AP PGRS (State — pgrs.ap.gov.in / meekosam.ap.gov.in)

**What it is:** AP's reformed grievance system (rebranded from Spandana after the June 2024 government change). Integrates 26 departments / 106 HoDs. Intake channels: portal, collectorate **Monday grievance day**, **Friday "Field Grievance Day"** (officials visit constituencies), village assemblies. CM has announced an additional "Praja Darbar"-style platform.

**Workflow mechanics (relevant to our design):**

- Per-category **SLA from 24 hours to 90 days**; emergency issues immediate.
- Citizen can **reopen twice**: first reopen → District Level Officer; second reopen → HoD level. (A built-in escalation ladder we should mirror and improve.)

**Documented failures (The Wire investigation + govt response, 2025):**

| Government claim | Ground reality |
|---|---|
| 90% of grievances resolved | **78% dissatisfaction** in an independent IVR survey |
| Digital transformation | **1.75 lakh applications unaudited**; software glitches send premature closure notifications |
| Accountability | **29,400 complaints reopened** due to faulty resolutions; officials **hastily closing complaints without resolving them**, some **forcing complainants to withdraw** (cases cited in Anantapur, NTR districts) |
| Clean administration | Farmers allege delays especially in **revenue offices**, with citizens "forced to grease palms" |

The government publicly warned officials against falsifying closures — an official admission that false closure is systemic. The state formally responded to The Wire defending the system, which means this failure mode is politically salient right now.

## 4. GVMC complaints portal/app (city level)

GVMC runs its own complaints channel (gvmc.gov.in) for civic issues. Not integrated with PGRS from the citizen's viewpoint; a Vizag citizen today chooses between GVMC app, PGRS, CPGRAMS, calling the corporator, or Monday queue at the collectorate — **the fragmentation problem in one sentence.** *(Depth of GVMC portal audit: pending — do hands-on testing in Phase 1.)*

## 5. The gap map — what none of them do

| Capability | CPGRAMS | AP PGRS | GVMC | **VGPS** |
|---|---|---|---|---|
| Multi-channel unified intake | ✗ (portal-centric) | partial (portal + physical days) | ✗ | ✓ |
| Duplicate merge → Master Problem | ✗ | ✗ | ✗ | ✓ core |
| Affected-population counting | ✗ | ✗ | ✗ | ✓ |
| **Citizen-verified closure** | weak (feedback call) | ✗ (false closures documented) | ✗ | ✓ core |
| Priority ranking for decision-makers | ✗ | ✗ | ✗ | ✓ |
| Solution + scheme/funding suggestions | ✗ | ✗ | ✗ | ✓ |
| MP/MLA constituency dashboard | ✗ | ✗ | ✗ | ✓ core |
| Reason-logging for deprioritization | ✗ | ✗ | ✗ | ✓ |

## 6. Strategic conclusions

1. **Don't compete on intake — compete on truth.** Both systems already take complaints. Neither can prove anything got fixed. Our citizen-verified resolution rate directly attacks the "90% resolved / 78% dissatisfied" gap, which is now publicly documented ammunition.
2. **PGRS's reopen ladder is our integration hook.** The state already concedes reopening as a right. We can position VGPS as the layer that *audits* closures rather than replacing PGRS — politically far easier for a partnership.
3. **The MP is an unserved user.** No existing system gives Sribharat Mathukumili's office a live view of constituency problems. That dashboard alone is a sellable product with zero incumbent.
4. **Timing is favorable.** The government is publicly embarrassed by false closures and has announced intent to build a better platform ("Praja Darbar"). We arrive proposing the fix, aligned with the CM's own stated direction.
5. **Risk to note:** if the state builds its own Praja Darbar platform well, the citizen-intake space gets crowded. Our defensible ground is intelligence (dedup, ranking, verification, funding mapping), not the intake form.

## 7. Open items

- Hands-on audit of GVMC app and PGRS portal UX (create real test grievances) — Phase 1.
- Get PGRS category/SLA list (the 26 departments' subject taxonomy) — it's a ready-made classification schema for our AI classifier.
- Monitor status of the announced Praja Darbar platform.

## 8. Sources

- [IMPRI — critical analysis of CPGRAMS](https://www.impriindia.com/insights/policy-update/beyond-digital-box-ticking-a-critical-analysis-of-indias-cpgrams/)
- [The Cavalier — CPGRAMS & DARPG monthly reports 2026](https://www.cavalier.in/cds-ota-current-affairs/2026-06-23/cpgrams-grievance-redress-2026)
- [DARPG — Grievance Redressal Assessment & Index report (PDF)](https://darpg.gov.in/sites/default/files/GRAI%20Report_20%20June%202023.pdf)
- [The Wire — Too Many Delays, False Closures](https://m.thewire.in/article/government/too-many-delays-false-closures-why-andhras-public-grievance-redressal-system-is-facing-backlash) · [AP Govt response to The Wire](https://m.thewire.in/article/government/andhra-pradesh-govt-responds-to-the-wire-report-claims-public-grievances-being-addressed-effectively)
- [PGRS portal](https://pgrs.ap.gov.in/) · [PGRS FAQs (SLA, reopen rules)](https://meekosam.ap.gov.in/Home/Faqs?Length=4) · [PGRS — National Portal listing](https://www.india.gov.in/services/details/public-grievance-redressal-system-pgrs-andhra-pradesh)
- [CPGRAMS portal](https://pgportal.gov.in/) · [GVMC portal](https://www.gvmc.gov.in/)
