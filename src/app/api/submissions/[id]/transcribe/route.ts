import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { submissions } from "@/server/db/schema";
import { jsonOk, jsonError, handleApiError, parseJsonBody } from "@/server/services/intake/api-helpers";
import { appendEvent } from "@/server/services/lifecycle/events";
import { extractSubmission } from "@/server/clients/gemini";
import { triggerMergeProcessing } from "@/server/services/engine/merge-hook";
import { withTracing, getTraceId } from "@/server/core/logger";

const bodySchema = z
  .object({
    text: z.string().min(1),
    actorId: z.string().min(1),
  })
  .strict();

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  return withTracing(req, async () => {
    try {
      const body = bodySchema.parse(await parseJsonBody(req));
      const [sub] = await db.select().from(submissions).where(eq(submissions.id, params.id)).limit(1);
      if (!sub) return jsonError("Submission not found", 404);

      // Perform Gemini extraction over the human-corrected text
      const result = await extractSubmission({ text: body.text });
      if (result.needsHuman) {
        return jsonError("Gemini failed to extract metadata even from corrected text", 422);
      }

      const { extraction } = result;

      // Update the submission with the new text and high human confidence
      await db
        .update(submissions)
        .set({
          rawText: body.text,
          kind: extraction.kind,
          category: extraction.category,
          locationText: extraction.locationText,
          urgency: extraction.urgency,
          summaryEn: extraction.summaryEn,
          summaryTe: extraction.summaryTe,
          confidence: 1.0, // Human override
          asrConfidence: 1.0, // Corrected
          status: "extracted",
        })
        .where(eq(submissions.id, params.id));

      await appendEvent({
        eventType: "SubmissionTranscribed",
        submissionId: params.id,
        actorType: "human",
        actorId: body.actorId,
        payload: {
          previousText: sub.rawText,
          newText: body.text,
        },
      });

      await appendEvent({
        eventType: "ExtractionRecorded",
        submissionId: params.id,
        actorType: "model",
        actorId: "gemini",
        payload: {
          category: extraction.category,
          confidence: 1.0,
          kind: extraction.kind,
        },
      });

      // Run merge engine mapping matching trigger
      const traceId = getTraceId();
      await triggerMergeProcessing(params.id, traceId);

      return jsonOk({
        submissionId: params.id,
        status: "extracted",
        refId: sub.refId,
      });
    } catch (err) {
      return handleApiError(err);
    }
  });
}
