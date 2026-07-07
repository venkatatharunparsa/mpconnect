# HACKATHON BUILD PACK — Code for Communities (Google × hack2skill)
*PS: "People's Priorities — AI for Constituency Development Planning" · Submission deadline: Wed Jul 8, 11:59 PM IST (~34h) · This file is the complete war plan: strategy, hour plan, build prompts, README skeleton, seed spec, demo script, submission checklist.*

---

## 1. Strategy lock (read once, then never re-debate)

**The PS is our system.** Multilingual citizen input → recurring themes → demand hotspots → data fusion → ranked development works for an MP. We built this on paper for weeks. The submission tilt: lead with **development planning intelligence** (their emphasis), keep **verified closure + abuse defense** as our differentiators (nobody else will have them).

**The organizer's own words are our positioning:** don't out-tech Google — go to the roots. Our roots: a sourced Visakhapatnam authority registry, real GVMC complaint taxonomy from a field study, MPLADS statutory mechanics, and a political-survival + abuse-defense design. One-liner everywhere: **"Google provides the intelligence. We provide the ground truth it stands on."**

**Product name for submission:** MPconnect — People's Priorities Engine for Visakhapatnam Lok Sabha constituency.

**The seven demo moments (= scope; anything not serving these is cut):**
1. A **Telugu voice note** (browser mic or Telegram) becomes a structured suggestion in seconds — Gemini multimodal, one call.
2. **40 submissions become one Demand** — "school upgrade, Gajuwaka: 40 citizens" — merge shown live, split shown live.
3. **Demand hotspot map** — Google Map of the constituency, clusters glowing by volume/urgency.
4. **The PS's own example, working:** school-upgrade demand cluster vs a proposed vocational centre — side-by-side evidence panel fusing citizen demand with **real UDISE school data + Census demographics + travel distance**, producing a data-weighted recommendation.
5. **Ranked works list for the MP** — priority score breakdown + **MPLADS funding pack** (₹5cr/yr, 45/75-day statutory clocks) auto-drafted.
6. **Citizen-verified truth loop** — official claims "done," citizen denies in chat, item publicly reopens. (Our soul; 60 seconds of demo.)
7. **War-room attack absorbed** — burst of templated fake reports → coordination queue quarantines them → public map untouched.

## 2. Architecture (hackathon edition — decisions final)

```
Next.js 14 (App Router, single repo)  ── deployed on Cloud Run (or Vercel fallback)
├── /submit        citizen chat UI (mic, photo, text — WhatsApp-style)
├── /voice         Gemini Live browser voice agent ("toll-free" experience)
├── Telegram bot   REAL messenger channel (grammY, 5-min setup, no approval)
├── /dashboard     MP command center: Google Map, ranked demands, evidence panels
├── /review        human-gate console (merge review, coordination queue)
├── /vision        the vision page (from VISION.md)
└── /p/[id]        public demand page (rally point + share card)

Postgres (Neon/Supabase free tier) — tables: events (append-only + hash chain),
  submissions, demands (master problems), authorities (real KB), datasets
  (udise/census slices), rank_scores
Gemini API: multimodal extraction (audio/image/text→JSON), embeddings for merge,
  ranking explanations, Live API for voice
Adapters socketed (interface + stub + README note): WhatsApp BSP, Exotel toll-free,
  Bhashini ASR (production Telugu path), SMS-DLT
```
Simplifications vs production TDD (documented in README as deliberate): no queue infra (direct async calls), no projections framework (event log + direct tables), no auth beyond a demo role switcher, hash chain kept (one function, big optics).

## 3. Hour plan (34h, 4 people: A=platform, B=channels/AI, C=intelligence, D=front/story)

| Hours | A (platform) | B (channels/AI) | C (intelligence) | D (front/story) |
|---|---|---|---|---|
| 0–2 | repo+CLAUDE.md+deploy pipeline live | Gemini key + extraction call working in isolation | seed spec: KB + datasets + synthetic corpus | Next.js shell, nav, design tokens |
| 2–6 | events+hash chain+schema | /submit chat UI + extraction wired | merge engine (embeddings+geo+θ) | dashboard map + demand list |
| 6–10 | demand/authority tables + APIs | Telegram bot live end-to-end | ranking v0 + score breakdown | /p/[id] public page + share card |
| 10–14 | review console APIs | voice page (Gemini Live) | **data fusion: UDISE+Census evidence panel** | evidence panel UI (beat 4) |
| 14–18 | verification loop backend | verification in chat UIs | MPLADS pack generator | /review UI (merge + coordination queues) |
| 18–22 | abuse: rate limits+coordination score | polish channel errors | seed full demo dataset | /vision page + timeline view |
| 22–26 | **integration sweep — all 7 moments** | *(sleep shift rotates through here)* | fix ranking edge cases | README final + architecture diagram |
| 26–30 | bug bash on live URL | bug bash | bug bash | **record demo video** (before exhaustion) |
| 30–34 | freeze, submission form, links check | backup video takes | final seed reset | submit + buffer |

