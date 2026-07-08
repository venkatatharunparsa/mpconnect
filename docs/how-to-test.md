# MPconnect Testing Playbook

This guide details how to verify and test the full end-to-end functionality of **MPconnect** (People's Priorities Engine for Visakhapatnam Lok Sabha constituency), covering both automated test suites and the 7 critical Hackathon Demo Moments.

---

## 1. Setup & Pre-requisites

### A. Environment Configuration
Verify that your `.env.local` file contains valid credentials:
- `DATABASE_URL`: Neon/Supabase Postgres connection string.
- `GEMINI_API_KEY`: Google Gemini AI Studio key.
- `TELEGRAM_BOT_TOKEN`: Grammy bot token.

### B. Clean Database & Seed Data
Initialize a clean database state with verified datasets (UDISE+ and Census records) and synthetic citizen complaints:
```bash
pnpm demo:reset
```

### C. Running the Applications
Start the backend and frontend dev servers in parallel:
- **Backend API (Port 3000):** `pnpm dev`
- **Web Frontend (Port 3001):** `pnpm dev:web`

---

## 2. Automated Test Verification

Verify code correctness and lifecycle state machines via Vitest:
```bash
# Run all tests
pnpm test

# Run Telegram notifications validation test suite
pnpm test src/tests/server/services/notifications/notify.test.ts

# Run Project & Dispute lifecycle transition test suite
pnpm test src/tests/server/services/lifecycle/project-dispute.test.ts
```

---

## 3. Manual Testing of the 7 Demo Moments

### Moment 1: Multilingual Citizen Intake (Voice/Text/Photo)
- **Path:** `/submit`
- **Steps:**
  1. Open `http://localhost:3001/submit` in your browser.
  2. Toggle language to Telugu (TE) or English (EN).
  3. Enter a complaint (e.g., *"Water logging in MVP colony near the high school"*).
  4. Record a mock voice note or upload a photo.
  5. **Expected Result:** The system runs Gemini extraction, saves the submission, and returns a reference ID (e.g., `VZG-XXXX`).

### Moment 2: AI Clustering & Merge Engine
- **Path:** `/review` (Merge tab)
- **Steps:**
  1. Submit 2 similar problems in Gajuwaka ward (e.g., *"Potholes on main road"* and *"Road damaged near Gajuwaka junction"*).
  2. Open the Merge Review tab at `http://localhost:3001/review`.
  3. **Expected Result:** The system clusters the submissions based on embeddings, proximity, and category. An operator can approve the auto-merge or create a new demand.

### Moment 3: Hotspot Priority Mapping
- **Path:** `/dashboard`
- **Steps:**
  1. Navigate to the MP Command Center at `http://localhost:3001/dashboard`.
  2. Inspect the constituency map.
  3. **Expected Result:** Google Map renders pilot wards (Gajuwaka, MVP, Bheemili) with glowing red/orange hotspots sized proportionally to the volume and urgency of citizen complaints.

### Moment 4: Data Fusion & Evidence Panel
- **Path:** `/dashboard` -> Demand Drawer
- **Steps:**
  1. Click on a "School Upgrade" demand hotspot in Gajuwaka.
  2. Click the **View Evidence** button.
  3. **Expected Result:** Renders side-by-side evidence fusing citizen request details with **real UDISE school enrollment data + Census literacy stats** to generate a data-weighted recommendation.

### Moment 5: Ranked Works & MPLADS Funding Pack
- **Path:** `/dashboard` -> Drawer -> "MPLADS"
- **Steps:**
  1. Inspect the priority rank breakdown score on the MP dashboard list.
  2. Click **Generate MPLADS Funding Pack** on a high-priority demand.
  3. **Expected Result:** Auto-drafts an official recommendation form with statutory timelines (45/75 days) and sc/st earmark indicators as a printable page.

### Moment 6: Citizen-Verified Resolution Loop
- **Steps:**
  1. Open two browser windows: one as an **Official** (`/dashboard` drawer), one as a **Citizen** (`/submit`).
  2. **Official:** Mark an active Gajuwaka drainage demand as "Work Done".
  3. **Citizen:** Receive a Telegram push verification message or browser chat query asking *"Is the problem resolved?"*
  4. **Expected:** 
     - If Citizen clicks **Deny**, demand reopens with a red flag and increments the `falseClosureCount` audit trail.
     - If Citizen clicks **Confirm**, demand transitions to `resolved_verified`.

### Moment 7: Coordination Burst Quarantine (Abuse Defense)
- **Path:** `/review` (Quarantine tab)
- **Steps:**
  1. Open `http://localhost:3001/review`.
  2. Click **Simulate Attack** to fire 15 templated spam reports.
  3. **Expected Result:** The map remains clean; the coordination algorithm isolates the burst of complaints under the Quarantine tab for manual operator release/deletion.

---

## 4. Phase 2 Features Verification

### A. Routing Ambiguity Tab
- Open `/review` -> **Routing ambiguity** tab. 
- Demands lacking assigned authorities appear here. Select GVMC or EPDCL and click **Approve Route** to transition the demand status.

### B. Transcription Correction Tab
- Open `/review` -> **Transcription** tab.
- Displays submissions where speech-to-text confidence fell below 60%. Play the audio recording, correct the text, and click **Submit Correction** to auto-process the extraction.

### C. SLA Escalation Badges & Filters
- Open `/dashboard`. Check the `⚠️ SLA Escalated Only` filter.
- Demands that have breached their category-specific SLA (e.g. 1 day for streetlights) are badged with a warning indicator.
