# MPconnect Video Production & Demo Plan

This plan guides the creation of a **3-minute demo video** for MPconnect. It combines AI-generated visuals (via Omni), live screen recordings, a mic-recorded voiceover, and assembly inside Canva.

---

## Video Outline & Asset Breakdown

| Time | Scene Name | Visual Source | Voiceover (VO) Script | Omni Prompts / Canva Overlay |
|---|---|---|---|---|
| **0:00-0:25** | **1. The Problem & Vision** | Omni AI Video + Canva templates | "In Indian constituencies, local grievances are scattered across WhatsApp, Telegram, and paper files. MPs have data, but no single source of truth. Meet MPconnect—the People's Priorities Engine." | *See Omni Prompt 1*<br>Text overlay: *MPconnect: People's Priorities Engine* |
| **0:25-1:00** | **2. Citizen Voice Intake** | Screen Recording: Citizen Portal | "It begins with the citizen. A resident of Visakhapatnam uploads a photo or records a Telugu voice note. Gemini extracts structural metadata, translating it instantly to English, and returns a unique reference ID." | Record: [submit page](http://localhost:3001/submit). Speak Telugu mic input.<br>Text overlay: *Voice Note to Structured Data* |
| **1:00-1:20** | **3. Auto-Merge & Map** | Screen Recording: Review & MP Map | "To prevent duplication, the merge engine uses embeddings to collapse hundreds of similar complaints into a single Master Demand, populating a real-time constituency hotspot map for the MP." | Record: [review page](http://localhost:3001/review) (Merge Queue) and [MP Map](http://localhost:3001/dashboard). |
| **1:20-1:45** | **4. Data-Fusion & Evidence** | Screen Recording: Evidence Panel | "MPconnect fuses citizen needs with official UDISE school data and Census demographics. The MP gets a data-weighted comparison narrative, ensuring priority funding targets areas with the highest real-world gap." | Record: [Dashboard Evidence tab](http://localhost:3001/dashboard) showing School Upgrade vs Vocational Centre. |
| **1:45-2:20** | **5. MPLADS Requisition & Closure** | Split Screen Recording: MPLADS Form + Two Portal Windows | "With one click, the MP drafts a statutory MPLADS recommendation form. Once work is marked complete, citizens are polled. In other systems, a claim resolves the issue. Here, only citizen verification closes it." | Left: Official portal marking complete.<br>Right: Citizen dashboard clicking 'Deny' to reopen.<br>Text overlay: *Citizens are the Closing Authority* |
| **2:20-2:45** | **6. Abuse Defense** | Screen Recording: Quarantine Queue | "Built for the realities of political campaigns, our coordination filter quarantines bot-generated spam attacks in real time, keeping the MP's dashboard and map clean of false reports." | Record: [review page](http://localhost:3001/review) (Quarantine Queue) clicking 'Simulate coordinated spam'. |
| **2:45-3:00** | **7. Outro & Scale** | Omni AI Video + Mockups | "From a single ward to entire Lok Sabha constituencies—this is MPconnect. Google's intelligence, standing on local ground truth." | *See Omni Prompt 2*<br>Text overlay: *MPconnect: AI for Constituency Development* |

---

## Omni Video Generation Prompts

### Prompt 1: Intro Visual (Grievance Chaos to Structured Data)
> **Prompt**: A cinematic, high-contrast, professional close-up of a hand holding a smartphone in Visakhapatnam, India. The screen shows a voice message waveform glowing in green and white. In the background, out-of-focus city lights and public streets. The camera smoothly zooms out as glowing abstract digital data nodes emerge from the phone, connecting and organizing neatly in the air. 3D render style, clean, premium tech aesthetic, dark mode grading.

### Prompt 2: Outro Visual (Connected Constituency Network)
> **Prompt**: A stylized, premium 3D digital map of a coastal Indian city (Visakhapatnam) viewed from a high angle. Clusters of glowing warm-orange and white points represent community hubs. Connected lines pulse with data flowing between these hubs and a central glowing monument emblem representing the MP's office. Slow kinetic motion, futuristic, clean corporate tech style, depth of field.

---

## Laptop Screen Recording Guide

To prepare clean footage for Canva:
1. **Resolution**: Set screen recording to **1080p (1920x1080)**.
2. **Setup**: Hide bookmarks bar and use Chrome in full-screen window mode.
3. **Cursor**: Enable a subtle cursor highlight effect in your recording software.
4. **Data Pre-load**: Run `pnpm demo:reset` before recording to clean state.
5. **Key Highlights to Capture**:
   - The exact moment the voice recording waveform completes on `/submit` and parses into a card.
   - Merging two complaints in the `/review` queue and watching the list refresh.
   - Tapping a map marker on the dashboard and watching the side panel open.
   - Clicking 'Deny' on the citizen confirmation panel and seeing the MP dashboard's "Reopened Count" counter increment in real time.

---

## Canva Editing Checklist

- [ ] **Project Setup**: Create a 16:9 Video project (1920x1080).
- [ ] **Color Palette**: Use dark mode values matching the application (Slate-900 background, Emerald green accent, white typography).
- [ ] **Fonts**: Use *Inter* or *Montserrat* for titles and *Roboto* for subtext overlays.
- [ ] **Voiceover Track**: Import the raw audio file first. Cut and sync your screen recording clips to align with the VO narrative beats.
- [ ] **Transitions**: Use simple, premium transitions like "Dissolve" or "Match and Move" (duration: 0.3s). Avoid complex, distracting animations.
