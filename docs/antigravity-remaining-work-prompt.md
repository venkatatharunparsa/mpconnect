# Prompt for Antigravity — close the remaining VGPS/MPconnect gaps (Telegram-only)

*Paste this whole block into Antigravity as the task prompt. It assumes the agent has repo access and will read CLAUDE.md automatically.*

---

## Context

Repo: MPconnect/VGPS — Next.js 14 + TypeScript + Drizzle/Postgres, event-sourced hash-chained core. Read `CLAUDE.md` first and obey its six contracts (append-only events, citation-or-silence, untrusted-input handling, human gate on ambiguous/low-confidence decisions, config-not-code for thresholds, no invented facts) on every task below.

The core intake → merge → rank → route → verify pipeline, Telegram bot, browser voice agent, dashboard, review console (validation/merge/quarantine), abuse defense, evidence panel, and MPLADS pack generator are already built and working — do not rebuild these. This prompt covers only what's left.

## Hard constraint: Telegram-only

**Do not build a WhatsApp adapter. Do not wire the real Exotel/toll-free line.** Telegram (`src/server/adapters/telegram-bot.ts`) is the only live citizen messaging channel for this build. Where a requirement below says "notify the citizen," it means: send a Telegram message via the bot to the citizen's stored `citizenKey` (their Telegram chat id). Leave `src/server/adapters/tollfree.ts` as the existing stub — do not touch it. Do not add SMS as an outbound notification path even though inbound SMS intake exists.

## Step 0 — Branch hygiene (do this first, 10 min)

Confirm you're working on `main` with no stray uncommitted changes from other branches (there was drift onto a `feat-separate-deployments` branch previously — reconcile it into `main` if it isn't already, don't leave two divergent histories). Run `pnpm typecheck && pnpm test` before starting to confirm a clean baseline.

---

## Task 1 — Citizen notification pipeline over Telegram (FR-NTF-01, P0 — the biggest gap)

Right now citizens only get a response in the same request/response turn (the chat/bot reply). Nothing proactively pushes updates as a demand moves through its lifecycle.

