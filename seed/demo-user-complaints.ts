import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { NextRequest } from "next/server";
import { POST } from "../src/app/api/submissions/route";
import { processSubmission } from "../src/server/services/engine/merge";
import { db } from "../src/server/db";
import { demands, events, submissions } from "../src/server/db/schema";

type DemoComplaint = {
  citizenKey: string;
  channel: "web" | "telegram" | "voice";
  kind: "suggestion" | "grievance";
  category: string;
  ward: "gajuwaka" | "mvp" | "bheemili";
  locationText: string;
  lat: number;
  lng: number;
  urgency: "low" | "medium" | "high" | "safety";
  summaryEn: string;
  summaryTe: string;
  rawText: string;
  lang: "en" | "te" | "mixed";
};

function demoThumbDataUrl(label: string) {
  // Inline SVG data URI so the demo always has thumbnails (no network dependency).
  const safe = label.slice(0, 18).replace(/[^a-zA-Z0-9 _-]/g, "");
  const bg = "#0f172a"; // slate-900
  const fg = "#ffffff";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
    <rect width="100%" height="100%" rx="24" fill="${bg}"/>
    <circle cx="96" cy="96" r="54" fill="#2563eb" opacity="0.9"/>
    <text x="40%" y="52%" font-size="42" font-family="Arial, sans-serif" fill="${fg}" text-anchor="middle" dominant-baseline="middle">${safe.slice(0, 4)}</text>
    <text x="50%" y="80%" font-size="16" font-family="Arial, sans-serif" fill="${fg}" opacity="0.85" text-anchor="middle">${safe.slice(0, 10)}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const COMPLAINTS: DemoComplaint[] = [
  {
    citizenKey: "DEMO-USER-001",
    channel: "web",
    kind: "grievance",
    category: "water_supply",
    ward: "mvp",
    locationText: "MVP Colony Sector 1",
    lat: 17.7441,
    lng: 83.3321,
    urgency: "high",
    summaryEn: "Irregular water supply in MVP Colony Sector 1",
    summaryTe: "ఎంవీపీ కాలనీ సెక్టర్ 1 లో నీటి సరఫరా అస్థిరంగా ఉంది",
    rawText: "No water for two days in MVP Sector 1",
    lang: "en",
  },
  {
    citizenKey: "DEMO-USER-002",
    channel: "telegram",
    kind: "grievance",
    category: "streetlights",
    ward: "bheemili",
    locationText: "Bheemili beach road near bus stand",
    lat: 17.8899,
    lng: 83.4471,
    urgency: "medium",
    summaryEn: "Streetlights are not working on Bheemili beach road",
    summaryTe: "భీమిలి బీచ్ రోడ్డులో వీధి దీపాలు పనిచేయడం లేదు",
    rawText: "Beach road lights are dead after 8pm",
    lang: "en",
  },
  {
    citizenKey: "DEMO-USER-003",
    channel: "voice",
    kind: "grievance",
    category: "drainage",
    ward: "mvp",
    locationText: "MVP Sector 3",
    lat: 17.7428,
    lng: 83.3306,
    urgency: "medium",
    summaryEn: "Drainage overflow in MVP Sector 3",
    summaryTe: "ఎంవీపీ సెక్టర్ 3 లో డ్రైనేజ్ పొంగిపొర్లుతోంది",
    rawText: "Drain water is overflowing in MVP sector 3",
    lang: "en",
  },
  {
    citizenKey: "DEMO-USER-004",
    channel: "web",
    kind: "grievance",
    category: "garbage",
    ward: "gajuwaka",
    locationText: "Gajuwaka market road",
    lat: 17.6909,
    lng: 83.2081,
    urgency: "medium",
    summaryEn: "Garbage not cleared near Gajuwaka market road",
    summaryTe: "గాజువాక మార్కెట్ రోడ్డులో చెత్త తొలగించడం లేదు",
    rawText: "Garbage pile up for one week at market road",
    lang: "en",
  },
  {
    citizenKey: "DEMO-USER-005",
    channel: "telegram",
    kind: "grievance",
    category: "safety_hazard",
    ward: "mvp",
    locationText: "MVP playground junction",
    lat: 17.7448,
    lng: 83.3332,
    urgency: "safety",
    summaryEn: "Live electric wire hanging near MVP playground",
    summaryTe: "ఎంవీపీ ప్లేగ్రౌండ్ దగ్గర విద్యుత్ తీగ ప్రమాదకరంగా వేలాడుతోంది",
    rawText: "Live wire hanging low near kids park",
    lang: "en",
  },
  {
    citizenKey: "DEMO-USER-006",
    channel: "voice",
    kind: "suggestion",
    category: "community_infra",
    ward: "gajuwaka",
    locationText: "Old panchayat office lane, Gajuwaka",
    lat: 17.6887,
    lng: 83.2072,
    urgency: "low",
    summaryEn: "Need a community hall in Gajuwaka old town",
    summaryTe: "గాజువాక పాత పట్టణంలో కమ్యూనిటీ హాల్ అవసరం",
    rawText: "Please build a small community hall",
    lang: "en",
  },
  {
    citizenKey: "DEMO-USER-007",
    channel: "web",
    kind: "grievance",
    category: "potholes_roads",
    ward: "bheemili",
    locationText: "Bheemili municipal office street",
    lat: 17.8889,
    lng: 83.4462,
    urgency: "high",
    summaryEn: "Large potholes on Bheemili municipal office road",
    summaryTe: "భీమిలి మున్సిపల్ ఆఫీస్ రోడ్డులో పెద్ద గుంతలు ఉన్నాయి",
    rawText: "Road has dangerous potholes after rain",
    lang: "en",
  },
  {
    citizenKey: "DEMO-USER-008",
    channel: "telegram",
    kind: "grievance",
    category: "water_leakage",
    ward: "gajuwaka",
    locationText: "Near ZP school, Gajuwaka",
    lat: 17.6912,
    lng: 83.2092,
    urgency: "medium",
    summaryEn: "Pipeline leakage near Gajuwaka ZP school",
    summaryTe: "గాజువాక జెడ్‌పి పాఠశాల దగ్గర పైప్ లీకేజీ ఉంది",
    rawText: "Water pipeline leaking continuously",
    lang: "en",
  },
  {
    citizenKey: "DEMO-USER-009",
    channel: "voice",
    kind: "suggestion",
    category: "school_upgrade",
    ward: "gajuwaka",
    locationText: "Gajuwaka ZP High School",
    lat: 17.6904,
    lng: 83.2084,
    urgency: "medium",
    summaryEn: "Need additional classrooms and toilets in Gajuwaka school",
    summaryTe: "గాజువాక పాఠశాలలో అదనపు గదులు మరియు మరుగుదొడ్లు అవసరం",
    rawText: "School needs more classrooms and toilets",
    lang: "en",
  },
  {
    citizenKey: "DEMO-USER-010",
    channel: "web",
    kind: "suggestion",
    category: "vocational_training",
    ward: "gajuwaka",
    locationText: "Gajuwaka industrial area",
    lat: 17.6855,
    lng: 83.1986,
    urgency: "medium",
    summaryEn: "Vocational training center for unemployed youth",
    summaryTe: "నిరుద్యోగ యువత కోసం వృత్తి శిక్షణ కేంద్రం అవసరం",
    rawText: "Start a skill center for youth in industrial area",
    lang: "en",
  },
  {
    citizenKey: "DEMO-USER-011",
    channel: "telegram",
    kind: "grievance",
    category: "health_facility",
    ward: "mvp",
    locationText: "MVP urban health center lane",
    lat: 17.7432,
    lng: 83.3314,
    urgency: "high",
    summaryEn: "Primary health center lacks medicine supply",
    summaryTe: "ప్రాథమిక ఆరోగ్య కేంద్రంలో మందుల సరఫరా లేదు",
    rawText: "No basic medicines at PHC",
    lang: "en",
  },
  {
    citizenKey: "DEMO-USER-012",
    channel: "web",
    kind: "grievance",
    category: "other",
    ward: "mvp",
    locationText: "MVP Ward office",
    lat: 17.7424,
    lng: 83.3302,
    urgency: "low",
    summaryEn: "Personal pension issue follow-up required",
    summaryTe: "వ్యక్తిగత పెన్షన్ సమస్యపై ఫాలోఅప్ అవసరం",
    rawText: "My pension application is stuck for months",
    lang: "en",
  },
];

async function main() {
  console.log("Resetting submissions/demands/events for demo complaints seed...");
  await db.delete(events);
  await db.delete(submissions);
  await db.delete(demands);

  console.log(`Submitting ${COMPLAINTS.length} demo user complaints...`);
  let created = 0;

  for (const item of COMPLAINTS) {
    const req = new NextRequest("http://localhost:3000/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: item.channel,
        citizenKey: item.citizenKey,
        rawText: item.rawText,
        mediaUrl: demoThumbDataUrl(item.category),
        lang: item.lang,
        extraction: {
          kind: item.kind,
          category: item.category,
          locationText: item.locationText,
          lat: item.lat,
          lng: item.lng,
          ward: item.ward,
          urgency: item.urgency,
          summaryEn: item.summaryEn,
          summaryTe: item.summaryTe,
          confidence: 0.95,
        },
        deferMerge: true,
      }),
    });

    const res = await POST(req);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(`Insert failed: ${JSON.stringify(data)}`);
    }

    await processSubmission(data.submissionId);
    created++;
  }

  console.log(`Seeded ${created} complaints from user side.`);
  console.log("Done. Open /mp, /authority, and /user to verify flows.");
}

main().catch((err) => {
  console.error("Demo complaints seed failed:", err);
  process.exit(1);
});

