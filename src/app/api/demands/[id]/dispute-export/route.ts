import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { demands, events } from "@/server/db/schema";
import { jsonOk, jsonError, handleApiError } from "@/server/services/intake/api-helpers";
import { withTracing } from "@/server/core/logger";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  return withTracing(req, async () => {
    try {
      const [demand] = await db.select().from(demands).where(eq(demands.id, params.id)).limit(1);
      if (!demand) return jsonError("Demand not found", 404);
      if (demand.kind !== "dispute") {
        return jsonError("Demand is not classified as a DISPUTE", 400);
      }

      // Fetch chronological events for this dispute
      const ledgerEvents = await db
        .select()
        .from(events)
        .where(eq(events.demandId, params.id))
        .orderBy(events.occurredAt);

      const chronology = ledgerEvents.map((evt) => ({
        eventId: evt.id,
        eventType: evt.eventType,
        actorType: evt.actorType,
        actorId: evt.actorId,
        occurredAt: evt.occurredAt,
        hash: evt.hash,
        payload: evt.payload,
      }));

      // Build RTI annexure structure
      const rtiAnnexure = {
        title: `RTI Case Ledger Annexure - Dispute Case ${demand.id}`,
        generatedAt: new Date().toISOString(),
        metadata: {
          demandId: demand.id,
          category: demand.category,
          ward: demand.ward,
          title: demand.title,
          falseClosureCount: demand.falseClosureCount,
        },
        chronology,
      };

      return jsonOk(rtiAnnexure);
    } catch (err) {
      return handleApiError(err);
    }
  });
}
