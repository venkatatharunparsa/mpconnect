import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { POST } from "../src/app/api/submissions/route";
import { NextRequest } from "next/server";
import { db } from "../src/server/db";
import { submissions, events } from "../src/server/db/schema";
import { count, eq, like } from "drizzle-orm";
import { createHash } from "crypto";
import * as fs from "fs";
import * as path from "path";
import { processSubmission } from "../src/server/services/merge";

const GENESIS = "mpconnect-genesis-2026";

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

function sortKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(sortKeys);
  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, sortKeys(v)])
    );
  }
  return obj;
}

function canonical(
  input: {
    eventType: string;
    demandId: string | null;
    submissionId: string | null;
    actorType: string;
    actorId: string;
    payload: Record<string, unknown>;
  },
  prevHash: string,
  occurredAt: string
) {
  return JSON.stringify({
    eventType: input.eventType,
    demandId: input.demandId ?? null,
    submissionId: input.submissionId ?? null,
    actorType: input.actorType,
    actorId: input.actorId,
    payload: sortKeys(input.payload),
    prevHash,
    occurredAt,
  });
}

// 12 Templates for Gajuwaka school upgrades (mixed Telugu/English)
const schoolTemplates = [
  { text: "Gajuwaka ZPHS school needs more classrooms, children are sitting outside.", lang: "en" as const },
  { text: "గాజువాక జిల్లా పరిషత్ ఉన్నత పాఠశాలలో అదనపు గదులు కావాలి.", lang: "te" as const },
  { text: "Need drinking water facility in Gajuwaka govt school.", lang: "en" as const },
  { text: "గాజువాక ప్రభుత్వ పాఠశాలలో మరుగుదొడ్లు బాగుచేయాలి.", lang: "te" as const },
  { text: "ZPHS school Gajuwaka lacks basic infrastructure and desks.", lang: "en" as const },
  { text: "Zilla Parishad high school Gajuwaka needs school upgrade.", lang: "en" as const },
  { text: "గాజువాక స్కూల్ లో ఫ్యాన్లు, లైట్లు పనిచేయడం లేదు. కరెంట్ కనెక్షన్ కూడా లేదు.", lang: "te" as const },
  { text: "Govt school in Gajuwaka needs library and science labs.", lang: "en" as const },
  { text: "గాజువాక హైస్కూల్ బిల్డింగ్ రిపేరు చేయాలి. గోడలు పడిపోయేలా ఉన్నాయి.", lang: "te" as const },
  { text: "Please upgrade the infrastructure at Gajuwaka ZPHS.", lang: "en" as const },
  { text: "ZPHS Gajuwaka school needs a boundary wall for student safety.", lang: "en" as const },
  { text: "గాజువాక స్కూల్ లో క్రీడా మైదానం అభివృద్ధి చేయాలి.", lang: "te" as const },
];

// Drainage phrasings for MVP ward
const drainageTemplates = [
  { text: "Drainage overflow in MVP Sector 1 near community hall.", lang: "en" as const },
  { text: "డ్రైనేజీ పూడికతీత పనులు చేయాలి, వాసన వస్తోంది MVP కాలనీ లో.", lang: "te" as const },
  { text: "Water stagnation on MVP Colony main roads due to blocked drains.", lang: "en" as const },
  { text: "MVP సెక్టార్ 3 లో డ్రైనేజీ కాలువలు శుభ్రం చేయాలి.", lang: "te" as const },
  { text: "Open drain chambers are very dangerous in MVP Sector 5.", lang: "en" as const },
];

// Streetlight phrasings for Bheemili ward
const streetlightTemplates = [
  { text: "Streetlights not working on Bheemili beach road near park.", lang: "en" as const },
  { text: "భీమిలి రోడ్డులో లైట్లు వెలగడం లేదు, రాత్రి పూట ప్రయాణం కష్టం.", lang: "te" as const },
  { text: "Dark spots near Bheemili bus stand, need new poles.", lang: "en" as const },
  { text: "భీమిలి మున్సిపల్ ఆఫీస్ వీధిలో వీధి దీపాలు మార్చాలి.", lang: "te" as const },
];

