import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { demands } from "@/server/db/schema";
import { jsonOk, jsonError, handleApiError } from "@/server/services/api-helpers";
import { demandTimeline, verifyChain } from "@/server/services/events";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const [demand] = await db.select().from(demands).where(eq(demands.id, params.id)).limit(1);
    if (!demand) return jsonError("Demand not found", 404);

    const timeline = await demandTimeline(demand.id);
    const chain = await verifyChain(demand.id);

    return jsonOk({
      ...demand,
      timeline: timeline.map((e) => ({
        id: e.id,
        eventType: e.eventType,
        actorType: e.actorType,
        actorId: e.actorId,
        payload: e.payload,
        hash: e.hash,
        occurredAt: e.occurredAt,
      })),
      chainVerified: chain.ok,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
