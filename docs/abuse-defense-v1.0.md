# Abuse Defense — Surviving Coordinated Fake-Report Attacks (v1.0)
*2026-07-07. Threat: opposition workers (or anyone) flooding the system with fabricated problems — to embarrass the government, to stress-test the platform, or to poison its data. Companion to vizag-political-reality-v1.0 (Pattern 3: industrialized digital war rooms). FRD updated with FR-VAL-05..08.*

## 0. The core insight: fabrication is expensive in OUR system, cheap in theirs

A fake report attacks a normal grievance portal successfully because the portal *asserts* problems ("500 complaints received!"). Our system never asserts an unverified problem — it grades everything. A fabricated pothole in VGPS becomes a **low-trust, uncorroborated, evidence-less claim sitting in a quarantine state**, and if it somehow advances, the field check produces a hash-chained "unfounded — verified on site with photo" record *against the attacker*. We don't need to make fabrication impossible. We need to make it **unprofitable**: costly to attempt, incapable of reaching public surfaces, and reputationally boomeranging when caught. Seven layers do this.

## Layer 1 — Identity cost (every report is anchored to a phone number)

Our channel choices already do the heavy lifting: WhatsApp, SMS, and voice are all **phone-number-bound** — there is no anonymous web-form flood surface (web submission requires OTP). One number = one voice per problem (already FR-VAL-02).
- **Rate limits per number:** soft cap N reports/day (config, default 3): beyond it, reports are *accepted but queued for review*, never auto-processed. Soft, because shared household phones and genuine bad days exist; the assisted-intake role (authenticated staff) is exempt.
- **New-number cold start:** a number with no history starts at trust weight w₀ < 1. Trust rises with verified behavior (a confirmed resolution, a corroborated report, a geo-consistent photo) and decays with unfounded reports.
- SIM farms raise attacker cost per fake identity to real money; combined with Layer 3 they buy very little.

## Layer 2 — Evidence economics

- Categories where fabrication is cheap (pothole, garbage, streetlight) get **evidence-weighted confidence**: a report with a fresh, EXIF-geo-consistent photo scores high; a bare text claim scores low and *cannot by itself* push a problem past the corroboration gate (Layer 3).
- Image forensics (already FR-UND-06): perceptual-hash reuse (same pothole photo filed 40 times, or scraped from the internet), EXIF time/place inconsistency, AI-generation heuristics → flags, never silent rejection.
- Voice reports are naturally expensive to fake at scale (a human must talk) — an under-appreciated anti-bot property of our voice-first design.

## Layer 3 — The corroboration gate (the single most important control)

**No problem becomes publicly visible or rankable on one voice.** A new Master Problem enters state `claimed` and needs, before promotion to `validated-public`:
- **k independent reporters** (default 3) with *unlinked* identities (different numbers, no shared-device signature, geo-plausible — see Layer 4), **or**
- **one field verification** (ward staff / assisted-intake verifier confirms on site), **or**
- **strong evidence** (geo-consistent fresh media) *plus* one additional independent reporter.

Consequences: a lone fabricated report never appears on any dashboard, heat map, or shareable card — it dies quietly in `claimed`. Legitimate lone reporters lose nothing: their report is acknowledged, tracked, routed for field check — just not *published* until corroborated. (This also fixes an honesty problem: publishing unverified claims was always a risk to citizens on the receiving end of false accusations, e.g. encroachment reports.)

## Layer 4 — Coordination signatures (catching the war room)

Organic and coordinated reports look different, measurably:
| Signal | Organic | Coordinated attack |
|---|---|---|
| Arrival pattern | spread over days, clustered after rain/events | burst within minutes-hours |
| Identity age | mixed, mostly aged numbers | many new/cold numbers |
| Text similarity | varied phrasing, code-mixed | templated/near-duplicate wording |
| Geo pattern | reporters live/work near the problem | reporter locations implausible or unknown |
| Report history | mixed categories over time | single-purpose accounts |

