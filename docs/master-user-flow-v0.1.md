# MPconnect — Master User Flow (v0.1, draft)

*Captures the full role-based navigation flow as described in the design discussion, reconciled against the project docs (`functional-requirements-v1.0.md`, `frontend-page-design-v1.0.md`, `role-dashboards-flow-spec-v1.0.md`) and the existing code. This is the single reference for how a user moves through the app, role by role, screen by screen.*

*Status: **draft** — three decisions are still open (see §6). Nothing here overrides the sacred contracts in `CLAUDE.md`.*

---

## 0. The one idea behind everything

There is **one shared record** — a citizen's report becomes a **Demand** — and three roles look at it through three different lenses:

- **MP** — the aggregate command view: what's broken across the whole constituency, ranked, with proof.
- **Authority** — the execution view: only what's assigned to me, and how I close it with evidence.
- **User (Citizen)** — the personal view: report a problem, track it, support others' problems.

Build the shared Demand/case model once, then layer each role's pages and permissions on top. Nothing is a separate system.

---

## 1. Landing — Role Picker

The first screen. **Not a login** — no password, no account. Three tap cards:

1. **Login as MP**
2. **Login as Authority**
3. **Login as User**

**On tap:** the app remembers the choice (persists via URL param + localStorage — already the pattern in `DashboardContext`, which supports `citizen | official | mp`) and **redirects straight to that role's Dashboard**. Reopening the app later goes directly to the last role.

> Real authentication (MFA for officials, verified MP staff accounts — FR-ADM-03) is a later concern. This picker is a demo/pilot affordance, not a security boundary.

---

## 2. MP flow

**Bottom nav (4 pages):** Dashboard · Issues · Map · Profile.
Landing as MP → **Dashboard**.

### 2.1 Dashboard
The morning command screen. Shows the statistics of all issues:

- **Total · Solved · Unsolved · Assigned · Unassigned** (each count is clickable → filters the Issues list to that slice).
  - *Solved* = citizen-**verified** only (`resolved_verified`). A claim alone never counts here — sacred contract.
  - *Assigned* = has an authority (`authorityId` set). *Unassigned* = still awaiting routing.
- Secondary honesty numbers: **verified-resolution rate** and **reopened / false-closure count**.
- A **"Current Issues"** entry → tapping it opens the **Issues page**.
- (Recommended, per docs) a live activity feed + the constituency map preview.

### 2.2 Issues page
MP sees **two types**:

- **Public issues — ranked.** Aggregated from all channels. Each shows vote/affected count, severity, and funding-relevant data. The ranking is computed (affected × urgency × recurrence × equity × public-data-gap). The MP has a **Prioritize** action on an issue *(exact meaning is an open decision — see §6.B)*.
- **Personal issues.** Person-specific, private problems (pensions, land, entitlements). MP is **view-only** — cannot act/alert. *(Whether the MP may see these at all, and in what form, is an open decision — see §6.A. Current docs say no.)*

**Drill-down (same for both types):**
Tap an issue → **Card / Summary** pops up (issue type, name, severity, statistics) → **Detail View** button → full **images + supporting documents** the MP can access → a **Map button** on the issue → jumps to the Map page focused on that problem.

### 2.3 Map
Zoomed out, shows the most **severe** problems across the constituency. As the MP **zooms in**, more problems reveal in detail. Tapping any problem shows its related data inline (type, affected count, state, evidence) — no need to leave the map. The Map is reachable both from the nav and from inside any issue (§2.2).

### 2.4 Profile
MP's own profile: photo, bio, interests/details, edit options.

---

## 3. User (Citizen) flow

**Bottom nav (5 slots):** Dashboard · Issues · **⊕ (Register)** · Map · Profile.
Landing as User → **Dashboard**.

### 3.1 Dashboard
The citizen's personal status board:

- Their reported issues, each with **current state + tracking** (Received → Being Reviewed → Assigned → In Progress → Awaiting Your Confirmation → Resolved), plus dates, updates, statistics.
- **Upvoted issues** the citizen supported also appear here, with live tracking of their state.

### 3.2 ⊕ Register a problem (center plus)
The single most important citizen action. Opens the submit flow:

- Choose **Public issue** or **Personal issue** (personal = private, only citizen + jurisdictional official; public = contributes to the feed/map).
- Describe via **voice note, text message, or images / supporting documents**.
- Submit → the problem gets a **unique reference ID** returned on screen.
  - **Use the existing ID:** `VZG-YYMM-NNNNN` is already generated on every submission — this *is* the token; don't create a second one.
- (Per docs) a one-time safety notice and a read-back confirmation before finalizing catch mistakes.

### 3.3 Issues page
**Public issues only.** The citizen can **upvote** ("affects me too"). An upvoted issue is mirrored to their Dashboard (§3.1) so they can track its state. This is the community-pressure feed.

### 3.4 Map
**Public problems only.** Shows what issues exist and their developments; tap for a summary; the citizen can **upvote directly from the map**. Never shows personal-category items, and never shows a problem before it has enough independent reports to be considered real (promotion gate — see §6.C).

### 3.5 Profile
Basic citizen details, stored per citizen identity.

