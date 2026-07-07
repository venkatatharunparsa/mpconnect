import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { submissions } from "@/server/db/schema";
import { jsonOk, jsonError, handleApiError, parseJsonBody } from "@/server/services/api-helpers";
import { appendEvent } from "@/server/services/events";
import { triggerMergeProcessing } from "@/server/services/merge-hook";

const bodySchema = z
  .object({
    action: z.enum(["release", "reject"]),
    actorId: z.string().min(1),
    reason: z.string().optional(),
  })
  .strict();

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
    if (sub.status !== "quarantined") {
      return jsonError(`Submission is not quarantined (status: ${sub.status})`, 409);
    }

    if (body.action === "release") {
      const newStatus = sub.category ? "extracted" : "received";
      await db
        .update(submissions)
        .set({ status: newStatus })
        .where(eq(submissions.id, params.submissionId));

      await appendEvent({
        eventType: "QuarantineReleased",
        submissionId: params.submissionId,
        demandId: sub.demandId,
        actorType: "human",
        actorId: body.actorId,
        payload: { previousStatus: sub.status, newStatus },
      });

      triggerMergeProcessing(params.submissionId).catch(console.error);

      return jsonOk({ submissionId: params.submissionId, status: newStatus, action: "release" });
    }

    await db
      .update(submissions)
      .set({ status: "rejected" })
      .where(eq(submissions.id, params.submissionId));

    await appendEvent({
      eventType: "QuarantineRejected",
      submissionId: params.submissionId,
      actorType: "human",
      actorId: body.actorId,
      payload: {
        reason:
          body.reason ??
          "could not be verified; awaiting corroboration or evidence",
      },
    });

    return jsonOk({
      submissionId: params.submissionId,
      status: "rejected",
      action: "reject",
      citizenMessage:
        "could not be verified; awaiting corroboration or evidence",
    });
  } catch (err) {
    return handleApiError(err);
  }
}
