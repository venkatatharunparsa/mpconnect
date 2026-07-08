# MPconnect Frontend Design — Page-by-Page Spec (v1.0)

*Written as a business analyst hand-off: what pages exist, why each one exists, what every element on it means, and how a user moves between them. Deliberately basic — this is the minimum set of screens that makes the system work, not a polished visual design. A frontend developer should be able to build directly from this without guessing why something is on a page.*

---

## 0. Who are the three users, and what do they actually need?

Before any screen, the business reason each role exists:

**MP (and MP's office staff).** Controls ₹5 crore/year in development funds and represents the whole constituency, but today has no objective way to see which problems affect the most people or which departments are stalling. Needs: a ranked, evidence-backed view of what's broken, proof of what's actually fixed (not just claimed), and a way to ask questions about the data without digging through reports.

**User (Citizen).** Has a real problem (broken streetlight, water shortage, pension delay) and currently has no reliable way to report it once, know who's handling it, or trust that "resolved" is true. Needs: one place to report, one place to track, visible proof before believing a closure, and a way to see that others share their problem (strength in numbers).

**Authority (Government Official / Department staff).** Handles a flood of complaints across multiple channels with no prioritization and no way to prove work was done. Needs: a simple queue of what's actually assigned to them, one-tap actions, and a way to close a case with evidence so it isn't reopened.

All three roles look at the **same underlying problem data** — a citizen's report becomes a "Demand" that an authority acts on and an MP tracks. The three dashboards are three different lenses on that one shared record, not three separate systems.

---

## 1. Entry Screen — Role Selector

**Purpose:** Let the user say who they are so the app shows the right lens. Not a login — no password, no account creation at this stage.

**Elements:**
- App name/logo + one-line tagline ("Citizens speak. Problems get tracked until they're really fixed.")
- Three large tap cards, side by side (stacked on mobile): **MP**, **Citizen**, **Authority**. Each card has an icon and a one-line description of what that role sees.
- No back button needed — this is the first screen.

**What happens on tap:** the app remembers the choice (so reopening the app later goes straight to that role's home) and navigates to that role's Home page.

**Business reason for a picker instead of a real login:** at this stage the system needs adoption, not gatekeeping — citizens shouldn't need to create an account to report a pothole. Real authentication (MFA for officials, verified MP staff accounts) is a separate, later concern once the system is trusted enough to matter.

---

## 2. MP — Pages

### 2.1 MP Home (the command center)

**Purpose:** The one screen an MP or their staff opens every morning. Answers "what's broken, what's being worked on, what's stuck."

**Elements, top to bottom:**

| Element | Meaning / why it's there |
|---|---|
| Four stat tiles: **Solved / Unsolved / Assigned / Unassigned** | The four questions an MP actually asks. *Solved* = citizen confirmed it's fixed (not just claimed). *Unsolved* = still open in any state. *Assigned* = a department is on it. *Unassigned* = nobody has picked it up yet — this tile is the one that should embarrass someone into action. Tapping a tile filters the list below to just that group. |
| Two smaller secondary numbers: **Verified-resolution rate**, **Reopened count** | The honesty check. Verified rate = of everything claimed "done," what fraction did the citizen actually confirm? Reopened = how many "done" claims turned out to be false. These numbers exist specifically to catch departments that close cases without doing the work. |
| **Live feed** (scrolling list) | A real-time ticker of what just happened anywhere in the constituency — "New report: water leakage, Gajuwaka," "GVMC claimed fix on streetlight #4021," "Citizen denied fix, case reopened." Gives a feel for the pulse of the constituency without opening anything. Each row links to its problem. |
| **Map** | Every open problem plotted as a pin. Pin size = how many people it affects; pin color = its current state (e.g. amber = waiting, red = reopened/urgent, green = verified done). Tapping a pin opens that problem's detail page. This turns a list of text into "where is the pain, geographically." |
| **Ranked list** (below or beside the map) | The same problems as the map, but as a sorted list — worst/most-urgent first. This is the actual priority order the ranking engine computes (affected people, urgency, how long it's been open, whether it keeps recurring, equity/fairness weighting). Each row is tappable → problem detail page. |
| Floating **chat icon** (bottom corner) | Opens the MP chatbot (§2.3) from anywhere on this page. |

**Navigation from here:** tap any pin/row → Problem Detail page. Tap chat icon → chatbot.

### 2.2 Problem Detail Page (MP view)

**Purpose:** Everything about one specific problem, in enough depth to make a funding or pressure decision — this is what the MP actually reads before deciding "I'll push GVMC on this one" or "I'll recommend MPLADS funds here."

**Elements:**

| Section | Meaning |
|---|---|
| Header: title, ward, current state badge, "affects N citizens" count | The problem in one glance. The affected count is deliberately large/bold — it's the single number that justifies priority. |
| **Overview** | Plain description of the problem, category, when it was first reported, which department it's routed to. |
| **Evidence tab** | Fuses the citizen's report with real government data — e.g., for a "school needs upgrading" case, shows actual enrollment numbers vs. classroom count from official records, plus a short written comparison. This exists so a funding decision is backed by real numbers, not just complaint volume. If a competing/rival problem exists in the same area (e.g., a vocational center proposal vs. the school), it's shown side by side here so the trade-off is visible. |
| **Funding pack tab (MPLADS)** | An auto-drafted funding recommendation: what work is needed, estimated cost range, estimated beneficiaries, and the two statutory clocks that legally apply (45-day rejection-notice window, 75-day sanction window) so the MP's office never misses a deadline. Always carries a visible disclaimer that this is a draft, not a decision. |
| **Timeline tab (issue tracking)** | The full history of this problem: when it was reported, merged with other similar reports, assigned to a department, when work was claimed, and whether the citizen confirmed it. Every entry is tamper-evident (a small "verified ✓" badge confirms the record hasn't been altered). This is the "prove it" tab — it's what makes the whole system trustworthy. |

**Navigation:** back arrow returns to MP Home; nothing else branches from here except the chatbot icon (still available).

### 2.3 MP Chatbot

**Purpose:** Let the MP or staff ask a plain question instead of digging through the dashboard — "how many unresolved water complaints in Gajuwaka?", "which cases are overdue?"

**Elements:**
- A simple chat panel (can be a slide-in panel over the dashboard rather than its own page)
- Text input + send
- Answers always show the actual numbers/records they're based on (e.g., "3 unresolved water-supply cases in Gajuwaka — [links to each]") — never a made-up-sounding answer with no data behind it.

**Business reason this is different from the citizen's chatbot:** the MP's assistant is allowed to look up live data (it's an internal, trusted user); the citizen's version (§3) is only allowed to answer from a fixed, pre-approved set of scheme information — it can't go digging through private records.

---

## 3. User (Citizen) — Pages

### 3.1 Citizen Home

**Purpose:** The citizen's front door — quick access to reporting something new and seeing what's happening with what they've already reported.

**Elements:**

| Element | Meaning |
|---|---|
| Big **"Report an issue"** button, front and center | The single most important action on this whole role — reporting should never require hunting for it. |
| "You have N open reports" summary strip | A quick personal status check, tap to go to My Reports. |
| Small preview of the **community feed** (2-3 cards) | Shows the citizen that others are reporting things too — a "see more" link into the full feed. |
| Small map preview | Same idea — a taste of the map, with a link into the full map page. |

### 3.2 Report an Issue (the submit flow)

**Purpose:** Get a citizen's problem into the system in under two minutes, in their own language, with minimum typing.

**Elements:**
- Chat-style conversation: type, speak (hold-to-record mic), or attach a photo
- A toggle near the top: **"Personal issue"** vs **"Community issue"** — Personal (pension, land dispute, individual entitlement) stays private between the citizen and officials; Community (pothole, streetlight, drainage) becomes visible on the public map/feed. This exists so private matters never accidentally become public.
- A safety notice shown once, first time only: officials always carry ID, never pay unofficial fees, use official channels only.
- After submitting: a read-back confirmation ("Did I get this right? Water leakage near RTC complex, Gajuwaka") before it's finalized — catches speech-recognition mistakes.
- A reference ID shown clearly at the end (e.g., `VZG-2607-00042`) — the citizen's proof of having reported it and their way of tracking it later.

### 3.3 My Reports

**Purpose:** Every issue this citizen has personally reported, and exactly what stage it's at, in plain language (not internal jargon).

**Elements:**

| Element | Meaning |
|---|---|
| List of cards, one per report, each showing: short title, plain-language stage (e.g. "Assigned to GVMC — waiting for work to start"), and a small **escalated** badge when relevant | Escalation badge appears only when the issue has breached its expected timeline and moved to a higher authority — the citizen is never left wondering why nothing happened; the system tells them it went up a level. |
| A **"Was this actually fixed?" confirm/deny prompt** inline on any card where an official has claimed the work is done | This is the single most important interaction on the citizen side — it's what makes "resolved" mean something. Confirm closes it for real; deny reopens it publicly and flags the department. |
| Tap any card | Opens that report's Tracking page (§3.4). |

### 3.4 Problem Tracking Page (one report, citizen view)

**Purpose:** The detail view of a single report the citizen filed — the same underlying data as the MP's Problem Detail page, but written for a citizen, not an official.

**Elements:**
- Plain-language status line ("Your report is being reviewed" / "Assigned to Ward Office, Gajuwaka" / "Marked as fixed — please confirm")
- "This issue also reported by N other people" note, when the citizen's report was merged with others — reassures them their voice wasn't lost, it was strengthened
- Simple timeline (report → assigned → in progress → fix claimed → confirmed), no technical event names
- The confirm/deny action, if a fix has been claimed and not yet responded to

### 3.5 Community Feed

**Purpose:** Let a citizen see (and support) problems reported by others nearby — turns individual complaints into visible collective pressure.

**Elements:**
- Scrollable list of public problem cards: title, ward, "affects N citizens" count, current state
- An **"Affects me too"** button on each card — the citizen's one-tap way to add themselves as a supporter (this is the "upvote"; it requires the app to confirm they're actually near that location, so it can't be gamed from far away)
- A follow/bell icon per card to add it to their **Interested Problems** list (§3.7) without necessarily saying "affects me too"
- Filters: by ward, by category

### 3.6 Map (citizen view)

**Purpose:** Same map concept as the MP's, but scoped to public problems only — never shows personal/private categories, and never shows a problem before it's had enough independent reports to be considered real (this protects against one person's unverified claim looking like a confirmed public problem).

### 3.7 Interested Problems (Following)

**Purpose:** A personal watchlist — problems the citizen cares about but didn't necessarily report themselves. Different from "My Reports" (things they filed) — this is things they're just watching.

**Elements:** simple list of followed problem cards, same status language as My Reports, unfollow option per card.

### 3.8 Reminders (Notifications)

**Purpose:** A single inbox for every update that's been pushed to the citizen — assignment, fix-claimed (needs their confirmation), final outcome — so nothing is missed even if they don't check the app daily.

**Elements:** simple chronological list, unread indicator, tap an item to go straight to that report's Tracking page.

### 3.9 Copilot (Help / Ask a question)

**Purpose:** Answer "am I eligible for X scheme" or "how does Y procedure work" questions without the citizen needing to file a report first.

**Elements:**
- Chat panel, same shape as the MP's chatbot but answers strictly from an approved list of scheme/procedure information — if it doesn't know, it says so honestly rather than guessing
- Every answer ends with a prompt: "Want to file this as a report instead?"

---

## 4. Authority (Official) — Pages

### 4.1 Authority Home (the work queue)

**Purpose:** The one screen a department officer opens to see exactly what's expected of them today — no digging, no ambiguity about ownership.

**Elements:**

| Element | Meaning |
|---|---|
| Four stat tiles: **Assigned to me / Pending action / Overdue / Resolved this month** | Same "four questions" idea as the MP view, but scoped to this one officer's own jurisdiction. *Overdue* is the one that matters most — it's counting down against the same SLA clock that, if missed, escalates the case above their head. |
| **Queue list** — every case assigned to them, sorted by urgency (safety issues and near-deadline cases float to the top) | This is their actual to-do list. Each row: short title, ward, how many people affected, days remaining before SLA breach. |
| Tap any row | Opens the Case Action page (§4.2). |

### 4.2 Case Action Page

**Purpose:** Where the actual work happens — an officer looks at one case and takes an action on it.

**Elements:**

| Element | Meaning |
|---|---|
| Case overview (same problem data the MP and citizen see) | One shared source of truth — the officer isn't looking at a different version of the facts. |
| Action buttons: **Accept / Decline (with reason) / Request more info / Update status / Mark work done** | The small, fixed set of actions that map to the real-world steps of fixing something. "Decline" always requires picking a reason (never a silent drop) — this exists so a case can't just vanish without explanation. |
| **Mark work done** requires a photo upload | Evidence-first design — a claim of "fixed" without a photo isn't accepted, because the whole system exists to stop false closures. |
| Timeline (their own actions + citizen activity) | Same idea as the MP/citizen timeline — a complete, tamper-evident record, so an officer's own good work is provably on record too. |

### 4.3 Escalation View

**Purpose:** Two-directional visibility into the escalation ladder — cases that came *up* to this officer because someone below missed a deadline, and a clear flag on any of their *own* cases at risk of going up to their supervisor.

**Elements:** a filtered list (subset of the Home queue) with a clear "why this escalated to you" note, and a visible countdown on any of the officer's own aging cases.

### 4.4 Map (Authority view)

**Purpose:** Same map, scoped to only this officer's jurisdiction (their ward/zone) — they don't need or want to see the whole constituency, just their patch.

### 4.5 My Performance

**Purpose:** The accountability mirror — an officer's own resolution numbers, visible to them (and to their supervisor/MP), so good work is recognized and stalling is visible before it becomes a political problem.

**Elements:** their verified-resolution rate, average time to close, count of reopened (false-closure) cases — same north-star metrics as the MP dashboard, just personalized to one officer or department.

---

## 5. How the three roles connect (one system, three lenses)

A citizen's report → becomes a Demand → an Authority acts on it and claims it fixed → the citizen confirms or denies → the MP sees the aggregate result. Every page above is a view onto that same lifecycle; nothing exists in only one role's world except: the MP's funding pack and constituency-wide chatbot (MP-only), and the citizen's personal-issue privacy toggle and community feed (citizen-only). Build the shared underlying "problem/case" view once, then layer each role's specific pages and permissions on top of it — that's the basic, buildable version of this system.
