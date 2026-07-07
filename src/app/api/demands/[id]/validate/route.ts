import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { demands } from "@/server/db/schema";
import { jsonOk, jsonError, handleApiError, parseJsonBody } from "@/server/services/intake/api-helpers";
import { appendEvent } from "@/server/services/lifecycle/events";
import { transition } from "@/server/services/lifecycle/lifecycle";
import type { DemandState } from "@/server/services/lifecycle/lifecycle";

const bodySchema = z
  .object({
    actorId: z.string().min(1),
  })
  .strict();

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const body = bodySchema.parse(await parseJsonBody(req));
    const [demand] = await db.select().from(demands).where(eq(demands.id, params.id)).limit(1);
    if (!demand) return jsonError("Demand not found", 404);

    if (demand.state !== "claimed") {
      return jsonError(`Cannot validate from state: ${demand.state}`, 409);
    }

    const newState = transition(demand.state as DemandState, "validate");

    await db
      .update(demands)
      .set({
        state: newState,
        visibility: "public",
        updatedAt: new Date(),
      })
      .where(eq(demands.id, params.id));

    await appendEvent({
      eventType: "DemandValidated",
      demandId: params.id,
      actorType: "human",
      actorId: body.actorId,
      payload: { previousState: demand.state, newState },
    });

    return jsonOk({ demandId: params.id, state: newState, visibility: "public" });
  } catch (err) {
    return handleApiError(err);
  }
}
