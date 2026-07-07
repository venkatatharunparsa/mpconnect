# Bug Review — 2026-07-07 (pre-integration)
*Static review of the full intake→merge→verify path. Ordered by demo-kill risk. Run `pnpm typecheck && pnpm test` locally too — the sandbox couldn't compile-check, so type errors may exist beyond this list.*

**Status (2026-07-07 evening):** P0 (BUG-1–4), P1 (BUG-5–8), and P2 items BUG-9–12 addressed in code. Run `pnpm db:push` after pull (schema: `occurred_at` timestamptz, `evidence_narrative` column). Re-seed corpus to verify IC2.

---

## P0 — Demo killers (fix before IC2)

### BUG-1: The corpus seeding will quarantine its own 40-report cluster ⚠️ CRITICAL
**Where:** `src/app/api/submissions/route.ts` (fire-and-forget trigger) × `seed/corpus.ts` × `src/server/services/abuse-cluster.ts`.
**What happens:** corpus calls the real POST route → route fires `triggerMergeProcessing` immediately (fire-and-forget), **before** corpus applies backdating. So the 40 school submissions all carry `createdAt = now` when `checkCluster` sees them. By submission ~8: burst threshold (8 in 30 min) + templated texts (12 templates over 40 subs = repeats) + all-cold `SYN-` identities = **coordination score fires and quarantines the entire school cluster**. The "40 voices → 1 Demand" demo produces zero demands.
**Fix (do all three):**
1. Add a `deferMerge` flag: route skips `triggerMergeProcessing` when body has `deferMerge: true` (corpus sets it; corpus already awaits `processSubmission` itself *after* backdating — with backdated timestamps spread over 10 days, the burst signal correctly dies).
2. This also fixes **double-processing**: right now every corpus submission runs `processSubmission` TWICE (route's async + corpus's await) racing each other → duplicate/orphan demands with 0 submissions littering the dashboard.
3. Re-run `pnpm demo:reset && pnpm seed && pnpm tsx seed/corpus.ts` and verify: ~8 demands total, school demand affectedCount=40, zero quarantined SYN- rows, no orphan demands (`select id from demands where id not in (select distinct demand_id from submissions where demand_id is not null)`).

### BUG-2: `checkCluster` quarantines innocent bystanders ⚠️ CRITICAL for the live demo
**Where:** `src/server/services/abuse-cluster.ts` lines 25–55.
**What happens:** candidates are selected with `or(same category, same ward)` in the window, and on suspicion **every candidate is quarantined** — including legitimate reports that merely share the ward. During the judged demo: judge files a real MVP-ward report → you press "Simulate attack" (15 garbage/MVP templates) → cluster query sweeps the judge's report in → **the judge's live submission gets quarantined on stage.** Also quarantines already-`merged` submissions, silently corrupting demand counts.
**Fix:** (a) candidate filter becomes `and(same category, same ward)`; (b) quarantine only submissions whose text-similarity to the cluster's dominant template exceeds `textSimilaritySuspicious` (the signal exists in `abuse.ts` — use per-submission similarity, not cluster-wide verdict); (c) never quarantine `status='merged'` rows; (d) exclude the demand-linked ones from the sweep.

### BUG-3: On Vercel, merges may never run at all ⚠️ CRITICAL for the deployed URL
**Where:** `src/app/api/submissions/route.ts` line 102 (`triggerMergeProcessing(...).catch(...)`, not awaited).
**What happens:** on serverless, work scheduled after the response returns is not guaranteed to execute — the lambda freezes. Locally everything merges; on the deployed URL submissions can stay `extracted` forever and **no demands ever form**. This is invisible until you test on the live URL (why IC1 is on the live URL, not localhost).
**Fix (pick one):** simply `await triggerMergeProcessing(...)` in the route (adds ~1–3s to submission response — acceptable; the chat UI already shows a spinner), OR use Vercel's `waitUntil` (via `@vercel/functions`). Awaiting is the simple, certain option for the demo.

### BUG-4: Merge threshold is fragile for cross-lingual duplicates — tune with REAL embeddings
**Where:** `src/server/services/merge.ts` scoring + `CONFIG.merge.thetaHi = 0.82`.
**What happens:** a Telugu report and an English report about the same school will have embedding cosine ≈ 0.6–0.75 (cross-lingual). Score ≈ 0.55×0.7 + 0.25×0.9 + 0.15 + 0.05×1 ≈ **0.81 — just under 0.82**. Half the corpus lands in the review queue instead of auto-merging; the "40→1" becomes "40→1 + 17 pending review." The mock embedding (char-frequency) behaves even worse across scripts.
**Fix:** after BUG-1 is fixed, run the corpus with the **real** GEMINI key, print the score distribution (add a temporary log), and set θ_hi just below the observed cross-lingual cluster floor (likely 0.72–0.78). Also: **normalize the real embedding vector** in `embedText` (mock is normalized, real path returns raw values → thresholds mean different things in mock vs real mode):
```ts
const mag = Math.sqrt(values.reduce((s, v) => s + v * v, 0)) || 1;
return values.map((v) => v / mag);
```