async function main() {
  console.log("Checking if synthetic corpus already exists...");
  const [existing] = await db
    .select({ count: count() })
    .from(submissions)
    .where(like(submissions.citizenKey, "SYN-%"));

  if (existing && existing.count > 0) {
    console.log(`Corpus already seeded (${existing.count} SYN- records). Skipping.`);
    process.exit(0);
  }

  console.log("Seeding synthetic citizen corpus...");

  const allSubmissions: Array<{
    citizenKey: string;
    channel: "web" | "telegram" | "voice";
    rawText: string;
    lang: "en" | "te" | "mixed";
    extraction: {
      kind: "suggestion" | "grievance";
      category: string;
      locationText: string;
      lat: number;
      lng: number;
      ward: string;
      urgency: "low" | "medium" | "high" | "safety";
      summaryEn: string;
      summaryTe: string;
      confidence: number;
    };
    backdateDays: number;
  }> = [];

  // A. 40 School Upgrade Submissions in Gajuwaka (backdated over 10 days)
  for (let i = 1; i <= 40; i++) {
    const template = schoolTemplates[(i - 1) % schoolTemplates.length];
    const lat = 17.6904 + (Math.sin(i) * 0.003);
    const lng = 83.2084 + (Math.cos(i) * 0.003);
    
    // Spread backdate between 1 and 10 days ago
    const backdateDays = 1 + (i % 10);
    
    allSubmissions.push({
      citizenKey: `SYN-GAJ-SCH-${String(i).padStart(3, "0")}`,
      channel: i % 3 === 0 ? "voice" : i % 3 === 1 ? "telegram" : "web",
      rawText: template.text,
      lang: template.lang === "te" ? "te" : "en",
      extraction: {
        kind: "suggestion",
        category: "school_upgrade",
        locationText: "Gajuwaka Ward, near ZP High School",
        lat,
        lng,
        ward: "gajuwaka",
        urgency: "medium",
        summaryEn: `Request school infrastructure upgrade and desks at Gajuwaka ZPHS`,
        summaryTe: `గాజువాక ZPHS పాఠశాల అభివృద్ధి మరియు గదుల నిర్మాణం`,
        confidence: 0.95,
      },
      backdateDays,
    });
  }

  // B. 15 Drainage Submissions in MVP ward (backdated 12 days ago)
  for (let i = 1; i <= 15; i++) {
    const template = drainageTemplates[(i - 1) % drainageTemplates.length];
    const lat = 17.7435 + (Math.sin(i) * 0.004);
    const lng = 83.3315 + (Math.cos(i) * 0.004);

    allSubmissions.push({
      citizenKey: `SYN-MVP-DRA-${String(i).padStart(3, "0")}`,
      channel: i % 2 === 0 ? "web" : "telegram",
      rawText: template.text,
      lang: template.lang === "te" ? "te" : "en",
      extraction: {
        kind: "grievance",
        category: "drainage",
        locationText: `MVP Colony, Sector ${1 + (i % 5)}`,
        lat,
        lng,
        ward: "mvp",
        urgency: "medium",
        summaryEn: `Drainage issue and water stagnation in MVP Sector`,
        summaryTe: `MVP కాలనీ లో డ్రైనేజీ సమస్య మరియు నిల్వ నీరు`,
        confidence: 0.95,
      },
      backdateDays: 12,
    });
  }

  // C. 10 Streetlight Submissions in Bheemili ward (backdated 13 days ago)
  for (let i = 1; i <= 10; i++) {
    const template = streetlightTemplates[(i - 1) % streetlightTemplates.length];
    const lat = 17.8894 + (Math.sin(i) * 0.004);
    const lng = 83.4475 + (Math.cos(i) * 0.004);

    allSubmissions.push({
      citizenKey: `SYN-BHE-LGT-${String(i).padStart(3, "0")}`,
      channel: i % 2 === 0 ? "web" : "telegram",
      rawText: template.text,
      lang: template.lang === "te" ? "te" : "en",
      extraction: {
        kind: "grievance",
        category: "streetlights",
        locationText: "Bheemili Beach Road area",
        lat,
        lng,
        ward: "bheemili",
        urgency: "medium",
        summaryEn: `Streetlights not working on Bheemili Beach Road`,
        summaryTe: `భీమిలి బీచ్ రోడ్ వీధి దీపాలు పనిచేయడం లేదు`,
        confidence: 0.95,
      },
      backdateDays: 13,
    });
  }

  // D. 20 Scattered Singles across other categories (backdated 14 days ago)
  const categories = ["garbage", "potholes_roads", "water_supply", "water_leakage", "electricity", "parks_playgrounds", "community_infra", "pollution", "encroachment"];
  const wardsList = ["gajuwaka", "mvp", "bheemili"];
  for (let i = 1; i <= 20; i++) {
    const category = categories[i % categories.length];
    const ward = wardsList[i % wardsList.length];
    
    let lat = 17.6904;
    let lng = 83.2084;
    if (ward === "mvp") {
      lat = 17.7435;
      lng = 83.3315;
    } else if (ward === "bheemili") {
      lat = 17.8894;
      lng = 83.4475;
    }
    lat += (Math.sin(i) * 0.01);
    lng += (Math.cos(i) * 0.01);

    allSubmissions.push({
      citizenKey: `SYN-SNG-${String(i).padStart(3, "0")}`,
      channel: "web",
      rawText: `Scattered issue for category ${category} in ${ward}`,
      lang: "en",
      extraction: {
        kind: category === "parks_playgrounds" || category === "community_infra" ? "suggestion" : "grievance",
        category,
        locationText: `${ward} central area`,
        lat,
        lng,
        ward,
        urgency: "low",
        summaryEn: `Scattered issue of ${category} in ${ward}`,
        summaryTe: `${ward} లో ${category} సమస్య`,
        confidence: 0.85,
      },
      backdateDays: 14,
    });
  }

  // E. 1 Competing Suggestion (Vocational Centre in Gajuwaka, backdated 15 days ago)
  allSubmissions.push({
    citizenKey: "SYN-GAJ-COMP-001",
    channel: "web",
    rawText: "We need a vocational training and skill development centre for unemployed youth in Gajuwaka industrial zone.",
    lang: "en",
    extraction: {
      kind: "suggestion",
      category: "vocational_training",
      locationText: "Gajuwaka Industrial Area",
      lat: 17.6854,
      lng: 83.1984,
      ward: "gajuwaka",
      urgency: "medium",
      summaryEn: "Establish a vocational training and skill development centre in Gajuwaka",
      summaryTe: "గాజువాకలో యువత కోసం వృత్తి విద్యా శిక్షణ కేంద్రం ఏర్పాటు",
      confidence: 0.98,
    },
    backdateDays: 15,
  });

  // F. 1 Safety Hazard (backdated 16 days ago)
  allSubmissions.push({
    citizenKey: "SYN-MVP-HAZ-001",
    channel: "telegram",
    rawText: "DANGEROUS: Live electrical wire hanging extremely low near MVP Colony playground. High risk of accident for kids playing nearby!",
    lang: "en",
    extraction: {
      kind: "grievance",
      category: "safety_hazard",
      locationText: "MVP Colony playground area",
      lat: 17.7445,
      lng: 83.3325,
      ward: "mvp",
      urgency: "safety",
      summaryEn: "Live electric wire hanging low near MVP playground",
      summaryTe: "MVP ప్లేగ్రౌండ్ వద్ద ప్రమాదకరంగా కిందకు వేలాడుతున్న విద్యుత్ తీగ",
      confidence: 0.99,
    },
    backdateDays: 16,
  });

  // G. 1 Ambiguous school-upgrade case (current time - no backdate)
  allSubmissions.push({
    citizenKey: "SYN-GAJ-SCH-AMBIGUOUS",
    channel: "web",
    rawText: "smart class equipment needed",
    lang: "en",
    extraction: {
      kind: "suggestion",
      category: "school_upgrade",
      locationText: "Gajuwaka high school area",
      lat: 17.6915, // close but slightly scattered (120m away)
      lng: 83.2095,
      ward: "gajuwaka",
      urgency: "medium",
      summaryEn: "smart class equipment",
      summaryTe: "గాజువాక పాఠశాలలో స్మార్ట్ క్లాస్ పరికరాలు",
      confidence: 0.95,
    },
    backdateDays: 0,
  });


  // Insert all submissions using the API POST route logic
  console.log(`Submitting ${allSubmissions.length} submissions to database...`);
  
  let countCreated = 0;
  for (const item of allSubmissions) {
    const req = new NextRequest("http://localhost:3000/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: item.channel,
        citizenKey: item.citizenKey,
        rawText: item.rawText,
        lang: item.lang,
        extraction: item.extraction,
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    if (res.status !== 200) {
      console.error(`Failed to insert synthetic submission: ${JSON.stringify(data)}`);
      process.exit(1);
    }

    const subId = data.submissionId;

    // Apply backdating if required
    if (item.backdateDays && item.backdateDays > 0) {
      const backdatedDate = new Date();
      backdatedDate.setDate(backdatedDate.getDate() - item.backdateDays);

      // 1. Update submission createdAt
      await db.update(submissions).set({ createdAt: backdatedDate }).where(eq(submissions.id, subId));

      // 2. Fetch events created for this submission and update their occurredAt and hashes
      const subEvents = await db.select().from(events).where(eq(events.submissionId, subId));
      for (const ev of subEvents) {
        // Because demandId is null, prevHash is GENESIS
        const newHash = sha256(
          canonical(
            {
              eventType: ev.eventType,
              demandId: ev.demandId,
              submissionId: ev.submissionId,
              actorType: ev.actorType,
              actorId: ev.actorId,
              payload: ev.payload as Record<string, unknown>,
            },
            GENESIS,
            backdatedDate.toISOString()
          )
        );

        await db
          .update(events)
          .set({ occurredAt: backdatedDate, hash: newHash, prevHash: GENESIS })
          .where(eq(events.id, ev.id));
      }
    }

    // Call processSubmission synchronously to prevent parallel race conditions
    await processSubmission(subId);

    countCreated++;
    if (countCreated % 10 === 0) {
      console.log(`Processed ${countCreated}/${allSubmissions.length} submissions...`);
    }
  }

  // H. 15 Attack templates (do NOT submit, write to seed/attack-corpus.json)
  console.log("Generating 15 coordination attack templates...");
  const attackTemplates: Array<{
    channel: "web" | "telegram";
    citizenKey: string;
    rawText: string;
    lang: "en";
    extraction: {
      kind: "grievance";
      category: string;
      locationText: string;
      lat: number;
      lng: number;
      ward: string;
      urgency: "medium";
      summaryEn: string;
      confidence: number;
    };
  }> = [];

  for (let i = 1; i <= 15; i++) {
    attackTemplates.push({
      channel: "web",
      citizenKey: `SYN-ATK-${String(i).padStart(3, "0")}`,
      rawText: "Fake coordination report: massive garbage pile and bad smell in MVP sector 2.",
      lang: "en",
      extraction: {
        kind: "grievance",
        category: "garbage",
        locationText: "MVP Colony Sector 2",
        lat: 17.7450, // identical coordinate
        lng: 83.3330, // identical coordinate
        ward: "mvp",
        urgency: "medium",
        summaryEn: "Fake coordination report: garbage in MVP Colony Sector 2",
        confidence: 0.95,
      },
    });
  }

  const attackFilePath = path.join(process.cwd(), "seed", "attack-corpus.json");
  fs.writeFileSync(attackFilePath, JSON.stringify(attackTemplates, null, 2));
  console.log(`Wrote 15 attack templates to ${attackFilePath}`);

  console.log(`Successfully seeded ${allSubmissions.length} synthetic reports and attack file!`);
  process.exit(0);
}

main().catch((e) => {
  console.error("Error running corpus seeding:", e);
  process.exit(1);
});
