import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { submissions } from "@/server/db/schema";
import { jsonOk, jsonError, handleApiError, parseJsonBody } from "@/server/services/intake/api-helpers";
import { appendEvent } from "@/server/services/lifecycle/events";

const bodySchema = z
  .object({
    decision: z.enum(["merge", "new", "attach"]),
    demandId: z.string().uuid().optional(),
    actorId: z.string().min(1),
  })
  .strict();

/**
 * Human merge-review decision (thetaLo..thetaHi band).
 * Core logic lives in src/lib/merge.ts (Person C); this route delegates when available.
 */
export async function POST(
  req: Request,
  { params }: { params: { submissionId: string } },
) {
  try {
    const body = bodySchema.parse(await parseJsonBody(req));
    const [sub] = await db
      .select()
      .from(submissions)
      .where(eq(submissions.id, params.submissionId))
      .limit(1);

    if (!sub) return jsonError("Submission not found", 404);

    try {
      const mod = await import("@/server/services/engine/merge");
      if (typeof mod.applyMergeReviewDecision === "function") {
        const result = await mod.applyMergeReviewDecision({
          submissionId: params.submissionId,
          decision: body.decision,
          demandId: body.demandId,
          actorId: body.actorId,
        });
        return jsonOk(result);
      }
    } catch {
      // merge.ts not yet implemented
    }

    await appendEvent({
      eventType: "MergeReviewDecision",
      submissionId: params.submissionId,
      demandId: body.demandId ?? sub.demandId,
      actorType: "human",
      actorId: body.actorId,
      payload: { decision: body.decision, pendingImplementation: true },
    });

    return jsonOk({
      submissionId: params.submissionId,
      decision: body.decision,
      status: "recorded",
      note: "Merge engine (Person C) will wire full logic in applyMergeReviewDecision",
    });
  } catch (err) {
    return handleApiError(err);
  }
}
