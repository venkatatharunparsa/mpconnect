# Citizen Grievance Trends — Visakhapatnam / AP (v0.1)
*Phase 0 research output for VGPS/MPconnect — 2026-07-07*

**Honest framing:** public category-level grievance statistics for AP/Vizag are thin on the open web. This document records what is verifiable, what is strongly indicated, and exactly how to get the hard numbers. I am not inventing volumes.

## 1. What is verifiable ✅

**Statewide (The Wire investigation + govt response, 2025):**
- Revenue department is the hotspot: farmers/citizens allege "rampant delays, especially in **revenue offices**" — land records, assignments, certificates.
- 29,400 complaints reopened due to faulty resolutions; 1.75 lakh applications unaudited; 78% dissatisfaction (independent IVR survey) vs 90% claimed resolution.

**CPGRAMS scale (national):** disposal at ~26.5 lakh/year (2024); satisfaction ~50%. Confirms massive latent complaint volume flowing through formal channels nationally.

**GVMC's own complaint taxonomy** (what the city itself expects): water supply, streetlights, roads, sewerage & drainage, solid waste/garbage. GVMC runs a toll-free helpline (1800-425-00009) and a **WhatsApp complaints number (+91 96669 09192)** — validating our WhatsApp-first intake thesis: the city's own corporation already chose WhatsApp as a channel.

**Pothole/road-quality complaints in Vizag** are a recurring documented citizen theme, worsening each monsoon (local press).

## 2. Strongly indicated patterns (medium confidence, to be confirmed with data)

1. **Seasonality:** Vizag is a cyclone-belt coastal city; drainage/flooding/road-damage complaints should spike Jun–Nov (SW monsoon + NE monsoon + cyclone season). Design implication: intake surges 3–5x seasonally; the ranking engine needs seasonal-severity awareness (an October drainage complaint precedes flooding; the same complaint in February is routine maintenance).
2. **Two distinct grievance economies:**
   - *Urban/public:* GVMC civic categories (drainage, garbage, roads, water, streetlights) — high volume, community-shaped, our Master Problem engine's home ground.
   - *Rural + entitlement/personal:* revenue records, land, pensions (NTR Bharosa), ration, certificates — The Wire evidence says this is where delays, false closures, and bribery concentrate. Individually shaped, privacy-preserving flow.
3. **Trust gap is the trend, not just volume:** the documented pattern isn't just "many complaints" — it's *complaints about the complaint system* (false closures, forced withdrawals). A meta-grievance trend that is precisely our product's opening.

## 3. How we get the hard numbers (data acquisition plan)

| Source | What it yields | How |
|---|---|---|
| **ap.data.gov.in** — "AP State Public Grievance Redressal and Monitoring Mechanism" catalog ✅ exists | Historical PGRS volumes, possibly by district/department | Download + analyze; first task of Phase 1 data work |
| PGRS officer dashboard (meekosam) | Live category stats | Hands-on portal audit; some views may be public |
| **RTI applications** to GVMC + Visakhapatnam Collectorate | Complaint volumes by category/ward/month, resolution times | File early — 30-day clock; cheap and decisive |
| CPGRAMS state-wise reports (DARPG monthly PDFs) | AP central-subject grievance volumes | Scrape/download from darpg.gov.in |
| GVMC helpline/WhatsApp logs | The single best pilot dataset | Request via MP office partnership once engaged |
| Local press archive scan (yovizag, The Hindu Vizag edition, Sakshi/Eenadu Telugu) | Qualitative hotspot map (which wards flood, where garbage piles) | Build as a scraper later — this is our News Intelligence v0 prototype, scoped to one city |

## 4. Working hypothesis for pilot capacity planning (to validate, not to cite)

For a ~20 lakh population city where the corporation already runs multiple complaint channels, plan the prototype for **hundreds of complaints/day city-wide** as the right order of magnitude, with monsoon spikes. Dedup ratios on civic issues (many reporters, one pothole) plausibly 5–20:1 in dense wards — meaning Master Problem counts will be far smaller than ticket counts. **These are engineering sizing assumptions, not facts** — replace with RTI/portal data.

## 5. Implications already actionable

1. Classifier v0 taxonomy = GVMC's five civic categories + revenue/land + pensions/entitlements + electricity + health + education + police/safety. Matches both the city's own taxonomy and the statewide pain profile.
2. Build seasonal weighting into the ranking engine from day one.
3. The revenue-department cluster (land records, certificates) is high-volume but *personal* — it validates investing in the private-grievance flow, not just the public Master Problem flow.
4. File the RTIs now — by the time the prototype is built, real baseline data arrives.

## 6. Sources

- [The Wire — delays & false closures](https://m.thewire.in/article/government/too-many-delays-false-closures-why-andhras-public-grievance-redressal-system-is-facing-backlash) · [AP govt response](https://m.thewire.in/article/government/andhra-pradesh-govt-responds-to-the-wire-report-claims-public-grievances-being-addressed-effectively)
- [Complaint Hub — GVMC complaint channels (helpline, WhatsApp)](https://complainthub.org/gvmc-vizag-help/) · [GVMC water supply](https://gvmc.gov.in/gvmc/index.php/water-supply) · [National Services Portal — GVMC complaints](https://services.india.gov.in/service/detail/register-complaints-with-greater-visakhapatnam-municipal-corporation-andhra-pradesh-1)
- [yovizag — Vizag potholes](https://www.yovizag.com/vizagites-speak-their-minds-about-potholes-in-visakhapatnam-roads/)
- [ap.data.gov.in — AP grievance mechanism dataset catalog](https://ap.data.gov.in/catalog/ap-state-public-grievance-redressal-and-monitoring-mechanism)
- [The Cavalier — CPGRAMS 2026 stats](https://www.cavalier.in/cds-ota-current-affairs/2026-06-23/cpgrams-grievance-redress-2026) · [IMPRI CPGRAMS analysis](https://www.impriindia.com/insights/policy-update/beyond-digital-box-ticking-a-critical-analysis-of-indias-cpgrams/)
