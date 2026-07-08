# Role Selector + MP/Citizen Dashboard Flow — Spec v1.0

*Formalizes the rough flow notes into a buildable spec, mapped to the existing MPconnect architecture (lifecycle states, event ledger, existing dashboard components). Official is noted as a third role, scope TBD — see §4.*

---

## 0. Ground rule: this is a role picker, not a login

No credentials, no auth flow. A single landing screen asks "Who are you?" with role cards. Selecting one sets `role` in the existing `DashboardContext` (already supports `citizen | official | mp` per current code) and routes to that role's home screen. Role selection persists via URL query param (already the pattern in use) + localStorage, so a reload/shared link keeps the role. This is a demo/pilot affordance, not a security boundary — real officer/MP accounts (RBAC/MFA) are a separate, later concern (FR-ADM-03, P1).

**Screen:** three cards — MP, Citizen, Official (Official visibly marked "coming soon" until §4 is specced) — full-bleed, tap/click to enter.

---

## 1. MP Dashboard

### 1.1 Header stats strip — four counts, not the current one

Replace/extend the existing `StatsStrip` with four explicit counts, each clickable (click → filters the list below to that slice):

| Stat | Definition (maps to `demands.state` + `authorityId`) |
|---|---|
| **Solved** | `state = resolved_verified` only. `resolved_unverified` is never counted here (sacred contract: unverified ≠ resolved). |
| **Unsolved** | Every open state: `claimed, validated_public, routed, in_progress, fix_claimed, reopened, resolved_unverified`. |
| **Assigned** | Unsolved demands where `authorityId IS NOT NULL` (i.e. state is `routed` or later: `in_progress`, `fix_claimed`, `reopened`). |
| **Unassigned** | Unsolved demands where `authorityId IS NULL` (state is `claimed` or `validated_public`, still awaiting routing — this is exactly the existing routing-ambiguity queue's source data). |

Existing `verified-resolution rate` and `reopened count` (north-star metrics) stay visible but secondary — smaller, below the four primary counts.

### 1.2 Live feed

A real-time scrolling activity stream, separate from the ranked demand list — every event across the whole constituency, newest first: new submission received, merged into a demand, routed, fix claimed, verified/denied, escalated, quarantined. Each row: icon + one-line description + relative timestamp + link to the parent demand's drawer. This is new — reuses the *rendering logic* already in `Timeline.tsx` (event-type → icon/style mapping) but sourced from a new "all recent events across all demands" query instead of one demand's event list. Poll every 15-30s for the demo (no websocket needed yet).

### 1.3 Map

Reuses the existing `DemandMap` component as-is: ward polygons, markers sized by `affectedCount`, colored by state. **Clicking a marker opens the existing `DemandDrawer`** (already the pattern — no new component needed, just confirm the click handler is wired to open the drawer rather than navigate away).

### 1.4 Problem detail (the drawer)

Already exists (`DemandDrawer` with Timeline / Evidence / MPLADS tabs) — matches "explain the problem and suggestion" (Evidence tab = dataset-fused comparison + narrative) and "issue tracking" (Timeline tab = full hash-chained event history). No new component; confirm all three tabs render live data, not placeholders (the evidence/mplads-pack backend endpoints already exist per earlier analysis).

### 1.5 AI chatbot for the MP (new capability)

**This is the one genuinely new piece**, and it's a different trust tier from the existing citizen help desk. The existing `helpdesk.ts` answers strictly from a static scheme corpus with no tool access (correct for citizen-facing, untrusted-input handling). The MP's assistant needs to answer questions *about live dashboard data* ("how many unresolved streetlight complaints in Gajuwaka?", "which demands are overdue on SLA?") — that requires read-only query/tool access to the demands/stats repositories, which is a deliberate exception to the "no tools on citizen content" contract because the MP is an authenticated internal user, not an untrusted citizen. Design it as: Gemini with a small fixed set of read-only tool functions (`queryDemands(filters)`, `getStats(ward?, category?)`, `getEscalations()`) — no write access, no access to personal/PII-flagged categories, every answer cites the underlying numbers it pulled (same citation-or-silence spirit, just sourced from live DB instead of a static corpus).

---

## 2. Citizen Dashboard

| Your note | Spec | Maps to |
|---|---|---|
| Raised issues / pending state / report | "My Reports" tab: every submission/demand tied to the citizen's `citizenKey`, each showing its current lifecycle stage in plain language (Received → Being Reviewed → Assigned to [authority] → In Progress → Awaiting Your Confirmation → Resolved) plus a prominent **"Report a new issue"** button that opens the existing `/submit` chat flow. | FR-CTZ-01 |
| Upward issued | When a citizen's own issue escalates (SLA breach → next authority level), show a visible badge on that issue: "Escalated to [Zonal Commissioner] — no action taken within 15 days at ward level." Never hidden from the citizen. | FR-ESC-01/02 |
| Feed (upvote like Reddit) | A scrollable public feed of open Master Problems (reuse `RallyPointClient`/rally-point cards), each with a one-tap **"Affects me too"** button (the "upvote") that geo-verifies and increments the affected count — this *is* the existing FR-CTZ-02 mechanic, just needs a feed/list wrapper around the existing per-problem rally-point page instead of only reaching it via a shared link. | FR-CTZ-02, FR-CMN-01 |
| Map | Same `DemandMap`, citizen-scoped: only `validated_public` (or later) demands are visible — never `claimed`-only or personal-category items. | — |
| Copilot | Reuses the existing help-desk service (`helpdesk.ts`) as-is — retrieval-only over the Scheme Corpus/Authority KB, always offers "file this as a grievance?" No new backend needed, just a UI surface (chat panel) on this dashboard. | FR-HLP-01/02 |
| Reminders | A notifications inbox — this is the UI surface for the Telegram/push notification pipeline (lifecycle-stage pushes) already scoped as remaining work; on this in-app dashboard it's just a list view of the same notification events, not a new backend. | FR-NTF-01 |
| Interested problems | "Following" list — public demands the citizen tapped "affects me too" or explicitly subscribed to, with a bell toggle per card, surfaced separately from "My Reports" (those are things they reported; this is things they're watching). | FR-CTZ-02 |
| Generalised problem option | When filing a new report, a toggle/switch: "Personal issue" (private, only citizen + officials see it — pensions, land, entitlements) vs. "Community issue" (public from the start, contributes to the public feed/map). Maps to the existing `kind: grievance|suggestion` field plus the `PERSONAL_CATEGORIES` privacy split already in the taxonomy. | FR-CTZ-03, FR-INT |
| Issue tracking | Same `Timeline` component as the MP drawer, scoped to the citizen's own issue — full hash-chain history, in plain citizen-facing language (no raw event-type jargon). | FR-UND-07, existing `Timeline.tsx` |

---

## 3. What's genuinely new vs. what's reuse

**Pure reuse, just re-surfaced:** map, drawer, timeline, evidence/MPLADS tabs, help-desk retrieval, "affects me too" mechanic, submit flow.

**New UI, existing data:** four-way stat breakdown (solved/unsolved/assigned/unassigned), citizen "My Reports" list filtered by `citizenKey`, "Interested problems" following list, reminders inbox (once the notification pipeline lands).

**New end-to-end (backend + UI):** the global live feed (needs a new "recent events across all demands" query), the MP query chatbot (needs new read-only tool-calling layer, a genuinely new trust-tier decision), the personal/community toggle at submission time (small UI addition, backend field already exists).

---

## 4. Official — third role, not yet specced

Not enough detail was given to design this one. For reference, the existing FRD already defines the shape it should eventually take (FR-OFC-01..04): a jurisdiction-scoped queue with accept/decline-with-reason/request-info/update/fix-claim(+photo) actions, a WhatsApp-based fallback flow, acceptance-signature attribution (not login identity, since officer logins are commonly shared per field research), and supervisor workload/reassignment views. Flag this back when you're ready to describe the Official flow the way you did for MP and Citizen above — the shape above is a starting point, not a final answer.
