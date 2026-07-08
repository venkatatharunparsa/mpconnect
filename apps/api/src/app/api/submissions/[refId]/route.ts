import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { demands, submissions } from "@/server/db/schema";
import { jsonOk, jsonError, handleApiError } from "@/server/services/intake/api-helpers";
import { demandTimeline } from "@/server/services/lifecycle/events";
import { isValidRefIdFormat } from "@/server/services/intake/refid";

export async function GET(
  _req: Request,
  { params }: { params: { refId: string } },
) {
  try {
    const { refId } = params;
    if (!isValidRefIdFormat(refId)) {
      return jsonError("Invalid reference ID format", 400);
    }

    const [sub] = await db
      .select()
      .from(submissions)
      .where(eq(submissions.refId, refId))
      .limit(1);

    if (!sub) return jsonError("Submission not found", 404);

    let demand = null;
    let timeline: Awaited<ReturnType<typeof demandTimeline>> = [];

    if (sub.demandId) {
      const [d] = await db.select().from(demands).where(eq(demands.id, sub.demandId)).limit(1);
      demand = d
        ? {
            id: d.id,
            title: d.title,
            state: d.state,
            affectedCount: d.affectedCount,
            ward: d.ward,
          }
        : null;
      timeline = await demandTimeline(sub.demandId);
    }

    return jsonOk({
      refId: sub.refId,
      status: sub.status,
      channel: sub.channel,
      summaryEn: sub.summaryEn,
      summaryTe: sub.summaryTe,
      category: sub.category,
      ward: sub.ward,
      createdAt: sub.createdAt,
      demand,
      timeline: timeline.map((e) => ({
        eventType: e.eventType,
        actorType: e.actorType,
        occurredAt: e.occurredAt,
        payload: e.payload,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
