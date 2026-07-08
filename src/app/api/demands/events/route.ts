import { desc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { events, demands } from "@/server/db/schema";
import { jsonOk, handleApiError } from "@/server/services/intake/api-helpers";

export async function GET() {
  try {
    const rows = await db
      .select({
        id: events.id,
        eventType: events.eventType,
        actorType: events.actorType,
        actorId: events.actorId,
        demandId: events.demandId,
        submissionId: events.submissionId,
        payload: events.payload,
        createdAt: events.occurredAt,
        demandTitle: demands.title,
      })
      .from(events)
      .leftJoin(demands, eq(events.demandId, demands.id))
      .orderBy(desc(events.occurredAt))
      .limit(30);

    return jsonOk(rows);
  } catch (err) {
    return handleApiError(err);
  }
}
