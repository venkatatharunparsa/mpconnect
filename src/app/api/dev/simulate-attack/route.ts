import { NextRequest } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { jsonOk, jsonError, handleApiError } from "@/server/services/api-helpers";
import { intakeSchema } from "@/server/services/intake-schema";
import { generateRefId } from "@/server/services/refid";
import { db } from "@/server/db";
import { submissions } from "@/server/db/schema";
import { appendEvent } from "@/server/services/events";
import { checkCluster } from "@/server/services/abuse-cluster";

const ATTACK_TEMPLATE =
  "There is a major pothole on Main Road near the bus stop causing accidents daily please fix immediately";

const DEFAULT_ATTACK = Array.from({ length: 15 }, (_, i) => ({
  channel: "web" as const,
  citizenKey: `ATTACK-COLD-${String(i).padStart(3, "0")}`,
  rawText: ATTACK_TEMPLATE,
  lang: "en" as const,
  extraction: {
    kind: "grievance" as const,
    category: "potholes_roads",
    locationText: "Main Road near bus stop",
    lat: 17.6868,
    lng: 83.2185,
    ward: "gajuwaka",
    urgency: "high" as const,
    summaryEn: "Pothole on Main Road near bus stop",
    confidence: 0.85,
  },
}));

async function loadAttackCorpus() {
  try {
    const file = path.join(process.cwd(), "seed", "attack-corpus.json");
    const raw = await readFile(file, "utf-8");
    return JSON.parse(raw) as typeof DEFAULT_ATTACK;
  } catch {
    return DEFAULT_ATTACK;
  }
}

/**
 * DEV-ONLY: simulate coordinated fake-report attack.
 * Guarded behind ENABLE_DEV_ENDPOINTS=true.
 */
export async function POST(req: NextRequest) {
  try {
    if (process.env.ENABLE_DEV_ENDPOINTS !== "true") {
      return jsonError("Dev endpoints disabled", 403);
    }

    const corpus = await loadAttackCorpus();
    const created: Array<{ refId: string; submissionId: string; status: string }> = [];

    for (const item of corpus) {
      const body = intakeSchema.parse(item);
      const refId = await generateRefId();

      const [row] = await db
        .insert(submissions)
        .values({
          refId,
          channel: body.channel,
          citizenKey: body.citizenKey,
          rawText: body.rawText,
          lang: body.lang,
          kind: body.extraction?.kind,
          category: body.extraction?.category,
          locationText: body.extraction?.locationText,
          lat: body.extraction?.lat,
          lng: body.extraction?.lng,
          ward: body.extraction?.ward,
          urgency: body.extraction?.urgency,
          summaryEn: body.extraction?.summaryEn,
          confidence: body.extraction?.confidence,
          status: "extracted",
        })
        .returning();

      await appendEvent({
        eventType: "SubmissionReceived",
        submissionId: row.id,
        actorType: "citizen",
        actorId: body.citizenKey,
        payload: { channel: body.channel, refId, simulated: true },
      });

      created.push({ refId: row.refId, submissionId: row.id, status: row.status });
    }

    const lastId = created[created.length - 1]?.submissionId;
    let clusterResult: { quarantined: boolean; score?: number; clusterIds?: string[] } = {
      quarantined: false,
      score: 0,
    };
    if (lastId) {
      clusterResult = await checkCluster(lastId);
    }

    const allSubs = await db.select().from(submissions);
    const quarantinedCount = allSubs.filter((s) => s.status === "quarantined").length;

    return jsonOk({
      submitted: created.length,
      quarantined: quarantinedCount,
      clusterCheck: clusterResult,
      message:
        quarantinedCount > 0
          ? "Attack absorbed — submissions quarantined, public map unchanged"
          : "Attack submitted — run checkCluster after corpus grows",
    });
  } catch (err) {
    return handleApiError(err);
  }
}