A **coordination score** over these signals runs on every merge cluster. High score → the cluster is routed to a dedicated **"suspected coordinated" ops queue** (the "spam section" the founder asked for — but reviewable, not a trash can), auto-merge is suspended for it, affected-count contributions are frozen at trust-weighted values, and nothing from the cluster reaches public surfaces pending human review. Every decision (attack / genuine surge) becomes labeled training data — and genuine surges DO happen (cyclone flooding produces exactly a burst), which is why a human, not a threshold, makes the final call, aided by the seasonal context the trend engine already computes.

## Layer 5 — The boomerang (verification cuts both ways)

If a fabricated problem survives to routing, the field check is the backstop: verifier visits, finds nothing, files **`unfounded` with on-site photo — hash-chained, timestamped**. Then:
- Every reporter identity on it takes a **large trust decay** (silent — see Layer 6).
- Repeated unfounded filings (config: 2 strikes / 90 days) → **shadow limitation**: reports still accepted and politely acknowledged, but auto-quarantined pending corroboration by *unrelated* identities. No public "banned" state — martyrdom is the attacker's second prize and we refuse to award it.
- The unfounded record itself is the political counter-weapon: if a war room claims "government ignores problem X," the platform's public answer is a verified, photographed, hash-chained "X was investigated on <date>; no such condition found" — the attacker has manufactured proof of the system's diligence.

## Layer 6 — Communication policy under attack (deny the attacker information)

- FR-VAL-03 (notified rejection with reason) stays for ordinary citizens, but abuse-flagged reports get the **truthful-but-generic** reason: "could not be verified; awaiting corroboration or evidence" — accurate, appeal-preserving, and teaches evasion nothing.
- Thresholds (k, caps, trust weights, coordination-score internals) are **not published**. We publish that defenses exist and that ranking counts only verified voices (deterrence + trust), never the tuning (evasion manual). This is a deliberate, documented exception to our radical-transparency stance: methodology public, tripwires private.
- Public dashboards label states honestly: `claimed (unverified)` never renders as a real problem — so a screenshot of a fake report proves nothing.

## Layer 7 — Surviving the load itself (they WILL stress-test us)

"Let's see if the govt product survives" traffic is just load: the k6 monsoon-surge test (5× for 14 days, NFR-CAP-02) is also our attack drill. Additions: per-number and per-IP throttles at the channel edge (cheap rejects before pipeline cost), queue back-pressure that sheds *processing* priority for low-trust bursts while never dropping accepted reports (durability promise holds — attackers' reports sit cheaply in quarantine, costing us storage pennies and them SIM cards), and a cost-meter alarm when ₹/report spikes (early attack telemetry).

## What changed in the FRD (v1.2)

- **FR-VAL-05 (P1):** corroboration gate — no Master Problem is publicly visible/rankable on a single uncorroborated voice; promotion rules as Layer 3.
- **FR-VAL-06 (P1):** per-identity trust scoring with decay on unfounded outcomes; affected-count and support are trust-weighted.
- **FR-VAL-07 (P1):** coordination-score detection on merge clusters; suspected-coordinated ops queue; auto-merge suspension + public-surface freeze pending human review; decisions become labeled data.
- **FR-VAL-08 (P1):** shadow-limitation regime for repeat-unfounded identities; `unfounded` field-check outcome as a first-class, hash-chained event; generic-reason notification for abuse-flagged reports.
- Prototype (P0) carries lightweight versions for the demo: rate limits, single-voice counting, `claimed` state, and the quarantine queue UI stub — full trust scoring and coordination detection land in P2 with real traffic to tune on.

## The honest limits

A patient adversary with aged SIMs, real photos of *real* minor problems, and organic-looking pacing can still inject noise — this defense raises cost and caps blast radius; it cannot make fabrication impossible (nothing can, short of identity systems we refuse on inclusion grounds). Bot-voice attacks on the toll-free line are the weakest edge (speech synthesis is cheap now); mitigations at P2: caller-ID velocity checks and challenge questions on cold numbers. And every screw we tighten risks excluding a real citizen — which is why every control here *queues for humans* rather than auto-rejects, and why the shared-household-phone case is explicitly protected. The metric that tells us we've over-tightened: legitimate-report rejection rate, reviewed monthly, published annually.