Hard rules: deploy from hour 2 and integrate on the live URL continuously (no "it works locally" at hour 30). Video recorded by hour 30. Feature freeze at hour 30 — the last 4 hours are for submission mechanics and disasters.

## 4. Build prompts (Claude Code/Cursor — sequential, one commit each)

Use the guardrails block from prompts-playbook-v1.0.md on every prompt. Hackathon CLAUDE.md (Prompt H0) is shorter but keeps the sacred three: append-only events, citation-or-silence for authorities/schemes, citizen content = untrusted (structured outputs only).

**H0 — scaffold:** Next.js 14 + TS + Tailwind + Drizzle + Postgres; `docs/` gets all 18 project MDs; CLAUDE.md with the sacred three + scope = the 7 demo moments; deploy to Cloud Run/Vercel; CI lint+build. *Done when: hello-world on public URL.*

**H1 — event core:** `events` append-only table with per-demand hash chain (SHA-256 prev-hash), `appendEvent()`, timeline query. *Done when: tamper test fails loudly.*

**H2 — Gemini extraction:** one server action: {audio|image|text, lang} → Gemini multimodal → strict JSON {type: suggestion|grievance, category (seed taxonomy from docs/functional-requirements FR-UND-02), location_text, ward_guess, urgency, summary_en, summary_te, confidence}. Citizen content fenced as data; zero tools; retry+schema-validate. *Done when: a real Telugu voice note file returns correct JSON.*

**H3 — submit chat UI:** WhatsApp-style page: mic record, photo upload, text; shows extraction as chat reply with reference ID (VZG-xxxx); one clarifying question when location confidence low; Telugu/English toggle. *Done when: voice note → ID returned in chat on the live URL.*

**H4 — Telegram bot:** grammY webhook → same intake path; reply with ID + status command. *Done when: a real phone files via Telegram and it lands in the DB.*

**H5 — merge engine:** Gemini embeddings + geo distance + category + time window → score; ≥θ_hi auto-merge into Demand (affected_count = distinct phone/chat identities), band → review queue, else new Demand; split operation. *Done when: seeded 40-report cluster → one Demand, affects 40; split works.*

**H6 — dashboard:** Google Maps JS: constituency + pilot wards, Demand clusters sized by affected×urgency; ranked list with score breakdown drawer; timeline view rendering the event chain. *Done when: map tells the story at a glance.*

**H7 — data fusion (THE PS BULLSEYE):** load `datasets/udise_wards.json` + `datasets/census_wards.json` (real values, sources cited in-file); evidence panel for a Demand: demand size vs relevant dataset (school demands → enrollment, capacity, nearest-school distance) vs competing proposal; Gemini writes the comparison narrative FROM THE NUMBERS ONLY (prompt forbids outside facts; every figure rendered with source). *Done when: school-vs-vocational comparison renders with cited numbers.*

**H8 — ranking + MPLADS pack:** rank = f(affected, urgency, recurrence, equity flag, dataset-gap score) with visible breakdown; "Generate MPLADS pack" button → pre-filled work recommendation (description, location, beneficiaries from affected count, cost band from config, SC/ST earmark note, 45/75-day statutory clocks) as printable page; advisory watermark. *Done when: judge can click from ranked list to a filed-looking pack.*

**H9 — verification loop:** demo-role switcher (citizen/official/MP); official marks "work done" → citizens' chat asks confirm/deny → deny reopens + red badge + false-closure counter; confirm → "citizen-verified ✓" with distinct visual weight everywhere. *Done when: moment 6 runs end to end in two browser tabs.*

**H10 — abuse defense demo:** per-identity rate limit; coordination score (burst + templated-text similarity + cold identities) → quarantine queue in /review; "simulate attack" dev button firing 15 templated reports → they quarantine, map unchanged. *Done when: moment 7 is demoable in 30 seconds.*

**H11 — voice agent:** /voice page: Gemini Live (te-IN) mic conversation → slot-fill → read-back → same intake path → ID on screen; Exotel/Twilio adapter interface + stub file + README section "plugging the real toll-free number." *Done when: spoken Telugu round-trip files a submission.*

**H12 — public demand page + share card:** /p/[id]: status, affected count, evidence timeline, geo-verified "affects me too" (OTP-less demo: browser geo + phone field), OG-image share card (title, count, status, QR). *Done when: WhatsApp-forwarded link renders a rich card.*

