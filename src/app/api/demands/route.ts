import { desc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { demands, events } from "@/server/db/schema";
import { jsonOk, handleApiError } from "@/server/services/intake/api-helpers";

export async function GET() {
  try {
    const rows = await db.select().from(demands).orderBy(desc(demands.rankScore));

    const escalatedEvents = await db
      .select({ demandId: events.demandId })
      .from(events)
      .where(eq(events.eventType, "Escalated"));

    const escalatedSet = new Set(
      escalatedEvents.map((e) => e.demandId).filter((id): id is string => id !== null)
    );

    return jsonOk(
      rows.map((d) => ({
        id: d.id,
        title: d.title,
        category: d.category,
        kind: d.kind,
        ward: d.ward,
        lat: d.lat,
        lng: d.lng,
        affectedCount: d.affectedCount,
        urgency: d.urgency,
        state: d.state,
        visibility: d.visibility,
        rankScore: d.rankScore,
        rankBreakdown: d.rankBreakdown,
        falseClosureCount: d.falseClosureCount,
        verifiedResolved: d.verifiedResolved,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
        isEscalated: escalatedSet.has(d.id),
      })),
    );
  } catch (err) {
    return handleApiError(err);
  }
}