Build:
1. A `notifyCitizen(citizenKey, event, payload)` function (new file, e.g. `src/server/services/notifications/notify.ts`) that sends a Telegram message via the existing bot instance for a fixed set of lifecycle moments: submission validated, routed/assigned, fix claimed (verification request — this one may already exist as a poll; make it push-initiated, not poll-only), and final state (`resolved_verified` / `resolved_unverified` / `reopened`).
2. Hook this into the existing lifecycle transition points (`src/server/services/lifecycle/lifecycle.ts`, `verification.ts`, `verification-timeout.ts`, `routing.ts`) so a state change triggers a notification, not just an event-log entry. Only trigger for `channel === 'telegram'` citizens for now — other channels silently no-op (log it, don't fail).
3. Respect FR-NTF-04 (P2, optional if time is short): cap non-critical notifications to 2/day per citizen, batch the rest into a digest.
4. Telugu-first copy, reuse the existing `labels.ts`/`i18n.ts` string patterns already used elsewhere.
5. Tests: a state transition produces exactly one notification call with the right template; capped citizens don't get spammed.

**Done when:** marking a demand `fix_claimed` in the dashboard causes the original Telegram reporter(s) to receive a push message asking to confirm/deny — not just a poll they'd have to check for.

---

## Task 2 — PROJECT and DISPUTE lifecycle state machines (FR-LCM-01/03/04/05)

Only GRIEVANCE has a real state machine today (`src/server/services/lifecycle/lifecycle.ts`). PROJECT and DISPUTE are undifferentiated.

Build:
1. A lifecycle classification step: rules-first (e.g. recurring GRIEVANCE with N reopens/reoccurrences → propose PROJECT), Gemini-assisted proposal, human confirmation required before commit (never auto-classify silently) — per FR-LCM-01.
2. PROJECT state machine: `identified → scoped → cost_estimated → funding_mapped → recommended → sanctioned → tendered → executing → delivered → citizen_verified`, including the honest holding states `awaiting_funds(reason, since)` and `deprioritized(reason)` — deprioritization must log a citizen-visible reason, never silently vanish.
3. DISPUTE state machine: append-only case ledger (every complaint/response/inspection/media item hash-chained, reuse the existing event infrastructure) — no SLA clock, no "resolved" claim. Add a one-click export (chronology + evidence index, RTI-annexure-shaped JSON or PDF).
4. FR-LCM-05: reclassification between lifecycle types with full history intact (e.g. a recurring pothole GRIEVANCE becomes a resurfacing PROJECT) — must be a human-confirmed action, logged as an event.
5. Tests: illegal transitions throw; reclassification preserves prior events; DISPUTE never auto-resolves.

**Done when:** a demand can be reclassified from GRIEVANCE to PROJECT through a human action in the review console, and a DISPUTE-classified demand shows a growing evidence ledger with no fake SLA countdown.

---

## Task 3 — Ops console: routing-ambiguity and transcription queues (FR-OPS-01/03, P0)

`ReviewConsole` currently has three tabs (Validation, Merge, Quarantine). Two P0 queues are missing entirely.

Build:
1. **Routing-ambiguity queue:** surface every demand currently in a `RoutingNeedsHuman` state (the data already exists via `routing.ts`'s `proposeRouting` returning `needsHuman`/`candidates` — it just isn't rendered anywhere). New tab: shows the demand, KB-suggested candidate authorities, and a two-click approve/override action that calls the existing `route-approve` endpoint. An override must log `RoutingCorrected` as a reusable precedent (already supported server-side per the bug-fix work — just needs the UI).
2. **Human transcription queue:** for any submission whose ASR confidence fell below the θ_asr threshold (extend the extraction pipeline to record this, if not already recorded), add a queue where a human can type/correct the transcript before it proceeds to classification. This queue doesn't exist at all today — build the repository query, API route, and console tab from scratch, following the existing pattern in `src/server/repositories/review-queues.ts`.
3. Tests: a demand with `needsHuman=true` appears in the routing queue and disappears once approved; a low-confidence submission appears in transcription queue and re-enters the pipeline once corrected.

**Done when:** all five ops queues (validation, merge, quarantine, routing-ambiguity, transcription) are live tabs in `/review`, each with working actions against seeded data.

---

## Task 4 — Authority KB staleness (FR-RTE-02, P0)

The `authorities` table already stores `sourceUrl` and `verifiedOn`, but nothing computes or surfaces staleness.

Build:
1. A computed staleness check: any authority entry with `verifiedOn` older than 180 days gets flagged.
2. Surface stale entries in a lightweight curator view (can be a simple tab/section in `/review` or a new `/admin/kb` page — pick whichever is less work) so someone can see what needs re-verification.
3. Don't build the full KB curator CRUD console (FR-ADM-01) unless time allows after everything else — that's explicitly a stretch, not required.

**Done when:** an authority record with a >180-day-old `verifiedOn` shows up flagged somewhere a human will actually see it.

---

## Task 5 — Surface the P1/P2 backend features that already exist but aren't wired into any UI

News ingestion (`src/server/services/intake/news-ingest.ts`), SMS intake (`sms-intake.ts`), the help desk (`helpdesk.ts`), and SLA escalation (`escalation.ts`) all have working services, API routes, and passing unit tests — but no UI surfaces them.

Build:
1. News-ingested candidate problems (`source=news`) must appear in a human-approval queue and **never** auto-join a Master Problem/Demand (FR-INT-08 — this is a hard constraint, verify it's actually enforced, not just intended).
2. Escalated demands (SLA breach, FR-ESC-02) should surface on the main dashboard regardless of administrative level — add a filter/badge, not a whole new page.
3. Help desk: a minimal chat surface (can live inside `/submit` as a mode toggle, or a small standalone page) that answers procedure/eligibility questions strictly from the existing retrieval service, and always offers "file this as a grievance?" (FR-HLP-02).
4. SMS-intake submissions should already flow through the normal pipeline — just confirm they render identically to other channels on the dashboard (no separate UI needed, just verification).

**Done when:** each of these four backend features has at least one place in the UI a human can actually see and act on its output.

---

## Definition of done (all tasks)

- `pnpm typecheck && pnpm test` passes (DB-dependent tests need a real `DATABASE_URL` — don't skip verifying against one).
- Every new state transition or human decision still appends an event (contract #1) — no silent state changes.
- No new citation-free facts anywhere (contract #6) — if a UI needs a fact, it must come from the KB/dataset/config, not model memory.
- No WhatsApp code, no live Exotel wiring — confirm this explicitly before finishing.
- Commit style matches the existing repo convention: `feat(<area>): <what>` / `test(<area>): <what>`, small commits, on `main`.
