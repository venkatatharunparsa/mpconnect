# Scheme & Funding Corpus — v0.1
*Phase 0 research output for VGPS/MPconnect — feeds the Solution Recommendation Engine. Sources at end. 2026-07-07*

**Purpose:** when a Master Problem lands on an official's desk, the engine must answer: *"Which fund can pay for this fix, who sanctions it, and how fast?"* This corpus is the ground truth for those answers.

**Verification legend:** ✅ sourced this session · ⚠️ verify before production (esp. scheme end-dates — several central missions had 2025-26 sunset dates and may have been extended/replaced).

---

## 1. MPLADS — our pilot's home turf ✅

The fund our pilot sponsor (MP, Visakhapatnam) directly controls. Governed by **Revised MPLADS Guidelines 2023** + eSAKSHI portal.

- **₹5 crore per MP per year**, released in a single installment at the start of each FY via eSAKSHI. ✅
- Earmarks: ≥15% (₹30L) for SC-inhabited areas, ≥7.5% (₹15L) for ST areas. ✅
- **Process & SLAs:** MP recommends work → District Authority must inform rejection within **45 days** (with reasons) → eligible works sanctioned within **75 days**. States must delegate full technical/financial/administrative sanction powers to the Implementing District Authority. ✅
- Nature: durable community assets (roads, drains, school rooms, drinking water, streetlights, community halls...). Full permissible/prohibited list in the 2023 guidelines PDF (obtain and encode ⚠️).

**Engine implication:** for any community-asset Master Problem in the constituency, the engine can generate a *ready-to-file MPLADS recommendation* with cost estimate and the 45/75-day clock. This is the single most direct "problem → funded solution" path we can automate, and it belongs to our user.

## 2. Central urban missions (Vizag is ~90% urban — these matter most)

| Scheme | Covers | Money | Status flag |
|---|---|---|---|
| **AMRUT 2.0** (MoHUA) | Urban water supply (universal tap coverage), sewerage/septage in 500 cities | ₹2,77,000 cr total outlay, ₹76,760 cr central share, FY22–FY26 ✅ | Mission window ends FY 2025-26 — **verify extension/successor now** ⚠️ |
| **Swachh Bharat Mission-Urban 2.0** | Sanitation, garbage-free cities, solid waste mgmt, public toilets | ₹1,41,600 cr outlay, ₹36,465 cr central, FY22–FY26 ✅ | Same sunset caveat ⚠️ |
| **15th Finance Commission grants to ULBs** | Untied + tied grants (water/sanitation) direct to GVMC | Amounts for GVMC not found this session ⚠️ | 15th FC period ends FY26; 16th FC awards begin — **key research item** ⚠️ |
| Smart Cities Mission (Vizag was a Smart City) | Urban infra | Mission largely concluded ⚠️ | Check residual/successor programs ⚠️ |

**Engine implication:** urban water/drainage/sanitation problems (Vizag's biggest categories) map to AMRUT 2.0 / SBM-U 2.0 project pipelines executed by GVMC. The engine should check whether a reported problem falls inside an already-sanctioned project (then the answer is "expedite existing work," not "find money").

## 3. Rural/peri-urban routes (Bheemunipatnam division, Padmanabham etc.)

- **Jal Jeevan Mission** — rural functional household tap connections (converges with AMRUT at the urban boundary). ⚠️ verify current phase/status.
- **MGNREGA** — rural wage works: internal roads, drains, water conservation; can fund labor component of many village-level fixes. ⚠️ encode permissible works list.
- **Panchayat Raj engineering + 15th FC panchayat grants** for village infrastructure. ⚠️

## 4. AP state schemes — the "Super Six" (entitlement problems route here) ✅

These are what most **personal grievances** in our system will be about — delays, exclusions, eligibility disputes:

| Scheme | What citizens get | FY26 allocation |
|---|---|---|
| **NTR Bharosa** pensions | ₹4,000/month (raised from ₹3,000 in July 2024); elderly, widows, disabled, single women, weavers, fisherfolk, HIV+, etc. | ₹27,518 cr ✅ |
| **Talliki Vandanam** | ₹15,000/year per school child (classes 1–12, govt & private), to mothers | ₹9,407 cr ✅ |
| **Annadata Sukhibhava** | ₹20,000/year per farmer | ₹6,300 cr ✅ |
| **Deepam 2.0** | 3 free LPG cylinders/year, 90.1 lakh beneficiaries | ₹2,601 cr ✅ |
| **Free bus travel for women** (APSRTC) | launched 15 Aug 2025 ✅ | — |
| **Yuva Galam** | jobs + unemployment allowance for youth | rollout status ⚠️ |

**Engine implication:** the AI Help Desk needs each scheme's eligibility rules + application channel (Sachivalayam) + grievance path. Pension-delay complaints — a guaranteed high-volume category — resolve through the secretariat welfare functionary chain, not through funding.

## 5. Funding-route decision tree (v0 draft for the engine)

```
Master Problem
├── Is it inside an already-sanctioned project (AMRUT/SBM/GVMC works)?
│     └── YES → route = "expedite existing work" → executing dept + contractor status
├── Community asset, ≤ ~₹25-50L, in constituency?
│     └── MPLADS recommendation (45/75-day clock) — MP's direct lever
├── Urban infra, larger scale?
│     └── GVMC capital budget / AMRUT-successor / 16th FC tied grants / state urban dept
├── Rural infra?
│     └── MGNREGA / JJM / PR engineering / 15th-16th FC panchayat grants
└── Personal entitlement?
      └── Not a funding problem → scheme service chain via Sachivalayam
```

## 6. Priority research backlog

1. **Post-FY26 status of AMRUT 2.0, SBM-U 2.0, JJM** — all had 2025-26 horizons; today is FY 2026-27. What replaced/extended them is *the* open question in this corpus. ⚠️
2. 16th Finance Commission ULB grant structure. ⚠️
3. MPLADS 2023 guidelines PDF → encode permissible/prohibited works list (machine-readable). 
4. GVMC annual budget heads (own capital works funding). ⚠️
5. AP MLA constituency development fund — exists? amount? ⚠️
6. CRIF (Central Road & Infrastructure Fund) route for road works via MP recommendation. ⚠️

## 7. Sources

- [MPLADS portal](https://mplads.gov.in/) · [Revised Guidelines April 2023 (PDF)](https://www.mplads.gov.in/MPLADS/UploadedFiles/MPLADSGuidelinesApril2023.pdf) · [PIB on 2023 guidelines](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2155040&reg=3&lang=2)
- [PM India — AMRUT 2.0 cabinet approval](https://www.pmindia.gov.in/en/news_updates/cabinet-approves-the-atal-mission-for-rejuvenation-and-urban-transformation-amrut-2-0-till-2025-26/) · [AMRUT 2.0 operational guidelines (PDF)](https://amrut.mohua.gov.in/uploads/AMRUT_2.0_Operational_Guidelines.pdf) · [PIB — AMRUT 2.0 + SBM-U 2.0 launch](https://www.pib.gov.in/PressReleasePage.aspx?PRID=1760039)
- [The News Minute — AP Budget 2025 (Talliki Vandanam, Annadata Sukhibhava)](https://www.thenewsminute.com/andhra-pradesh/andhra-budget-2025-tdp-govt-to-implement-thalliki-vandanam-and-annadata-sukhibhava) · [ThePrint — Super Six delivery](https://theprint.in/india/governance/naidu-govt-moves-to-deliver-two-more-super-six-promises-in-budget-what-about-rest-asks-ysrcp/2516677/) · [sarkariyojana — AP schemes list](https://sarkariyojana.com/andhra-pradesh/)
