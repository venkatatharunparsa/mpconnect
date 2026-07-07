import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { submissions } from "@/server/db/schema";
import { jsonOk, jsonError, handleApiError, parseJsonBody } from "@/server/services/api-helpers";
import { appendEvent } from "@/server/services/events";
import { triggerMergeProcessing } from "@/server/services/merge-hook";

const bodySchema = z
  .object({
    action: z.enum(["approve", "reject"]),
    category: z.string().optional(),
    ward: z.string().optional(),
    reason: z.string().optional(),
    actorId: z.string().min(1).optional(),
  })
  .strict();

export async function POST(
  req: Request,
  { params }: { params: { submissionId: string } },
) {
  try {
    const body = bodySchema.parse(await parseJsonBody(req));
    const actorId = body.actorId ?? "reviewer";

    const [sub] = await db
      .select()
      .from(submissions)
      .where(eq(submissions.id, params.submissionId))
      .limit(1);

    if (!sub) return jsonError("Submission not found", 404);

    if (body.action === "reject") {
      await db
        .update(submissions)
        .set({ status: "rejected" })
        .where(eq(submissions.id, params.submissionId));

      await appendEvent({
        eventType: "ValidationRejected",
        submissionId: params.submissionId,
        actorType: "human",
        actorId,
        payload: { reason: body.reason ?? "insufficient_detail" },
      });

      return jsonOk({ submissionId: params.submissionId, status: "rejected" });
    }

    await db
      .update(submissions)
      .set({
        status: "extracted",
        category: body.category ?? sub.category,
        ward: body.ward ?? sub.ward,
      })
      .where(eq(submissions.id, params.submissionId));

    await appendEvent({
      eventType: "ValidationApproved",
      submissionId: params.submissionId,
      actorType: "human",
      actorId,
      payload: {
        category: body.category ?? sub.category,
        ward: body.ward ?? sub.ward,
      },
    });

    await triggerMergeProcessing(params.submissionId);

    return jsonOk({ submissionId: params.submissionId, status: "extracted" });
  } catch (err) {
    return handleApiError(err);
  }
}