**H13 — vision page + README + polish:** /vision from VISION.md (condensed, with the feature matrix); README per §6 below; empty states, Telugu labels, loading states; seed reset command `pnpm demo:reset`. *Done when: a stranger can run the demo from the README in 5 minutes.*

## 5. Seed data spec (C builds hour 0–2; everything demo-critical depends on it)

1. **Authorities:** ~25 entries for pilot wards from docs/authority-kb-visakhapatnam-v0.1.md — only ✅ entries, each with source_url + verified_on. Unverified = excluded (we say so in README; that's the citation-or-silence flex).
2. **Datasets:** UDISE+ (schools: enrollment, classrooms, distance) and Census (ward population, literacy) for 3 pilot wards — pull real numbers from udiseplus.gov.in / censusindia portals where fetchable tonight; where a figure can't be verified in time, mark `"estimated": true` and render it as such. NEVER invent a number silently.
3. **Synthetic citizen corpus:** ~120 submissions across the FS taxonomy: 40-cluster (school upgrade, Gajuwaka-class ward), 15-cluster (drainage), 10-cluster (streetlights), singles, 3 Telugu voice-note audio files (record yourselves), 10 with photos, one competing proposal (vocational centre), 15 templated attack reports for the quarantine demo. All names/phones obviously synthetic; file marked SYNTHETIC.
4. **Demo state:** one demand mid-verification (for moment 6), verified-fix stats pre-populated so the dashboard isn't empty.

## 6. README skeleton (D owns; this is 30% of shortlisting — write it like the pitch)

```
# MPconnect — People's Priorities Engine
One line: Citizens speak in Telugu; the MP sees ranked, evidence-backed development
priorities; nothing counts as done until citizens confirm it.

[hero screenshot] [live demo URL] [3-min video link]

## The problem (their PS, our ground truth)
3 lines + the Arilova story + the 90%-resolved/78%-dissatisfied stat (sourced).

## What works right now  ← table of the 7 moments, each with GIF
## Try it in 2 minutes    ← exact demo steps a judge can follow
## How it works           ← architecture diagram (agents + human gates + event chain)
## The agent system       ← Intake/Merge/Ranking/Verification agents, each with its
                            tool + its human gate + why it refuses to guess
## Google technology used ← Gemini multimodal / Live / embeddings, Maps, Cloud Run
## Where we deliberately didn't use Google ← Bhashini adapter (better Telugu ASR
                            path), and why that judgment matters
## Built / Socketed / Vision ← 3-column feature matrix (socketed = adapter in code)
## The ground truth       ← the /docs folder: 18 research+design documents, field-
                            study citations, real authority registry, abuse defense
## Team · License
```

## 7. Demo video script (3 min — record at hour 30, D directs)

0:00–0:20 The problem: 8 channels, no truth (Arilova story, one map graphic).
0:20–1:00 Moments 1–3: Telugu voice note → structured → merges into "affects 40" → hotspot map.
1:00–1:40 Moments 4–5: school-vs-vocational evidence panel (their PS example, working) → ranked list → MPLADS pack.
1:40–2:20 Moment 6: "work done" claimed → citizen denies → public reopen. Line: "In every other system this was closed. In ours, citizens are the closing authority."
2:20–2:45 Moment 7: attack simulated → quarantined → map untouched. Line: "Built for Indian politics, not a demo room."
2:45–3:00 Vision card: constituency → state → nation; docs folder flash; team; "Google's intelligence, standing on ground truth."

## 8. Submission checklist (hour 30–34)

- [ ] Live URL loads logged-out, seeded, on mobile
- [ ] Repo public: README (with GIFs), /docs (18 files), LICENSE, clean history
- [ ] Video uploaded (unlisted YouTube) + linked in README + submission form
- [ ] Submission form: check for PPT requirement (hack2skill often wants one) — if so, /vision page → 8 slides, 30 min max
- [ ] All secrets out of repo; .env.example present
- [ ] `pnpm demo:reset` works from clean clone
- [ ] One full seven-moment rehearsal on the live URL by someone who didn't build it
- [ ] Submit 2+ hours before 11:59 PM — hack2skill portals die at deadline

## 9. What we do NOT do tonight (the discipline list)

Real WhatsApp BSP · real toll-free number · real OTP/auth · trust-score ML · full ops queues · notifications infra · IVR robustness · state-scale anything. Every one of these has an adapter, stub, or doc pointer instead — absence of infrastructure, presence of intention. That's what "socketed" means, and it's a strength when it's honest.
```
