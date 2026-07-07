# MPconnect — People's Priorities Engine

**Citizens speak in Telugu. The MP sees ranked, evidence-backed development priorities. Nothing counts as "done" until citizens confirm it.**

> Code for Communities (Google × hack2skill) · PS: *People's Priorities — AI for Constituency Development Planning* · Constituency: Visakhapatnam Lok Sabha

🔗 **Live demo:** `TODO_URL` · 🎬 **3-min video:** `TODO_VIDEO` · 📚 **[19 research & design documents](./docs/)**

![MPconnect Hero Dashboard](/public/screenshots/dashboard.png)

## The problem (from the ground, not from imagination)

A citizen in Visakhapatnam has **eight** disconnected ways to report a need — and no way to know if any of them worked. Andhra Pradesh's grievance system claims **90% resolution while an independent survey found 78% dissatisfaction**; 29,400 complaints were reopened for faulty closure ([The Wire investigation](https://m.thewire.in/article/government/too-many-delays-false-closures-why-andhras-public-grievance-redressal-system-is-facing-backlash)). In a field study inside GVMC, citizens asked for exactly one thing: **proof before closure** ([eGov/CEPT study](./docs/validation-report-v1.0.md)). Meanwhile the MP — who controls ₹5 crore/year in MPLADS funds — has no objective way to weigh competing development demands.

## What works right now — the 7 moments

| # | Moment | What you'll see |
|---|---|---|
| 1 | Telugu voice → structured demand | Voice note → Gemini multimodal → category, location, urgency in seconds |
| 2 | 40 voices → 1 Demand | Duplicate submissions merge into a Master Demand: "affects 40 citizens" (reversible) |
| 3 | Demand hotspot map | Google Map of the constituency, clusters by volume × urgency |
| 4 | Evidence-weighed decisions | The PS's own example: school upgrade vs vocational centre, fused with UDISE + Census data |
| 5 | Ranked works + MPLADS pack | Priority scores with visible breakdowns → auto-drafted funding recommendation with statutory 45/75-day clocks |
| 6 | Citizen-verified closure | Official claims "done" → citizen denies in chat → publicly reopens. Citizens are the closing authority |
| 7 | Attack absorbed | Simulated fake-report flood → coordination detector quarantines it → public map untouched |

````carousel
![Evidence Weighed Decisions & Rally Points](/public/screenshots/rally-point.png)
<!-- slide -->
![Operator Review & Duplicate Validation Queues](/public/screenshots/review.png)
<!-- slide -->
![Virtual Governance System Vision Canvas](/public/screenshots/vision.png)
````

## Try it in 2 minutes

1. Open `TODO_URL/submit` — hold the mic, speak in Telugu (or type in English). Get your reference ID.
2. Open `TODO_URL/dashboard` — find your submission merged into a Demand on the map; open its timeline (hash-chain verified ✓).
3. Switch role to *Official* → mark a demand "work done" → switch back to *Citizen* → **deny it** → watch it publicly reopen.
4. Open `TODO_URL/review` → press *Simulate attack* → watch 15 templated reports quarantine.

## How it works

```
Citizen (Telugu voice / text / photo / Telegram / browser voice agent)
   → Intake Agent    — Gemini multimodal → strict JSON (zero tools, fenced input)
   → Merge Agent     — embeddings × geo × category → Demands (human gate in the gray band)
   → Ranking Agent   — demand × urgency × recurrence × equity × PUBLIC-DATA GAP
   → Routing         — source-cited authority registry (refuses to guess: no citation, no route)
   → Verification Agent — citizens confirm or deny every claimed fix
All of it on an append-only, hash-chained event ledger — history nobody can rewrite.
```

**The agent design principle: AI proposes, humans dispose, citations or silence.** No authority name, scheme fact, or statistic comes from model memory — only from the cited registry and datasets. Unverifiable seed figures are marked `estimated` and rendered as such.

## Google technology used

Gemini multimodal API (Telugu audio/photo/text → structured extraction) · Gemini Live API (browser voice agent) · Gemini embeddings (merge engine) · Google Maps Platform · Cloud Run.

**Where we deliberately didn't use Google:** production Telugu ASR routes through a **Bhashini adapter** (better Telugu coverage) — the interface ships in this repo. Knowing when not to use a tool is part of the engineering.

## Built / Socketed / Vision

| Built tonight | Socketed (adapter in code, plug pending) | Vision (docs/) |
|---|---|---|
| 7 moments above | WhatsApp Business Cloud API | Full escalation engine, help desk |
| Event ledger + hash chain | Exotel toll-free line → same voice agent | DISPUTE evidence ledger, community layer |
| Authority registry (cited) | Bhashini ASR (production Telugu) | State-scale sharding, DIGIT interop |
| Abuse quarantine | DLT SMS gateway | Citizen-verified stats as public data |

## The ground truth (our unfair advantage)

The [`docs/`](./docs/) folder holds **19 documents**: field research on Visakhapatnam's actual grievance systems, a source-cited authority KB, the political-reality analysis (why govt platforms die each election cycle — and how this one survives), a seven-layer abuse defense, full FRD/NFR/TDD, and the phased execution plan to production. This prototype is the thinnest working slice of a system designed to survive contact with Indian political reality.

## Run locally

```bash
pnpm install
cp .env.example .env.local   # fill DATABASE_URL, GEMINI_API_KEY, NEXT_PUBLIC_GOOGLE_MAPS_KEY
pnpm db:push && pnpm seed
pnpm dev
```

**API key hygiene:** The browser voice page uses `NEXT_PUBLIC_GEMINI_API_KEY` for Gemini Live. Restrict that key in [Google AI Studio](https://aistudio.google.com/) to your deployed domain and the Live API only — never commit real keys.

### Plugging the real toll-free line

The `TollFreeAdapter` in `src/lib/adapters/tollfree.ts` is the socket for PSTN callers. When Exotel provisions the number: set `EXOTEL_SID` / `EXOTEL_TOKEN`, point the Exotel voice applet to your `/api/adapters/exotel/voice` webhook, and bridge the media stream to the same `extractSubmission` → `POST /api/submissions` path the browser `/voice` page uses. The hackathon demo uses the browser agent; the adapter stub ships ready to wire.

## Team

OrbitX — team of 4. Built with AI-assisted development under the contracts in [CLAUDE.md](./CLAUDE.md).

MIT License.
