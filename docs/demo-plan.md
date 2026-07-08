# MPconnect Demo Plan: The 7 Core Moments

This document outlines the step-by-step walkthrough to demonstrate the **MPconnect (People's Priorities Engine)** platform across all roles (Citizen, MP, and Authority). It maps directly to the design guidelines and the 7 demo moments specified in our codebase.

---

## Prerequisites & Role Switcher
MPconnect uses a demo-role switcher (persisted via `localStorage` and URL parameters) to let evaluators jump between the three system viewpoints:
1. **MP View** (Command, ranking, data-fusion, MPLADS)
2. **Authority View** (Task management, mark work resolved with photo proof)
3. **Citizen/User View** (WhatsApp-style intake, voice note record, personal dashboard, status confirmation)

Make sure your local servers are running:
* **Backend API**: `http://localhost:3000` (runs `@mpconnect/api` / Next.js)
* **Frontend Web**: `http://localhost:3001` (runs `@mpconnect/web` / Next.js)

---

## The 7 Demo Moments Walkthrough

### Beat 1: Multilingual Chat & Voice Intake
* **Goal**: Demonstrate how a citizen can file a public or personal concern in Telugu or English, which gets transcribed, structured, and assigned a tracking ID in seconds.
* **Steps**:
  1. Navigate to the Citizen Submit page: [http://localhost:3001/submit](http://localhost:3001/submit).
  2. Toggle the language to **Telugu** or **English**.
  3. Select **Public Issue** (for community problems like potholes, school upgrades, water leakage) or **Personal Issue** (for private concerns like pension delays).
  4. Tap the **Microphone icon** to record a voice note (e.g., in Telugu: *"మా వీధిలో డ్రైనేజీ సమస్య ఉంది, దయచేసి బాగు చేయండి"* - *"There is a drainage issue in our street, please fix it"*), or type a concern and attach a photo.
  5. Submit the report.
  6. **Result**: The UI displays the AI-extracted metadata card (category: `drainage`, urgency: `medium`, Telugu/English summary translation) and returns a unique reference ID (e.g., `VZG-2607-00001`).

---

### Beat 2: Auto-Merge & Split Review Queue
* **Goal**: Show how the backend clusters duplicate citizen reports into a single master "Demand" to prevent duplicate tickets, while retaining the split-action capability.
* **Steps**:
  1. Open the Review Console: [http://localhost:3001/review](http://localhost:3001/review).
  2. Go to the **Merge Queue** tab.
  3. Observe how multiple incoming reports (e.g., 40 reports of the same school infrastructure issue in a ward) are automatically matched based on **embeddings, geolocation proximity, and taxonomy**.
  4. Click **Merge** to collapse the duplicates into one master **Demand**. Note how the "Affected Count" increases to 40.
  5. To demonstrate error recovery, find an existing merged group and click **Split** to separate reports back into distinct demands.

---

### Beat 3: Constituency Hotspot Map
* **Goal**: Present the MP's bird's-eye view command center displaying constituency priorities.
* **Steps**:
  1. Navigate to the MP Dashboard: [http://localhost:3001/dashboard](http://localhost:3001/dashboard).
  2. Observe the interactive Google Map showing the entire Visakhapatnam Lok Sabha constituency.
  3. The map displays color-coded hot spots. **Size** represents the number of citizens affected (volume of support), and **Color** represents the urgency level (e.g., red for water contamination or live wires, yellow for potholes).
  4. Zoom into a specific ward (e.g., Gajuwaka) and tap a hotspot marker. It opens a card containing the summary, category, status, and affected count.

---

### Beat 4: UDISE & Census Data-Fusion Evidence Panel
* **Goal**: Show the system's core value: backing citizen demands with official government datasets (UDISE+ school data, Census demographics) to enable data-weighted decisions.
* **Steps**:
  1. In the MP Dashboard, select the **School Upgrade** demand from the list.
  2. Click on the **Evidence Panel** tab.
  3. Observe the side-by-side comparison:
     - **Citizen Demand**: 40 active requests for school infrastructure in Ward 12.
     - **Local Datasets**: Real UDISE data showing current enrollment, classroom capacity deficit, and the nearest alternative school distance (e.g., 4.2km away).
     - **Comparison Proposal**: A competing vocational centre proposal.
  4. Read the AI-generated comparative narrative. It is compiled **strictly from local databases** under the *Citation-or-Silence* contract, with no hallucinated outside facts.

---

### Beat 5: MP Priority Ranking & MPLADS Pack
* **Goal**: Show how the algorithm ranks demands, and how the MP can convert a priority into a formal statutory funding requisition.
* **Steps**:
  1. On the MP Dashboard list, look at the priority scores. The ranking is computed: `Score = f(affected, urgency, recurrence, equity flag, dataset gap)`.
  2. Select a high-priority school upgrade demand and click **Generate MPLADS Pack**.
  3. **Result**: The system auto-drafts a printable **MPLADS Funding Recommendation Form**.
  4. The form is pre-filled with:
     - Location, description, and beneficiaries count.
     - Estimated cost band.
     - Statutory compliance clocks (45-day review / 75-day sanction clock).
     - Earmark warnings (e.g., if SC/ST ward funds apply).
     - Diagnostic watermark: *"Advisory Draft only — requires MP signature."*

---

### Beat 6: Citizen-Verified Closure Loop (The Soul)
* **Goal**: Prove the sacred contract: no issue counts as "resolved" until citizens confirm it.
* **Steps**:
  1. In a new browser window, log in/switch role to **Authority** and open the workspace.
  2. Select a demand, click **Mark Work Done**, and upload a photo of the completed work. The status moves to `fix_claimed`.
  3. Open a second window logged in as the **Citizen** who reported the issue.
  4. The citizen sees a prompt: *"Official has marked VZG-2607-00001 as resolved. Is this correct?"*
  5. Click **Deny** and enter a reason (e.g., *"Pothole was only filled with gravel, not tarred"*).
  6. **Result**: The demand's status immediately reverts to `unresolved`, the map badge turns red, and a **reopened / false-closure counter** increases by 1 on the MP dashboard, holding officials accountable.

---

### Beat 7: War-Room Attack Abuse Defense
* **Goal**: Demonstrate how the platform detects coordinated spam campaigns (e.g. bots flooding the system with fake reports) and quarantines them.
* **Steps**:
  1. Open the Review Console: [http://localhost:3001/review](http://localhost:3001/review).
  2. Go to the **Quarantine Queue** tab.
  3. Click the **Simulate coordinated spam/attack** button. This fires 15 synthetic, templated complaints in rapid succession.
  4. **Result**: The system calculates a similarity index, temporal velocity, and geo-overlap score. It intercepts the 15 reports, marking them as spam, and locks them in the quarantine drawer.
  5. Open the MP Dashboard Map: the map is untouched, proving the public visualization is shielded from coordinated attack campaigns.

---

## Seed Data Reference

The demo environment is pre-loaded with Vizag constituency datasets:
* **Authorities**: Real jurisdictional officials for Visakhapatnam wards (GVMC, APDCL, Education dept).
* **Datasets**: Real UDISE+ school metrics and Census 2011 statistics for Gajuwaka, Madhurawada, and Arilova wards.
* **Citizen Corpus**: ~120 synthetic reports across GVMC taxonomy categories, including a pre-made cluster of 40 duplicate complaints for Beat 2, and 15 attack fixtures for Beat 7.
