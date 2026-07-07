import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { demands } from "@/server/db/schema";
import { jsonOk, jsonError, handleApiError, parseJsonBody } from "@/server/services/intake/api-helpers";
import { appendEvent } from "@/server/services/lifecycle/events";
import { withTracing } from "@/server/core/logger";

const bodySchema = z
  .object({
    kind: z.enum(["grievance", "project", "dispute"]),
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
      const [demand] = await db.select().from(demands).where(eq(demands.id, params.id)).limit(1);
      if (!demand) return jsonError("Demand not found", 404);

      let newState = demand.state;
      if (body.kind === "project") {
        newState = "identified";
      } else if (body.kind === "dispute") {
        newState = "dispute_active";
      } else if (body.kind === "grievance") {
        newState = "claimed";
      }

      await db
        .update(demands)
        .set({
          kind: body.kind,
          state: newState,
          updatedAt: new Date(),
        })
        .where(eq(demands.id, params.id));

      await appendEvent({
        eventType: "DemandReclassified",
        demandId: params.id,
        actorType: "human",
        actorId: body.actorId,
        payload: {
          previousKind: demand.kind,
          newKind: body.kind,
          previousState: demand.state,
          newState,
        },
      });

      return jsonOk({
        demandId: params.id,
        kind: body.kind,
        state: newState,
      });
    } catch (err) {
      return handleApiError(err);
    }
  });
}