---

## 4. Authority flow

**Bottom nav (5 pages):** Dashboard · Workspace · Issues · Map · Profile.
Landing as Authority → **Dashboard**. Structurally similar to the User, with an execution twist.

### 4.1 Dashboard
Scoped to this officer's jurisdiction: statistics of **assigned issues, current issues, solved issues**, with numbers and tracking.

### 4.2 Workspace (the execution page)
All **allotted issues** for this authority, with details, documentation, and **what-to-do** guidance. This is the officer's actual to-do list. *(Per docs FR-OFC-01, the case-action surface should offer: Accept · Decline-with-reason · Request info · Update status · **Mark work done (photo required)**.)*

### 4.3 Issues page
**Public issues — view only.** Same issue detail as everyone else, but the Authority has **no upvote** (they act, they don't vote).

### 4.4 Map
**Public problems** (per docs, ideally scoped to their ward/zone — their patch, not the whole constituency).

### 4.5 Profile
Basic details.

---

## 5. How the three connect (one lifecycle)

```
Citizen registers (⊕)  →  becomes a Demand (unique ID VZG-YYMM-NNNNN)
        │
        ▼
   [merge: duplicates → one Demand, affected count grows]
        │
        ▼
   Authority is assigned (routing)  →  acts in Workspace  →  Mark work done (+photo)
        │
        ▼
   Citizen is asked to confirm/deny  →  DENY = reopens publicly  ·  CONFIRM = resolved_verified
        │
        ▼
   MP sees the aggregate: ranked list, stats, verified-resolution rate, map
```

Every page above is a lens on this one lifecycle. Role-exclusive pieces: **MP** — ranked prioritization, funding/MPLADS view, constituency-wide map; **Authority** — Workspace, mark-done-with-photo; **Citizen** — ⊕ register, public/personal toggle, upvote.

---

## 6. Open decisions & reconciliation with the docs

*These are the points where the described flow needs a call, or diverges from the current docs/contracts. Resolve these and I'll finalize the flow to v1.0.*

### A. Can the MP see **personal** issues? ⚑ (biggest one)
- **Described flow:** MP sees personal issues (view-only).
- **Docs say no:** FR-CTZ-03 states personal grievances are visible **only to the citizen and the jurisdictional official — never on a political/MP dashboard**. Privacy is a core trust pillar of the whole system.
- **Options:**
  1. MP does **not** see personal issues (docs-compliant). Only the Authority handles them.
  2. MP sees personal issues as **anonymized aggregate counts** ("23 pension delays in Ward 12") with no identities/content — pressure without exposure.
  3. MP sees full personal issues (breaks FR-CTZ-03 — needs an explicit, documented decision to override the contract).
- **Recommendation:** option 2 or 1.

### B. What does the MP **Prioritize** button do?
- The system already **auto-ranks** public issues. So "Prioritize" is ambiguous.
- **Options:** (1) manually **override** the algorithm's order/pin an issue; (2) "act on this" → **generate the MPLADS funding pack** and/or push the assigned authority; (3) both, as two separate buttons.
- Pick one so it isn't two features hiding in one label.

### C. Citizen map / issues visibility gate
- Docs (FR-VAL-05) require a Demand to reach **`validated_public`** before it shows publicly — needs k independent reporters (default 3) or a field verification. So the citizen feed/map should show **validated public** demands only, not single unverified reports. Confirm this gate is in the flow (it protects against one person's claim looking like a confirmed public problem).

### D. Upvote must be **geo-verified**
- "Affects me too" (FR-CTZ-02) requires the app to confirm the citizen is actually near that location, so support can't be gamed from afar. Applies to upvotes from both the Issues page and the Map.

### E. "Authority" vs "official" naming
- The docs/UI text use **"Authority"**; the code identifier is **`official`**. Same role — keep `official` as the code value, "Authority" as the label.

### F. Things the docs add that the described flow didn't mention (worth including)
- **Escalation badge** on citizen issues when an SLA breach pushes a case up a level (FR-ESC-01/02) — never hidden from the citizen.
- **Reminders / notifications inbox** for the citizen (assignment, fix-claimed, outcome) — FR-NTF-01.
- **Copilot / help desk** for the citizen (scheme/eligibility Q&A, retrieval-only) and a separate **MP data chatbot** (queries live dashboard data — a genuinely new, higher-trust piece). Both are in the design docs; neither is in the nav you described. Decide if they're in v1.

---

## 7. Build status snapshot (for context)

- **Already exists (reuse):** role context (3 roles), Demand map, demand drawer with Timeline/Evidence/MPLADS tabs, submit flow, help-desk retrieval, "affects me too" mechanic, ranking engine, verification (confirm/deny) loop, unique ID generation, personal/community category split.
- **New UI, existing data:** four-way stat breakdown, citizen "My Reports"/tracking list, upvoted-issues-on-dashboard, Authority Workspace, Reminders inbox.
- **New end-to-end:** MP live activity feed, MP data chatbot (read-only tool layer).

---

*Next step: answer §6.A and §6.B (and confirm C–F), and this becomes master-user-flow-v1.0 with the open items closed.*