## P1 — Correctness (fix before freeze)

### BUG-5: Low-confidence submissions bypass the human gate and merge anyway
**Where:** route lines 39–45 vs 100–103. A submission with `needs_human=true` (confidence < 0.6) still calls `triggerMergeProcessing`. Contract says below-threshold → human validation queue, not auto-merge.
**Fix:** condition the trigger: `if (!overRateCap && body.extraction && !payloadFlags.needs_human)`.

### BUG-6: Hash-chain fork under concurrent appends
**Where:** `src/server/services/events.ts` `appendEvent` — read-prev-then-insert without any lock. Two concurrent events on the same demand (e.g., merge + rank + corroboration all appending) can read the same `prev` → two events share a `prevHash` → `verifyChain` reports the chain broken → the "chain verified ✓" badge shows ✗ on stage.
**Fix (cheap):** wrap in a transaction with a Postgres advisory lock:
```ts
await db.transaction(async (tx) => {
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${input.demandId}))`);
  // read prev + insert inside the lock
});
```
(Only needed when `demandId` is set; submission-only events use GENESIS and don't chain.)

### BUG-7: `verifyChain` can break on timezone round-trips
**Where:** `events.ts` — the hash includes `occurredAt.toISOString()`, but the column is `timestamp` **without timezone**. postgres-js reads it back assuming local time; on a non-UTC machine (your Windows laptops are IST) the recomputed ISO string differs → verifyChain false-negative. Vercel is UTC so it *may* pass in prod and fail locally, or vice versa — nondeterministic across environments.
**Fix:** change the column to `timestamp("occurred_at", { withTimezone: true })` in schema + `db:push`, OR (zero-migration option) store the canonical ISO string in the event payload and hash that instead of the DB round-trip.

### BUG-8: Rate-cap message tells citizens nothing
**Where:** route — over-cap submissions return `status: "quarantined"` with `flags.reason: "rate_cap"`, but the chat UIs treat any 200 as success and show a plain ref ID. The citizen whose 4th report was quarantined thinks it was accepted normally; abuse-defense L6 requires the truthful-generic message.
**Fix:** in `SubmitChat`/Telegram reply: if `flags.reason === 'rate_cap'`, append the "under review — awaiting corroboration" line from `labels`.

## P2 — Worth fixing if time allows

- **BUG-9:** `split()` doesn't verify the submissions belong to the source demand, and leaves an empty origin demand open when all subs are split out (close or flag it).
- **BUG-10:** Merge-review queue items are discoverable only via `MergeReviewQueued` events; if reviewed by nobody they sit forever with `status='extracted'` — add them to the validation-queue query as a fallback so nothing is invisible.
- **BUG-11:** `narrateComparison` is called per evidence-panel view (Gemini call on every dashboard drawer open) — cache the narrative on the demand row; judges will open that drawer twenty times.
- **BUG-12:** `NEXT_PUBLIC_GEMINI_API_KEY` in the browser (voice page) — acceptable for the hackathon, but restrict that key in AI Studio to the deployed domain + Live API only, and say so in README (judges notice key hygiene).
- **BUG-13:** `demands.updatedAt` gates merge candidacy (`gte(updatedAt, threshold)`) — fine, but backdated corpus demands get `updatedAt=now` on creation, so all pass; just be aware the time-decay component reads `updatedAt`, making all corpus clusters look "fresh." Harmless for demo; note it.

## What's genuinely solid (no action)
Event canonicalization + sorted keys · citation-refusing seed loader · corpus sequential processing with backdated hash rewrite (BUG-1 aside, the backdating logic itself is correct since submission-only chains are flat) · rank preserving dataGap across recomputes · quorum logic as a pure tested function · simulate-attack env guard · Gemini fenced-input + strict schema + mock mode · classrooms=0 division guard in evidence.

## Suggested fix order (matches team zones)
1. **A:** BUG-3 (await trigger) + BUG-5 (one condition) — 15 min, unblocks everything.
2. **A:** BUG-2 (checkCluster and/similarity filter) — 45 min. **C** reruns corpus → verifies BUG-1 gone (add `deferMerge` first — 10 min, A's route + C's corpus body).
3. **C:** BUG-4 embedding normalization + θ tuning with real key — 45 min, needs BUG-1/3 done.
4. **A:** BUG-6 advisory lock + BUG-7 timestamptz — 40 min (do together, one schema push).
5. **B/D:** BUG-8 rate-cap messaging — 15 min.
6. P2 items only after IC3 is green.
