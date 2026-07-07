import { NextRequest } from "next/server";
import { and, count, eq, gte } from "drizzle-orm";
import { db } from "@/server/db";
import { submissions } from "@/server/db/schema";
import { jsonOk, jsonError, handleApiError, parseJsonBody } from "@/server/services/intake/api-helpers";
import { CONFIG } from "@/server/core/config";
import { appendEvent } from "@/server/services/lifecycle/events";
import { intakeSchema } from "@/server/models/intake-schema";
import { generateRefId } from "@/server/services/intake/refid";
import { triggerMergeProcessing } from "@/server/services/engine/merge-hook";
import { withTracing, getTraceId } from "@/server/core/logger";

/** Count submissions by citizenKey in the last 24 hours. */
async function countRecentSubmissions(citizenKey: string): Promise<number> {
  const since = new Date();
  since.setHours(since.getHours() - 24);
  const [row] = await db
    .select({ n: count() })
    .from(submissions)
    .where(and(eq(submissions.citizenKey, citizenKey), gte(submissions.createdAt, since)));
  return row?.n ?? 0;
}

export async function POST(req: NextRequest) {
  return withTracing(req, async () => {
    try {
      const body = intakeSchema.parse(await parseJsonBody(req));
      const recentCount = await countRecentSubmissions(body.citizenKey);
      const overRateCap = recentCount >= CONFIG.abuse.maxSubmissionsPerIdentityPerDay;

      let status: "received" | "extracted" | "quarantined" = body.extraction ? "extracted" : "received";
      const payloadFlags: Record<string, unknown> = {};

      if (overRateCap) {
        status = "quarantined";
        payloadFlags.reason = "rate_cap";
      }

      if (
        body.extraction &&
        body.extraction.confidence < CONFIG.extraction.minConfidence
      ) {
        status = "received";
        payloadFlags.needs_human = true;
      }

      const refId = await generateRefId();

      const [row] = await db
        .insert(submissions)
        .values({
          refId,
          channel: body.channel,
          citizenKey: body.citizenKey,
          rawText: body.rawText,
          mediaUrl: body.mediaUrl,
          audioUrl: body.audioUrl,
          lang: body.lang,
          kind: body.extraction?.kind,
          category: body.extraction?.category,
          locationText: body.extraction?.locationText,
          lat: body.extraction?.lat,
          lng: body.extraction?.lng,
          ward: body.extraction?.ward,
          urgency: body.extraction?.urgency,
          summaryEn: body.extraction?.summaryEn,
          summaryTe: body.extraction?.summaryTe,
          confidence: body.extraction?.confidence,
          status,
        })
        .returning();

      await appendEvent({
        eventType: "SubmissionReceived",
        submissionId: row.id,
        actorType: "citizen",
        actorId: body.citizenKey,
        payload: {
          channel: body.channel,
          refId,
          ...(overRateCap ? { rate_cap: true } : {}),
          ...payloadFlags,
        },
      });

      if (body.extraction) {
        await appendEvent({
          eventType: "ExtractionRecorded",
          submissionId: row.id,
          actorType: "model",
          actorId: "gemini",
          payload: {
            category: body.extraction.category,
            confidence: body.extraction.confidence,
            kind: body.extraction.kind,
          },
        });
      }

      if (
        !overRateCap &&
        body.extraction &&
        !payloadFlags.needs_human &&
        !body.deferMerge &&
        body.channel !== "news"
      ) {
        const traceId = getTraceId();
        await triggerMergeProcessing(row.id, traceId);
      }

      return jsonOk({
        refId: row.refId,
        submissionId: row.id,
        status: row.status,
        ...(Object.keys(payloadFlags).length ? { flags: payloadFlags } : {}),
      });
    } catch (err) {
      return handleApiError(err);
    }
  });
}
