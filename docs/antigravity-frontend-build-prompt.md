# Prompt for Antigravity — build the 3-role frontend (role selector + MP + Citizen + Authority)

*Paste this whole block into Antigravity. It assumes repo access and that the agent reads CLAUDE.md automatically.*

---

## Context — read these two docs first, in full, before writing any code

1. `docs/role-dashboards-flow-spec-v1.0.md` — the flow-level spec (roles, what each needs, why).
2. `docs/frontend-page-design-v1.0.md` — the page-by-page spec: every screen, every element on it, and *why* that element exists. This is your source of truth for what to build. Do not invent pages or elements not described there; if something is genuinely ambiguous, pick the simplest interpretation and note it in a code comment rather than guessing silently.

Also read `CLAUDE.md` for the repo's six standing contracts (append-only events, citation-or-silence, untrusted-input handling, human gate on ambiguous decisions, config-not-code, no invented facts) — the MP/Citizen/Authority chatbots in particular must obey the citation rule: an answer with no real data behind it is not allowed.

## The core instruction: one entry point, three destinations, real file separation

Build a role-selector landing screen with three cards — **MP**, **Citizen**, **Authority**. Clicking a card navigates to that role's own section of the app. This is a role picker, not a login (no credentials) — persist the choice in a URL segment (e.g. `/mp`, `/citizen`, `/authority`) plus localStorage so reloading doesn't lose it.

**Hard requirement on file structure — this is not optional:** each role gets its own route folder and its own set of component files. Do not build any dashboard as one large page file with everything inlined. Every distinct section described in `frontend-page-design-v1.0.md` (a stat strip, a live feed, a map, a queue list, an action panel, a chatbot, etc.) is its own component file with a single, clear responsibility. A page file's only job is to import and lay out its section components — it should not contain business logic or large chunks of markup itself.

**Before creating any new component, check whether an equivalent already exists in this codebase and reuse it instead of duplicating it.** This repo has already been through one round of dead-code cleanup caused by parallel component trees that duplicated the same UI (submit chat, voice agent) — don't repeat that mistake. Specifically check for and reuse: the existing map component (ward polygons + demand markers), the existing timeline/event-history component, the existing state-badge/score-breakdown components, and the existing review-queue components — adapt them with props rather than forking new copies. If an existing component is close but not quite right for a new role, extend it with a prop, don't clone the file.

## Suggested folder shape (adjust naming to match existing conventions, but keep the separation)

```
src/app/
  page.tsx                        → role selector (3 cards)
  mp/
    page.tsx                      → MP Home (imports section components only)
    problem/[id]/page.tsx         → Problem Detail page
  citizen/
    page.tsx                      → Citizen Home
    report/page.tsx               → Report an Issue (reuse existing submit flow components)
    reports/page.tsx              → My Reports
    reports/[id]/page.tsx         → Problem Tracking page (citizen view)
    feed/page.tsx                 → Community Feed
    map/page.tsx                  → Map (citizen-scoped)
    following/page.tsx            → Interested Problems
    reminders/page.tsx            → Reminders/Notifications
    copilot/page.tsx              → Copilot (or a panel, your call — see spec)
  authority/
    page.tsx                      → Authority Home (queue)
    case/[id]/page.tsx            → Case Action page
    escalations/page.tsx          → Escalation View
    map/page.tsx                  → Map (jurisdiction-scoped)
    performance/page.tsx          → My Performance

src/components/
  role-select/
    RoleCard.tsx
    RoleSelectorGrid.tsx
  mp/
    StatTiles.tsx                 → Solved/Unsolved/Assigned/Unassigned tiles
    LiveFeed.tsx
    RankedList.tsx
    ChatbotPanel.tsx
    problem-detail/
      OverviewHeader.tsx
      EvidenceTab.tsx
      FundingPackTab.tsx
      (reuse existing Timeline component for the Timeline tab)
  citizen/
    HomeSummary.tsx
    ReportCard.tsx
    ConfirmDenyPrompt.tsx
    FeedCard.tsx
    AffectsMeButton.tsx
    FollowingListItem.tsx
    ReminderItem.tsx
    CopilotPanel.tsx
    PersonalCommunityToggle.tsx   → the toggle inside the report flow
  authority/
    QueueStatTiles.tsx
    QueueRow.tsx
    CaseActionButtons.tsx
    PhotoUploadField.tsx
    EscalationBadge.tsx
    PerformancePanel.tsx
  shared/
    (existing Map component, Timeline component, StateBadge, ScoreBreakdown — imported by all three roles, not duplicated)
```

Adjust exact paths to fit whatever the current repo convention is (check where dashboard/review components already live and follow that pattern) — the point is the separation, not this exact tree.

## Build order (do these as separate, small, testable steps — commit after each)

1. **Role selector page** — 3 cards, navigation, persisted choice. Nothing else depends on this being perfect, but everything depends on it existing first.
2. **Shared components audit** — before building anything role-specific, list which existing components (map, timeline, state badges, score breakdown) will be reused by more than one role, and confirm they accept the props each role needs (e.g., the map needs a "scope" prop to filter public-only for Citizen vs. jurisdiction-only for Authority vs. everything for MP).
3. **Citizen flow** — build this first; it's the most-used path and reuses the most existing code (submit flow already exists). My Reports → Tracking page → confirm/deny is the single most important interaction in the whole app; get it right before moving on.
4. **MP flow** — stat tiles (new logic: solved/unsolved/assigned/unassigned counts, defined precisely in the page-design doc §2.1), live feed (new: a global recent-events query), reuse of map/list/drawer, then the chatbot last (it's the most novel piece — a read-only tool-calling assistant, different trust tier from the citizen's retrieval-only copilot, as explained in the spec).
5. **Authority flow** — queue + case action page first (the actual work-doing screens), escalation view and performance page last (lower priority, more report-like).

## Definition of done

- Every page file is short — layout only, importing section components. If a page file is doing real logic or has more than ~40-60 lines of JSX, split it further.
- No new component duplicates an existing one; where reuse happened, note it in the commit message.
- The role selector actually gates navigation — visiting `/mp/*` directly still works (no forced re-selection), but there's no way to see another role's data without switching roles.
- Citizen personal-issue reports never appear on the MP map/feed or Authority queue in a way that exposes them beyond authorized viewers (re-check the existing `PERSONAL_CATEGORIES` privacy rule still applies here).
- `pnpm typecheck && pnpm test` passes before calling any phase finished.
- Commit style matches repo convention: `feat(<role>): <what>`, small commits, one section/component per commit where reasonable.
