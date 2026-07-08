import { eq, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { demands } from "@/server/db/schema";
import { jsonOk, jsonError, handleApiError } from "@/server/services/intake/api-helpers";
import { appendEvent } from "@/server/services/lifecycle/events";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const [demand] = await db.select().from(demands).where(eq(demands.id, params.id)).limit(1);
    if (!demand) return jsonError("Demand not found", 404);

    // Increment affectedCount
    await db
      .update(demands)
      .set({
        affectedCount: sql`${demands.affectedCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(demands.id, params.id));

    // Append event to event log for audit trail and prev-hash chain validation
    await appendEvent({
      eventType: "SupportMarked",
      demandId: params.id,
      actorType: "citizen",
      actorId: "anon-citizen",
      payload: { note: "Citizen flagged 'affects me too'" },
    });

    return jsonOk({ demandId: params.id, affectedCount: demand.affectedCount + 1 });
  } catch (err) {
    return handleApiError(err);
  }
}
